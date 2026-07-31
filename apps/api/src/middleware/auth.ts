import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { verifySession, type SessionPayload } from '../lib/session.js'

export type AuthVariables = {
  user: SessionPayload
}

const COOKIE_NAME = 'leafitome_session'

export function getSessionToken(authorization: string | undefined, cookieHeader: string | undefined): string | null {
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice(7)
  }
  // cookie parsed by hono getCookie in middleware
  void cookieHeader
  return null
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const bearer = c.req.header('Authorization')
  const cookieToken = getCookie(c, COOKIE_NAME)
  const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : cookieToken

  if (!token) {
    throw new HTTPException(401, { message: 'Non authentifié' })
  }

  try {
    const user = await verifySession(token)
    c.set('user', user)
    await next()
  } catch {
    throw new HTTPException(401, { message: 'Session expirée ou invalide' })
  }
})

export { COOKIE_NAME }
