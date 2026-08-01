/**
 * Calcul simplifié du % de complétion du jour (pour rappels push).
 * Aligné sur la logique web pour DAILY / WEEKLY / MONTHLY / ONDAY.
 */

type Recurrence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONDAY'
type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export interface TodoRowLite {
  id: string
  recurrence: Recurrence
  days: Weekday[] | null
  day_of_month: number | null
  early_completable: boolean
  deadline: string | null
  deadline_updated_at: Date | string | null
  enabled: boolean
  archived: boolean
  created_at: Date | string
}

export interface HistoryRowLite {
  id: string
  todo_id: string
  date: string
  status: 'DONE' | 'MISSED'
}

const DAY_INDEX: Record<Weekday, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
}

function toDateOnly(value: string | Date | null | undefined): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
    return match?.[1] ?? null
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear()
    const m = String(value.getUTCMonth() + 1).padStart(2, '0')
    const d = String(value.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return null
}

function parseYmd(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!))
}

function weekdayOf(dateStr: string): Weekday {
  const day = parseYmd(dateStr).getUTCDay()
  const entry = (Object.entries(DAY_INDEX) as [Weekday, number][]).find(([, i]) => i === day)
  return entry?.[0] ?? 'MON'
}

function cycleStart(todo: TodoRowLite): string {
  const fromUpdated = toDateOnly(todo.deadline_updated_at)
  if (fromUpdated) return fromUpdated
  return toDateOnly(todo.created_at) ?? '1970-01-01'
}

function isScheduledOn(todo: TodoRowLite, dateStr: string): boolean {
  if (!todo.enabled || todo.archived) return false
  const created = toDateOnly(todo.created_at)
  if (created && dateStr < created) return false

  switch (todo.recurrence) {
    case 'DAILY':
      return true
    case 'WEEKLY':
      return Boolean(todo.days?.includes(weekdayOf(dateStr)))
    case 'ONDAY': {
      if (!todo.deadline) return false
      const deadline = toDateOnly(todo.deadline)
      if (!deadline) return false
      return dateStr >= cycleStart(todo) && dateStr <= deadline
    }
    case 'MONTHLY': {
      const createdDay = created ? Number(created.slice(8, 10)) : 1
      const target = todo.day_of_month ?? createdDay
      return Number(dateStr.slice(8, 10)) === target
    }
    default:
      return false
  }
}

function isDoneToday(
  todo: TodoRowLite,
  dateStr: string,
  entries: HistoryRowLite[],
): boolean {
  if (todo.recurrence === 'ONDAY') {
    const start = cycleStart(todo)
    const deadline = toDateOnly(todo.deadline) ?? dateStr
    return entries.some(
      (entry) =>
        entry.todo_id === todo.id &&
        entry.status === 'DONE' &&
        entry.date >= start &&
        entry.date <= deadline,
    )
  }

  return entries.some(
    (entry) => entry.todo_id === todo.id && entry.date === dateStr && entry.status === 'DONE',
  )
}

export function computeDayCompletion(
  todos: TodoRowLite[],
  entries: HistoryRowLite[],
  dateStr: string,
): { total: number; done: number; completionRate: number } {
  const scheduled = todos.filter((todo) => isScheduledOn(todo, dateStr))

  // Les échéances ne comptent qu’une fois
  const unique = new Map<string, TodoRowLite>()
  for (const todo of scheduled) {
    if (todo.recurrence === 'ONDAY') {
      if (!unique.has(todo.id)) unique.set(todo.id, todo)
    } else {
      unique.set(`${todo.id}:${dateStr}`, todo)
    }
  }

  const list = [...unique.values()]
  const total = list.length
  const done = list.filter((todo) => isDoneToday(todo, dateStr, entries)).length
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, completionRate }
}
