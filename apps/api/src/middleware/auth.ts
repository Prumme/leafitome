import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { sql } from '../db/client.js'
import { verifySession, type SessionPayload } from '../lib/session.js'

export type AuthVariables = {
  user: SessionPayload
}

const COOKIE_NAME = 'leafitome_session'

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const bearer = c.req.header('Authorization')
  const cookieToken = getCookie(c, COOKIE_NAME)
  const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : cookieToken

  if (!token) {
    throw new HTTPException(401, { message: 'Non authentifié' })
  }

  try {
    const user = await verifySession(token)

    const rows = await sql<{ session_version: number; blocked_at: Date | null }[]>`
      SELECT session_version, blocked_at
      FROM users WHERE id = ${user.sub}::uuid
      LIMIT 1
    `
    const row = rows[0]
    if (!row) throw new HTTPException(401, { message: 'Utilisateur introuvable' })
    if (row.blocked_at) {
      throw new HTTPException(403, { message: 'Ce compte a été bloqué' })
    }
    if (row.session_version !== user.sv) {
      throw new HTTPException(401, { message: 'Session expirée — reconnecte-toi' })
    }

    c.set('user', user)
    await next()
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(401, { message: 'Session expirée ou invalide' })
  }
})

export { COOKIE_NAME }
