import { useEffect, useRef } from 'react'
import { evaluateBadges } from '@/features/badges/utils/evaluateBadges'
import { useBadgeStore } from '@/features/badges/store/badgeStore'
import { useHistoryStore } from '@/features/history/store/historyStore'
import { useTodoStore } from '@/features/todos/store/todoStore'

/**
 * Évalue les badges dès que todos / history / progression changent.
 * Premier passage après bootstrap : déblocage silencieux (pas de toast).
 */
export function useBadgeUnlockWatcher(ready: boolean): void {
  const todos = useTodoStore((state) => state.todos)
  const history = useHistoryStore((state) => state.entries)
  const progress = useBadgeStore((state) => state.progress)
  const unlockMany = useBadgeStore((state) => state.unlockMany)
  const primed = useRef(false)

  useEffect(() => {
    if (!ready) return

    const newly = evaluateBadges({ todos, history, progress })
    if (newly.length === 0) {
      primed.current = true
      return
    }

    const silent = !primed.current
    primed.current = true
    void unlockMany(newly, { silent })
  }, [ready, todos, history, progress, unlockMany])
}
