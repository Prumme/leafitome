import { useEffect, useState } from 'react'
import { useBadgeStore } from '@/features/badges/store/badgeStore'
import { useHistoryStore } from '@/features/history/store/historyStore'
import { useTodoStore } from '@/features/todos/store/todoStore'

/**
 * Charge les stores au démarrage de l'app (LocalStorage → mémoire).
 */
export function useBootstrapData(): { ready: boolean } {
  const loadTodos = useTodoStore((state) => state.load)
  const loadHistory = useHistoryStore((state) => state.load)
  const loadBadges = useBadgeStore((state) => state.load)
  const todosLoaded = useTodoStore((state) => state.loaded)
  const historyLoaded = useHistoryStore((state) => state.loaded)
  const badgesLoaded = useBadgeStore((state) => state.loaded)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      await Promise.all([loadTodos(), loadHistory(), loadBadges()])
      if (!cancelled) setStarted(true)
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [loadTodos, loadHistory, loadBadges])

  return { ready: started && todosLoaded && historyLoaded && badgesLoaded }
}
