import type { HistoryEntry } from '@/features/history/types/history.types'
import {
  getOccurrencesForRange,
  type TodoOccurrence,
} from '@/features/history/utils/completion'
import type { Todo } from '@/features/todos/types/todo.types'
import { todosForActivity } from '@/features/todos/utils/recurrence'
import {
  addDaysTo,
  getDatesInRange,
  getWeekRange,
  isFutureDate,
  isToday,
  parseDateString,
  toDateString,
} from '@/shared/utils/dates'

export type DayActivityKind = 'empty' | 'success' | 'broken' | 'open' | 'future'

export interface DayActivity {
  date: string
  planned: number
  done: number
  missed: number
  pending: number
  /** 0–1 ratio done/planned ; 0 si aucune prévue */
  intensity: number
  kind: DayActivityKind
}

export interface HeatmapCell extends DayActivity {
  /** Hors de la fenêtre affichée (padding de début de grille) */
  placeholder?: boolean
}

export interface StreakStats {
  current: number
  best: number
}

function summarizeOccurrences(occurrences: TodoOccurrence[]): {
  planned: number
  done: number
  missed: number
  pending: number
} {
  let done = 0
  let missed = 0
  let pending = 0

  for (const item of occurrences) {
    if (item.status === 'DONE') done += 1
    else if (item.status === 'MISSED') missed += 1
    else pending += 1
  }

  return {
    planned: occurrences.length,
    done,
    missed,
    pending,
  }
}

function resolveKind(
  date: string,
  planned: number,
  done: number,
  missed: number,
  pending: number,
): DayActivityKind {
  if (isFutureDate(date)) return 'future'
  if (planned === 0) return 'empty'
  if (done > 0) return 'success'
  if (isToday(date) && pending > 0) return 'open'
  if (missed === planned) return 'broken'
  if (isToday(date)) return 'open'
  return 'broken'
}

/** Activité d’un jour : todos planifiées hors échéances (pas early, pas ONDAY). */
export function getDayActivity(
  todos: Todo[],
  entries: HistoryEntry[],
  date: Date | string,
): DayActivity {
  const day = typeof date === 'string' ? parseDateString(date) : date
  const dateStr = toDateString(day)
  const occurrences = getOccurrencesForRange(todosForActivity(todos), entries, day, day)
  const counts = summarizeOccurrences(occurrences)
  const kind = resolveKind(
    dateStr,
    counts.planned,
    counts.done,
    counts.missed,
    counts.pending,
  )
  const intensity =
    counts.planned === 0 ? 0 : Math.min(1, counts.done / counts.planned)

  return {
    date: dateStr,
    ...counts,
    intensity,
    kind,
  }
}

/**
 * Grille heatmap : `weeks` semaines (lun→dim) se terminant à la fin
 * de la semaine courante.
 */
export function buildHeatmapDays(
  todos: Todo[],
  entries: HistoryEntry[],
  weeks = 12,
  reference = new Date(),
): HeatmapCell[] {
  const { end } = getWeekRange(reference)
  const start = addDaysTo(end, -(weeks * 7 - 1))
  const dates = getDatesInRange(start, end)

  return dates.map((day) => getDayActivity(todos, entries, day))
}

function isStreakSuccess(activity: DayActivity): boolean {
  return activity.kind === 'success'
}

function isStreakBreak(activity: DayActivity): boolean {
  return activity.kind === 'broken'
}

function isStreakNeutral(activity: DayActivity): boolean {
  return activity.kind === 'empty' || activity.kind === 'open' || activity.kind === 'future'
}

/**
 * Streak courante : jours success consécutifs en remontant,
 * en sautant les jours neutres (empty / open).
 * Best : plus longue série sur ~2 ans.
 */
export function computeStreak(
  todos: Todo[],
  entries: HistoryEntry[],
  reference = new Date(),
): StreakStats {
  const today = parseDateString(toDateString(reference))
  const lookbackDays = 730
  const start = addDaysTo(today, -lookbackDays)
  const dates = getDatesInRange(start, today)

  const activities = dates.map((day) => getDayActivity(todos, entries, day))

  let current = 0
  for (let i = activities.length - 1; i >= 0; i -= 1) {
    const activity = activities[i]
    if (!activity) continue
    if (isStreakNeutral(activity)) continue
    if (isStreakBreak(activity)) break
    if (isStreakSuccess(activity)) current += 1
  }

  let best = 0
  let run = 0
  for (const activity of activities) {
    if (isStreakNeutral(activity)) continue
    if (isStreakSuccess(activity)) {
      run += 1
      best = Math.max(best, run)
    } else if (isStreakBreak(activity)) {
      run = 0
    }
  }

  best = Math.max(best, current)

  return { current, best }
}
