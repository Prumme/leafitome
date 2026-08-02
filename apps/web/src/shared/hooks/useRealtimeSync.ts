import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useHistoryStore } from '@/features/history/store/historyStore'
import type { HistoryEntry } from '@/features/history/types/history.types'
import { useMessageStore } from '@/features/messages/store/messageStore'
import type { AppMessage } from '@/features/messages/types/message.types'
import { getToken } from '@/shared/lib/api/client'

type RealtimeEvent =
  | { type: 'ready' }
  | { type: 'history.upsert'; entry: HistoryEntry }
  | { type: 'history.delete'; id: string; todoId: string; date: string }
  | { type: 'message.new'; message: AppMessage }

function wsUrl(token: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/ws?token=${encodeURIComponent(token)}`
}

/**
 * Maintient une connexion WebSocket pour synchroniser
 * les todos partagées (check/uncheck) et les messages inbox.
 */
export function useRealtimeSync(ready: boolean) {
  const status = useAuthStore((state) => state.status)
  const socketRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<number | null>(null)

  useEffect(() => {
    if (!ready || status !== 'authenticated') {
      socketRef.current?.close()
      socketRef.current = null
      if (retryRef.current != null) {
        window.clearTimeout(retryRef.current)
        retryRef.current = null
      }
      return
    }

    let cancelled = false

    function connect() {
      if (cancelled) return
      const token = getToken()
      if (!token) return

      const socket = new WebSocket(wsUrl(token))
      socketRef.current = socket

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as RealtimeEvent
          if (data.type === 'history.upsert') {
            useHistoryStore.getState().applyRemoteUpsert(data.entry)
            return
          }
          if (data.type === 'history.delete') {
            useHistoryStore.getState().applyRemoteDelete(data)
            return
          }
          if (data.type === 'message.new') {
            useMessageStore.getState().prependRemote(data.message)
          }
        } catch {
          // ignore malformed
        }
      }

      socket.onclose = () => {
        socketRef.current = null
        if (cancelled) return
        retryRef.current = window.setTimeout(connect, 2000)
      }

      socket.onerror = () => {
        socket.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryRef.current != null) {
        window.clearTimeout(retryRef.current)
        retryRef.current = null
      }
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [ready, status])
}
