import { useMemo } from 'react'
import {
  buildHeatmapDays,
  computeStreak,
  type HeatmapCell,
  type StreakStats,
} from '@/features/dashboard/utils/activity'
import { useHistoryStore } from '@/features/history/store/historyStore'
import { useTodoStore } from '@/features/todos/store/todoStore'

export function useActivityInsights(): {
  heatmap: HeatmapCell[]
  streak: StreakStats
  loaded: boolean
} {
  const todos = useTodoStore((state) => state.todos)
  const entries = useHistoryStore((state) => state.entries)
  const todosLoaded = useTodoStore((state) => state.loaded)
  const historyLoaded = useHistoryStore((state) => state.loaded)

  const activeTodos = useMemo(() => todos.filter((todo) => !todo.archived), [todos])

  const heatmap = useMemo(
    () => buildHeatmapDays(activeTodos, entries, 12),
    [activeTodos, entries],
  )

  const streak = useMemo(
    () => computeStreak(activeTodos, entries),
    [activeTodos, entries],
  )

  return {
    heatmap,
    streak,
    loaded: todosLoaded && historyLoaded,
  }
}
