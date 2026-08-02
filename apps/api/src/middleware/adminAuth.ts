import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { ADMIN_COOKIE, verifyAdminSession } from '../lib/adminSession.js'

export const requireAdmin = createMiddleware(async (c, next) => {
  const bearer = c.req.header('Authorization')
  const cookieToken = getCookie(c, ADMIN_COOKIE)
  const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : cookieToken

  if (!token || !(await verifyAdminSession(token))) {
    throw new HTTPException(401, { message: 'Admin non authentifié' })
  }

  await next()
})
