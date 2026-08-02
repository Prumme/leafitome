import type { HistoryEntry } from '@/features/history/types/history.types'
import type { Todo } from '@/features/todos/types/todo.types'
import {
  dayMatches,
  getDayOfMonth,
  getDatesInRange,
  getMonthRange,
  getWeekRange,
  parseDateString,
  toDateString,
  todayString,
} from '@/shared/utils/dates'

export function isDeadlineTodo(todo: Todo): boolean {
  return todo.recurrence === 'ONDAY'
}

/** Début du cycle courant (YYYY-MM-DD) pour une todo à échéance. */
export function getDeadlineCycleStart(todo: Todo): string {
  if (todo.deadlineUpdatedAt) return todo.deadlineUpdatedAt.slice(0, 10)
  return todo.createdAt.slice(0, 10)
}

/**
 * DONE du cycle courant : coché un jour >= début de cycle et <= deadline.
 */
export function findDeadlineCycleDone(
  todo: Todo,
  entries: HistoryEntry[],
): HistoryEntry | undefined {
  if (!isDeadlineTodo(todo) || !todo.deadline) return undefined
  const cycleStart = getDeadlineCycleStart(todo)
  return entries.find(
    (entry) =>
      entry.todoId === todo.id &&
      entry.status === 'DONE' &&
      entry.date >= cycleStart &&
      entry.date <= todo.deadline!,
  )
}

/**
 * Détermine si une todo est planifiée pour une date donnée.
 */
export function isTodoScheduledOn(todo: Todo, date: Date): boolean {
  if (!todo.enabled || todo.archived) return false

  const created = parseDateString(todo.createdAt.slice(0, 10))
  if (date < created) return false

  switch (todo.recurrence) {
    case 'DAILY':
      return true
    case 'WEEKLY':
      return dayMatches(todo.days, date)
    case 'ONDAY': {
      if (!todo.deadline) return false
      const dayStr = toDateString(date)
      // Visible du début du cycle jusqu’à la deadline inclusive
      return dayStr >= getDeadlineCycleStart(todo) && dayStr <= todo.deadline
    }
    case 'MONTHLY': {
      const target = todo.dayOfMonth ?? getDayOfMonth(created)
      return getDayOfMonth(date) === target
    }
    default: {
      const _exhaustive: never = todo.recurrence
      return _exhaustive
    }
  }
}

export function supportsEarlyCompletion(todo: Todo): boolean {
  return (
    Boolean(todo.earlyCompletable) &&
    (todo.recurrence === 'WEEKLY' || todo.recurrence === 'MONTHLY')
  )
}

/**
 * Prochaine date planifiée dans la période (semaine ou mois), à partir de `from` (inclus).
 */
export function getNextScheduledDateInPeriod(todo: Todo, from: Date): Date | null {
  if (!supportsEarlyCompletion(todo)) return null

  const range =
    todo.recurrence === 'WEEKLY' ? getWeekRange(from) : getMonthRange(from)

  const start = from > range.start ? from : range.start
  const dates = getDatesInRange(start, range.end)

  for (const date of dates) {
    if (isTodoScheduledOn(todo, date)) return date
  }

  return null
}

export function getScheduledTodosForDate(todos: Todo[], date: Date): Todo[] {
  return todos.filter((todo) => isTodoScheduledOn(todo, date))
}

/** Todos qui comptent pour la heatmap / streak (pas les échéances ni les partagées). */
export function todosForActivity(todos: Todo[]): Todo[] {
  return todos.filter((todo) => !isDeadlineTodo(todo) && !todo.shared)
}

export function isDeadlineOverdue(todo: Todo, reference = todayString()): boolean {
  return isDeadlineTodo(todo) && Boolean(todo.deadline) && reference > todo.deadline!
}

export const RECURRENCE_LABELS: Record<Todo['recurrence'], string> = {
  DAILY: 'Quotidienne',
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuelle',
  ONDAY: 'Échéance',
}

export const PRIORITY_LABELS: Record<Todo['priority'], string> = {
  VLOW: 'Très basse',
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  VHIGH: 'Très haute',
}

export const PRIORITY_ORDER: Record<Todo['priority'], number> = {
  VHIGH: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  VLOW: 1,
}

export function sortTodosByPriority(todos: Todo[]): Todo[] {
  return [...todos].sort(
    (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] || a.name.localeCompare(b.name),
  )
}
