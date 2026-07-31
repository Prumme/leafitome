import { useCallback } from 'react'
import { useHistoryStore } from '@/features/history/store/historyStore'
import type { HistoryStatus } from '@/features/history/types/history.types'

export function useHistoryActions(): {
  markDone: (todoId: string, date: string) => Promise<void>
  markMissed: (todoId: string, date: string) => Promise<void>
  toggleDone: (todoId: string, date: string, currentlyDone: boolean) => Promise<void>
  clearStatus: (historyId: string) => Promise<void>
} {
  const markStatus = useHistoryStore((state) => state.markStatus)
  const removeEntry = useHistoryStore((state) => state.removeEntry)

  const setStatus = useCallback(
    async (todoId: string, date: string, status: HistoryStatus) => {
      await markStatus(todoId, date, status)
    },
    [markStatus],
  )

  const markDone = useCallback(
    (todoId: string, date: string) => setStatus(todoId, date, 'DONE'),
    [setStatus],
  )

  const markMissed = useCallback(
    (todoId: string, date: string) => setStatus(todoId, date, 'MISSED'),
    [setStatus],
  )

  const toggleDone = useCallback(
    async (todoId: string, date: string, currentlyDone: boolean) => {
      if (currentlyDone) {
        const entry = useHistoryStore.getState().getEntry(todoId, date)
        if (entry) await removeEntry(entry.id)
        return
      }
      await markStatus(todoId, date, 'DONE')
    },
    [markStatus, removeEntry],
  )

  const clearStatus = useCallback(
    async (historyId: string) => {
      await removeEntry(historyId)
    },
    [removeEntry],
  )

  return { markDone, markMissed, toggleDone, clearStatus }
}
