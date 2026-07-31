import type { HistoryEntry, HistoryStatus } from '@/features/history/types/history.types'
import type { Todo } from '@/features/todos/types/todo.types'
import {
  getNextScheduledDateInPeriod,
  isTodoScheduledOn,
  supportsEarlyCompletion,
} from '@/features/todos/utils/recurrence'
import {
  getDatesInRange,
  isFutureDate,
  isPastDate,
  isToday,
  toDateString,
} from '@/shared/utils/dates'

export type OccurrenceStatus = HistoryStatus | 'PENDING' | 'UPCOMING'

export interface TodoOccurrence {
  todo: Todo
  /** Date planifiée de l'occurrence (YYYY-MM-DD) */
  date: string
  status: OccurrenceStatus
  historyId?: string
  /** Affichée en avance (pas le jour planifié) */
  early?: boolean
}

export function resolveOccurrenceStatus(
  todoId: string,
  date: string,
  entries: HistoryEntry[],
): { status: OccurrenceStatus; historyId?: string } {
  const entry = entries.find((item) => item.todoId === todoId && item.date === date)
  if (entry) {
    return { status: entry.status, historyId: entry.id }
  }
  if (isFutureDate(date)) return { status: 'UPCOMING' }
  if (isToday(date) || !isPastDate(date)) return { status: 'PENDING' }
  return { status: 'MISSED' }
}

export function getOccurrencesForRange(
  todos: Todo[],
  entries: HistoryEntry[],
  start: Date,
  end: Date,
): TodoOccurrence[] {
  const dates = getDatesInRange(start, end)
  const occurrences: TodoOccurrence[] = []

  for (const date of dates) {
    const dateStr = toDateString(date)
    for (const todo of todos) {
      if (!isTodoScheduledOn(todo, date)) continue
      const resolved = resolveOccurrenceStatus(todo.id, dateStr, entries)
      occurrences.push({
        todo,
        date: dateStr,
        status: resolved.status,
        historyId: resolved.historyId,
      })
    }
  }

  return occurrences
}

/**
 * Occurrences du jour + tâches WEEKLY/MONTHLY faisables en avance
 * (prochaine échéance de la période, pas encore faite).
 */
export function getOccurrencesForDayIncludingEarly(
  todos: Todo[],
  entries: HistoryEntry[],
  day: Date,
): TodoOccurrence[] {
  const dayStr = toDateString(day)
  const scheduled = getOccurrencesForRange(todos, entries, day, day)
  const scheduledIds = new Set(scheduled.map((item) => `${item.todo.id}:${item.date}`))
  const early: TodoOccurrence[] = []

  for (const todo of todos) {
    if (!supportsEarlyCompletion(todo)) continue
    if (isTodoScheduledOn(todo, day)) continue

    const next = getNextScheduledDateInPeriod(todo, day)
    if (!next) continue

    const nextStr = toDateString(next)
    if (nextStr === dayStr) continue
    if (scheduledIds.has(`${todo.id}:${nextStr}`)) continue

    const resolved = resolveOccurrenceStatus(todo.id, nextStr, entries)
    if (resolved.status === 'DONE' || resolved.status === 'MISSED') continue

    early.push({
      todo,
      date: nextStr,
      status: resolved.status,
      historyId: resolved.historyId,
      early: true,
    })
  }

  return [...scheduled, ...early]
}

export interface CompletionStats {
  total: number
  done: number
  missed: number
  pending: number
  upcoming: number
  completionRate: number
}

export function computeCompletionStats(occurrences: TodoOccurrence[]): CompletionStats {
  const total = occurrences.length
  const done = occurrences.filter((item) => item.status === 'DONE').length
  const missed = occurrences.filter((item) => item.status === 'MISSED').length
  const pending = occurrences.filter((item) => item.status === 'PENDING').length
  const upcoming = occurrences.filter((item) => item.status === 'UPCOMING').length
  // Faites / toutes les occurrences de la période (pending & upcoming baissent le taux)
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100)

  return { total, done, missed, pending, upcoming, completionRate }
}

export function getRemainingForToday(
  todos: Todo[],
  entries: HistoryEntry[],
): TodoOccurrence[] {
  return getOccurrencesForDayIncludingEarly(todos, entries, new Date()).filter(
    (item) => item.status === 'PENDING' || item.status === 'UPCOMING',
  )
}

/** Tâches du jour encore à traiter (pending, missed, upcoming) — pour célébration à 0. */
export function getActionableForToday(
  todos: Todo[],
  entries: HistoryEntry[],
): TodoOccurrence[] {
  return getOccurrencesForDayIncludingEarly(todos, entries, new Date()).filter(
    (item) => item.status !== 'DONE',
  )
}
