export type RealtimeEvent =
  | {
      type: 'history.upsert'
      entry: {
        id: string
        todoId: string
        date: string
        status: 'DONE' | 'MISSED'
        completedBy?: string
        completedByName?: string
        createdAt: string
      }
    }
  | {
      type: 'history.delete'
      id: string
      todoId: string
      date: string
    }
  | {
      type: 'message.new'
      message: {
        id: string
        type: string
        title: string
        body: string
        meta: Record<string, unknown>
        readAt: null
        createdAt: string
      }
    }

type SocketLike = {
  readyState: number
  send: (data: string) => void
}

const OPEN = 1
const clientsByUser = new Map<string, Set<SocketLike>>()

export function addRealtimeClient(userId: string, socket: SocketLike): void {
  let set = clientsByUser.get(userId)
  if (!set) {
    set = new Set()
    clientsByUser.set(userId, set)
  }
  set.add(socket)
}

export function removeRealtimeClient(userId: string, socket: SocketLike): void {
  const set = clientsByUser.get(userId)
  if (!set) return
  set.delete(socket)
  if (set.size === 0) clientsByUser.delete(userId)
}

export function broadcastToUsers(
  userIds: string[],
  event: RealtimeEvent,
  options?: { excludeUserId?: string },
): void {
  const payload = JSON.stringify(event)
  const unique = new Set(userIds.filter((id) => id && id !== options?.excludeUserId))

  for (const userId of unique) {
    const sockets = clientsByUser.get(userId)
    if (!sockets) continue
    for (const socket of sockets) {
      if (socket.readyState !== OPEN) continue
      try {
        socket.send(payload)
      } catch {
        // socket mort — nettoyé à onClose
      }
    }
  }
}
