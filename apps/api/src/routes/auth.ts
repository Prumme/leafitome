import { Hono } from 'hono'
import type { Context } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { sql } from '../db/client.js'
import { env } from '../env.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { loginSchema, registerSchema, updateProfileSchema } from '../lib/schemas.js'
import { signSession } from '../lib/session.js'
import { COOKIE_NAME, requireAuth, type AuthVariables } from '../middleware/auth.js'

type UserRow = {
  id: string
  email: string
  display_name: string | null
  password_hash: string
  created_at: Date
}

function publicUser(row: Pick<UserRow, 'id' | 'email' | 'display_name' | 'created_at'>) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at.toISOString(),
  }
}

function attachSessionCookie(c: Context, token: string) {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: env.COOKIE_SECURE,
  })
}

export const authRoutes = new Hono<{ Variables: AuthVariables }>()

authRoutes.post('/register', async (c) => {
  const body = registerSchema.parse(await c.req.json())

  const existing = await sql<{ id: string }[]>`
    SELECT id FROM users WHERE email = ${body.email} LIMIT 1
  `
  if (existing[0]) {
    throw new HTTPException(409, { message: 'Un compte existe déjà avec cet email' })
  }

  const passwordHash = await hashPassword(body.password)
  const rows = await sql<UserRow[]>`
    INSERT INTO users (email, password_hash, display_name)
    VALUES (${body.email}, ${passwordHash}, ${body.displayName ?? null})
    RETURNING id, email, display_name, password_hash, created_at
  `
  const user = rows[0]
  if (!user) throw new HTTPException(500, { message: 'Création impossible' })

  const token = await signSession({ sub: user.id, email: user.email })
  attachSessionCookie(c, token)

  return c.json({ user: publicUser(user), token }, 201)
})

authRoutes.post('/login', async (c) => {
  const body = loginSchema.parse(await c.req.json())

  const rows = await sql<UserRow[]>`
    SELECT id, email, display_name, password_hash, created_at
    FROM users WHERE email = ${body.email} LIMIT 1
  `
  const user = rows[0]
  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    throw new HTTPException(401, { message: 'Email ou mot de passe incorrect' })
  }

  const token = await signSession({ sub: user.id, email: user.email })
  attachSessionCookie(c, token)

  return c.json({ user: publicUser(user), token })
})

authRoutes.post('/logout', async (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})

authRoutes.get('/me', requireAuth, async (c) => {
  const session = c.get('user')
  const rows = await sql<UserRow[]>`
    SELECT id, email, display_name, password_hash, created_at
    FROM users WHERE id = ${session.sub}::uuid LIMIT 1
  `
  const user = rows[0]
  if (!user) throw new HTTPException(401, { message: 'Utilisateur introuvable' })
  return c.json({ user: publicUser(user) })
})

authRoutes.patch('/me', requireAuth, async (c) => {
  const session = c.get('user')
  const body = updateProfileSchema.parse(await c.req.json())

  const rows = await sql<UserRow[]>`
    UPDATE users
    SET display_name = ${body.displayName}, updated_at = now()
    WHERE id = ${session.sub}::uuid
    RETURNING id, email, display_name, password_hash, created_at
  `
  const user = rows[0]
  if (!user) throw new HTTPException(404, { message: 'Utilisateur introuvable' })
  return c.json({ user: publicUser(user) })
})
