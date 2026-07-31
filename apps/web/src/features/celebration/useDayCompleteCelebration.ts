import { useEffect, useMemo, useRef, useState } from 'react'
import { useHistoryStore } from '@/features/history/store/historyStore'
import { getActionableForToday } from '@/features/history/utils/completion'
import { useTodoStore } from '@/features/todos/store/todoStore'

const CELEBRATION_MS = 3200

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Déclenche une célébration uniquement au passage N>0 → 0
 * (pas au chargement si déjà à 0).
 */
export function useDayCompleteCelebration(ready: boolean): boolean {
  const todos = useTodoStore((state) => state.todos)
  const entries = useHistoryStore((state) => state.entries)
  const [active, setActive] = useState(false)
  const prevCountRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  const actionableCount = useMemo(() => {
    const activeTodos = todos.filter((todo) => !todo.archived)
    return getActionableForToday(activeTodos, entries).length
  }, [todos, entries])

  useEffect(() => {
    if (!ready) return

    const previous = prevCountRef.current
    prevCountRef.current = actionableCount

    if (previous === null) return
    if (!(previous > 0 && actionableCount === 0)) return
    if (prefersReducedMotion()) return
    if (active) return

    setActive(true)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setActive(false)
      timerRef.current = null
    }, CELEBRATION_MS)
  }, [ready, actionableCount, active])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  return active
}

export const DAY_COMPLETE_PHRASE = 'Feuille-tastique !'
export const DAY_COMPLETE_CELEBRATION_MS = CELEBRATION_MS
