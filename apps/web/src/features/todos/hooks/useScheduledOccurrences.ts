import { useMemo } from 'react'
import { useHistoryStore } from '@/features/history/store/historyStore'
import {
  getOccurrencesForDayIncludingEarly,
  getOccurrencesForRange,
  type TodoOccurrence,
} from '@/features/history/utils/completion'
import { useTodoStore } from '@/features/todos/store/todoStore'
import { sortTodosByPriority } from '@/features/todos/utils/recurrence'
import type { PeriodFilter } from '@/shared/types/common.types'
import {
  getMonthRange,
  getWeekRange,
  parseDateString,
  todayString,
} from '@/shared/utils/dates'

function getRangeForPeriod(period: PeriodFilter): { start: Date; end: Date } {
  const today = parseDateString(todayString())
  if (period === 'today') return { start: today, end: today }
  if (period === 'week') return getWeekRange(today)
  return getMonthRange(today)
}

function sortOccurrences(list: TodoOccurrence[]): TodoOccurrence[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return sortTodosByPriority([a.todo, b.todo])[0]?.id === a.todo.id ? -1 : 1
  })
}

export function useScheduledOccurrences(period: PeriodFilter): {
  occurrences: TodoOccurrence[]
  loaded: boolean
} {
  const todos = useTodoStore((state) => state.todos)
  const entries = useHistoryStore((state) => state.entries)
  const todosLoaded = useTodoStore((state) => state.loaded)
  const historyLoaded = useHistoryStore((state) => state.loaded)

  const occurrences = useMemo(() => {
    const active = todos.filter((todo) => !todo.archived)
    if (period === 'today') {
      return sortOccurrences(
        getOccurrencesForDayIncludingEarly(active, entries, parseDateString(todayString())),
      )
    }
    const { start, end } = getRangeForPeriod(period)
    return sortOccurrences(getOccurrencesForRange(active, entries, start, end))
  }, [todos, entries, period])

  return { occurrences, loaded: todosLoaded && historyLoaded }
}
