import { create } from 'zustand'
import type { AppMessage } from '@/features/messages/types/message.types'
import { apiFetch } from '@/shared/lib/api/client'

interface MessageState {
  messages: AppMessage[]
  unreadCount: number
  loaded: boolean
  load: () => Promise<void>
  markAllRead: () => Promise<void>
  markRead: (ids: string[]) => Promise<void>
  reset: () => void
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  unreadCount: 0,
  loaded: false,

  load: async () => {
    const data = await apiFetch<{ messages: AppMessage[]; unreadCount: number }>('/messages')
    set({
      messages: data.messages,
      unreadCount: data.unreadCount,
      loaded: true,
    })
  },

  markAllRead: async () => {
    await apiFetch('/messages/read', {
      method: 'PATCH',
      body: JSON.stringify({ all: true }),
    })
    set({
      messages: get().messages.map((message) => ({
        ...message,
        readAt: message.readAt ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })
  },

  markRead: async (ids) => {
    if (ids.length === 0) return
    await apiFetch('/messages/read', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    })
    const idSet = new Set(ids)
    const messages = get().messages.map((message) =>
      idSet.has(message.id)
        ? { ...message, readAt: message.readAt ?? new Date().toISOString() }
        : message,
    )
    set({
      messages,
      unreadCount: messages.filter((message) => !message.readAt).length,
    })
  },

  reset: () => set({ messages: [], unreadCount: 0, loaded: false }),
}))
