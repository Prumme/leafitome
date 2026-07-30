import { create } from 'zustand'
import type {
  CreateHistoryInput,
  HistoryEntry,
  HistoryStatus,
} from '@/features/history/types/history.types'
import { historyRepository } from '@/features/history/store/historyRepository'

interface HistoryState {
  entries: HistoryEntry[]
  loaded: boolean
  load: () => Promise<void>
  markStatus: (todoId: string, date: string, status: HistoryStatus) => Promise<HistoryEntry>
  removeEntry: (id: string) => Promise<void>
  clearForTodo: (todoId: string) => Promise<void>
  getEntry: (todoId: string, date: string) => HistoryEntry | undefined
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  loaded: false,

  load: async () => {
    const entries = await historyRepository.getAll()
    set({ entries, loaded: true })
  },

  markStatus: async (todoId, date, status) => {
    const existing = get().entries.find(
      (entry) => entry.todoId === todoId && entry.date === date,
    )

    if (existing) {
      const updated = await historyRepository.update(existing.id, { status })
      set({
        entries: get().entries.map((entry) => (entry.id === existing.id ? updated : entry)),
      })
      return updated
    }

    const input: CreateHistoryInput = { todoId, date, status }
    const created = await historyRepository.create(input)
    set({ entries: [...get().entries, created] })
    return created
  },

  removeEntry: async (id) => {
    await historyRepository.delete(id)
    set({ entries: get().entries.filter((entry) => entry.id !== id) })
  },

  clearForTodo: async (todoId) => {
    const toRemove = get().entries.filter((entry) => entry.todoId === todoId)
    await Promise.all(toRemove.map((entry) => historyRepository.delete(entry.id)))
    set({ entries: get().entries.filter((entry) => entry.todoId !== todoId) })
  },

  getEntry: (todoId, date) =>
    get().entries.find((entry) => entry.todoId === todoId && entry.date === date),
}))
