import type { Hono } from 'hono'
import type { UpgradeWebSocket } from 'hono/ws'
import { verifySession } from '../lib/session.js'
import { addRealtimeClient, removeRealtimeClient } from '../lib/realtime.js'

export function registerWsRoute(app: Hono, upgradeWebSocket: UpgradeWebSocket) {
  app.get(
    '/ws',
    upgradeWebSocket(async (c) => {
      const token = c.req.query('token')
      if (!token) {
        return {
          onOpen(_event, ws) {
            ws.close(4401, 'Token manquant')
          },
        }
      }

      let userId: string
      try {
        const session = await verifySession(token)
        userId = session.sub
      } catch {
        return {
          onOpen(_event, ws) {
            ws.close(4401, 'Token invalide')
          },
        }
      }

      return {
        onOpen(_event, ws) {
          addRealtimeClient(userId, ws)
          try {
            ws.send(JSON.stringify({ type: 'ready' }))
          } catch {
            // ignore
          }
        },
        onClose(_event, ws) {
          removeRealtimeClient(userId, ws)
        },
        onError(_event, ws) {
          removeRealtimeClient(userId, ws)
        },
      }
    }),
  )
}
