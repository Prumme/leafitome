import { useCallback, useMemo, useState } from 'react'
import type { TodoOccurrence } from '@/features/history/utils/completion'

export function occurrenceKey(occurrence: TodoOccurrence): string {
  return `${occurrence.todo.id}-${occurrence.date}`
}

/**
 * Garde des occurrences à l'écran pendant leur anim de sortie,
 * alors que le store les a déjà retirées (compteur à jour au clic).
 */
export function usePinnedOccurrences(live: TodoOccurrence[]): {
  displayed: TodoOccurrence[]
  pin: (occurrence: TodoOccurrence) => void
  unpin: (occurrence: TodoOccurrence) => void
} {
  const [pinned, setPinned] = useState<TodoOccurrence[]>([])

  const pin = useCallback((occurrence: TodoOccurrence) => {
    const key = occurrenceKey(occurrence)
    setPinned((current) => {
      if (current.some((item) => occurrenceKey(item) === key)) return current
      return [...current, occurrence]
    })
  }, [])

  const unpin = useCallback((occurrence: TodoOccurrence) => {
    const key = occurrenceKey(occurrence)
    setPinned((current) => current.filter((item) => occurrenceKey(item) !== key))
  }, [])

  const displayed = useMemo(() => {
    const liveKeys = new Set(live.map(occurrenceKey))
    const extras = pinned.filter((item) => !liveKeys.has(occurrenceKey(item)))
    return extras.length === 0 ? live : [...live, ...extras]
  }, [live, pinned])

  return { displayed, pin, unpin }
}
