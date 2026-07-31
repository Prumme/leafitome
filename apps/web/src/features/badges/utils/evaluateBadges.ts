import type { BadgeId, BadgeProgress } from '@/features/badges/types/badge.types'
import {
  computeStreak,
  getDayActivity,
} from '@/features/dashboard/utils/activity'
import type { HistoryEntry } from '@/features/history/types/history.types'
import type { Todo } from '@/features/todos/types/todo.types'
import {
  addDaysTo,
  getDatesInRange,
  parseDateString,
  toDateString,
} from '@/shared/utils/dates'

export interface EvaluateBadgesInput {
  todos: Todo[]
  history: HistoryEntry[]
  progress: BadgeProgress
  reference?: Date
}

function countDone(history: HistoryEntry[]): number {
  return history.filter((entry) => entry.status === 'DONE').length
}

function countPerfectDays(todos: Todo[], history: HistoryEntry[], reference: Date): number {
  const today = parseDateString(toDateString(reference))
  const start = addDaysTo(today, -730)
  const dates = getDatesInRange(start, today)
  let count = 0

  for (const day of dates) {
    const activity = getDayActivity(todos, history, day)
    if (activity.planned > 0 && activity.done === activity.planned) {
      count += 1
    }
  }

  return count
}

/**
 * Comeback : streak courante ≥ 1 et, juste avant, un jour « broken »
 * (série cassée puis reprise).
 */
function hasStreakComeback(
  todos: Todo[],
  history: HistoryEntry[],
  reference: Date,
): boolean {
  const today = parseDateString(toDateString(reference))
  const start = addDaysTo(today, -730)
  const dates = getDatesInRange(start, today)
  const activities = dates.map((day) => getDayActivity(todos, history, day))

  let i = activities.length - 1
  while (i >= 0) {
    const activity = activities[i]
    if (!activity) break
    if (activity.kind === 'empty' || activity.kind === 'open' || activity.kind === 'future') {
      i -= 1
      continue
    }
    break
  }

  let hadSuccess = false
  while (i >= 0) {
    const activity = activities[i]
    if (!activity) break
    if (activity.kind === 'empty' || activity.kind === 'open' || activity.kind === 'future') {
      i -= 1
      continue
    }
    if (activity.kind === 'success') {
      hadSuccess = true
      i -= 1
      continue
    }
    break
  }

  if (!hadSuccess) return false

  while (i >= 0) {
    const activity = activities[i]
    if (!activity) break
    if (activity.kind === 'empty' || activity.kind === 'open' || activity.kind === 'future') {
      i -= 1
      continue
    }
    return activity.kind === 'broken'
  }

  return false
}

const STREAK_THRESHOLDS: Array<{ id: BadgeId; min: number }> = [
  { id: 'streak-7', min: 7 },
  { id: 'streak-14', min: 14 },
  { id: 'streak-30', min: 30 },
  { id: 'streak-60', min: 60 },
  { id: 'streak-180', min: 180 },
  { id: 'streak-365', min: 365 },
]

const CREATED_THRESHOLDS: Array<{ id: BadgeId; min: number }> = [
  { id: 'todos-created-1', min: 1 },
  { id: 'todos-created-10', min: 10 },
  { id: 'todos-created-50', min: 50 },
]

const DONE_THRESHOLDS: Array<{ id: BadgeId; min: number }> = [
  { id: 'todos-done-1', min: 1 },
  { id: 'todos-done-10', min: 10 },
  { id: 'todos-done-50', min: 50 },
  { id: 'todos-done-100', min: 100 },
]

const PERFECT_THRESHOLDS: Array<{ id: BadgeId; min: number }> = [
  { id: 'perfect-day-1', min: 1 },
  { id: 'perfect-day-5', min: 5 },
  { id: 'perfect-day-20', min: 20 },
]

/**
 * Retourne les ids de badges éligibles non encore débloqués.
 */
export function evaluateBadges({
  todos,
  history,
  progress,
  reference = new Date(),
}: EvaluateBadgesInput): BadgeId[] {
  const unlocked = progress.unlocked ?? {}
  const candidates: BadgeId[] = []

  const pushIf = (id: BadgeId, condition: boolean) => {
    if (condition && !unlocked[id]) candidates.push(id)
  }

  const streak = computeStreak(todos, history, reference)
  for (const { id, min } of STREAK_THRESHOLDS) {
    pushIf(id, streak.current >= min)
  }

  const createdCount = todos.length
  for (const { id, min } of CREATED_THRESHOLDS) {
    pushIf(id, createdCount >= min)
  }

  const doneCount = countDone(history)
  for (const { id, min } of DONE_THRESHOLDS) {
    pushIf(id, doneCount >= min)
  }

  const perfectDays = countPerfectDays(todos, history, reference)
  for (const { id, min } of PERFECT_THRESHOLDS) {
    pushIf(id, perfectDays >= min)
  }

  pushIf('streak-comeback', hasStreakComeback(todos, history, reference))
  pushIf(
    'recurrence-weekly',
    todos.some((todo) => todo.recurrence === 'WEEKLY'),
  )
  pushIf(
    'recurrence-monthly',
    todos.some((todo) => todo.recurrence === 'MONTHLY'),
  )
  pushIf('backup-traveler', Boolean(progress.hasTraveled))

  return candidates
}
