import type { Todo } from '@/features/todos/types/todo.types'
import {
  dayMatches,
  getDayOfMonth,
  getDatesInRange,
  getMonthRange,
  getWeekRange,
  parseDateString,
} from '@/shared/utils/dates'

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
    case 'ONDAY':
      return dayMatches(todo.days, date)
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

export const RECURRENCE_LABELS: Record<Todo['recurrence'], string> = {
  DAILY: 'Quotidienne',
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuelle',
  ONDAY: 'Jours précis',
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
