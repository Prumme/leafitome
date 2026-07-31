import { useMemo } from 'react'
import { useHistoryStore } from '@/features/history/store/historyStore'
import {
  computeCompletionStats,
  getOccurrencesForRange,
  getRemainingForToday,
  type CompletionStats,
  type TodoOccurrence,
} from '@/features/history/utils/completion'
import { useTodoStore } from '@/features/todos/store/todoStore'
import type { PeriodFilter } from '@/shared/types/common.types'
import {
  getMonthRange,
  getWeekRange,
  parseDateString,
  todayString,
} from '@/shared/utils/dates'

function rangeFor(period: PeriodFilter): { start: Date; end: Date } {
  const today = parseDateString(todayString())
  if (period === 'today') return { start: today, end: today }
  if (period === 'week') return getWeekRange(today)
  return getMonthRange(today)
}

export function useDashboardStats(period: PeriodFilter): {
  stats: CompletionStats
  remaining: TodoOccurrence[]
  occurrences: TodoOccurrence[]
  loaded: boolean
} {
  const todos = useTodoStore((state) => state.todos)
  const entries = useHistoryStore((state) => state.entries)
  const todosLoaded = useTodoStore((state) => state.loaded)
  const historyLoaded = useHistoryStore((state) => state.loaded)

  const activeTodos = useMemo(() => todos.filter((todo) => !todo.archived), [todos])

  const occurrences = useMemo(() => {
    const { start, end } = rangeFor(period)
    return getOccurrencesForRange(activeTodos, entries, start, end)
  }, [activeTodos, entries, period])

  const stats = useMemo(() => computeCompletionStats(occurrences), [occurrences])

  const remaining = useMemo(
    () => getRemainingForToday(activeTodos, entries),
    [activeTodos, entries],
  )

  return {
    stats,
    remaining,
    occurrences,
    loaded: todosLoaded && historyLoaded,
  }
}
