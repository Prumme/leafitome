import { create } from 'zustand'
import type { HistoryEntry, HistoryStatus } from '@/features/history/types/history.types'
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
      const optimistic = { ...existing, status }
      set({
        entries: get().entries.map((entry) => (entry.id === existing.id ? optimistic : entry)),
      })
      try {
        const updated = await historyRepository.update(existing.id, { status })
        set({
          entries: get().entries.map((entry) => (entry.id === existing.id ? updated : entry)),
        })
        return updated
      } catch (error) {
        set({
          entries: get().entries.map((entry) => (entry.id === existing.id ? existing : entry)),
        })
        throw error
      }
    }

    const tempId = `optimistic-${todoId}-${date}`
    const optimistic: HistoryEntry = {
      id: tempId,
      todoId,
      date,
      status,
      createdAt: new Date().toISOString(),
    }
    set({ entries: [...get().entries, optimistic] })

    try {
      const created = await historyRepository.create({ todoId, date, status })
      set({
        entries: get().entries.map((entry) => (entry.id === tempId ? created : entry)),
      })
      return created
    } catch (error) {
      set({ entries: get().entries.filter((entry) => entry.id !== tempId) })
      throw error
    }
  },

  removeEntry: async (id) => {
    const previous = get().entries
    set({ entries: previous.filter((entry) => entry.id !== id) })
    try {
      await historyRepository.delete(id)
    } catch (error) {
      set({ entries: previous })
      throw error
    }
  },

  clearForTodo: async (todoId) => {
    const toRemove = get().entries.filter((entry) => entry.todoId === todoId)
    await Promise.all(toRemove.map((entry) => historyRepository.delete(entry.id)))
    set({ entries: get().entries.filter((entry) => entry.todoId !== todoId) })
  },

  getEntry: (todoId, date) =>
    get().entries.find((entry) => entry.todoId === todoId && entry.date === date),
}))
