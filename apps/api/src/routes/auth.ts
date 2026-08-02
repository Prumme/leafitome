import { Hono } from 'hono'
import type { Context } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { sql } from '../db/client.js'
import {
  changePasswordTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
} from '../emails/layout.js'
import { env } from '../env.js'
import { consumeEmailToken, issueEmailToken } from '../lib/emailTokens.js'
import { isMailConfigured, sendMail } from '../lib/mailer.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { loginSchema, registerSchema, updateProfileSchema } from '../lib/schemas.js'
import { signSession } from '../lib/session.js'
import { COOKIE_NAME, requireAuth, type AuthVariables } from '../middleware/auth.js'

type UserRow = {
  id: string
  email: string
  display_name: string | null
  password_hash: string
  email_verified_at: Date | null
  blocked_at: Date | null
  session_version: number
  created_at: Date
}

function publicUser(
  row: Pick<
    UserRow,
    'id' | 'email' | 'display_name' | 'created_at' | 'email_verified_at' | 'blocked_at'
  >,
) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    emailVerified: Boolean(row.email_verified_at),
    emailVerifiedAt: row.email_verified_at ? row.email_verified_at.toISOString() : null,
    blocked: Boolean(row.blocked_at),
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

function clearSessionCookie(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
}

async function loadUser(id: string): Promise<UserRow | null> {
  const rows = await sql<UserRow[]>`
    SELECT id, email, display_name, password_hash, email_verified_at, blocked_at,
           session_version, created_at
    FROM users WHERE id = ${id}::uuid LIMIT 1
  `
  return rows[0] ?? null
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
    RETURNING id, email, display_name, password_hash, email_verified_at, blocked_at,
              session_version, created_at
  `
  const user = rows[0]
  if (!user) throw new HTTPException(500, { message: 'Création impossible' })

  const token = await signSession({ sub: user.id, email: user.email, sv: user.session_version })
  attachSessionCookie(c, token)

  return c.json({ user: publicUser(user), token }, 201)
})

authRoutes.post('/login', async (c) => {
  const body = loginSchema.parse(await c.req.json())

  const rows = await sql<UserRow[]>`
    SELECT id, email, display_name, password_hash, email_verified_at, blocked_at,
           session_version, created_at
    FROM users WHERE email = ${body.email} LIMIT 1
  `
  const user = rows[0]
  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    throw new HTTPException(401, { message: 'Email ou mot de passe incorrect' })
  }
  if (user.blocked_at) {
    throw new HTTPException(403, {
      message: 'Ce compte a été bloqué. Contacte un administrateur si besoin.',
    })
  }

  const token = await signSession({ sub: user.id, email: user.email, sv: user.session_version })
  attachSessionCookie(c, token)

  return c.json({ user: publicUser(user), token })
})

authRoutes.post('/logout', async (c) => {
  clearSessionCookie(c)
  return c.json({ ok: true })
})

authRoutes.get('/me', requireAuth, async (c) => {
  const session = c.get('user')
  const user = await loadUser(session.sub)
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
    RETURNING id, email, display_name, password_hash, email_verified_at, blocked_at,
              session_version, created_at
  `
  const user = rows[0]
  if (!user) throw new HTTPException(404, { message: 'Utilisateur introuvable' })
  return c.json({ user: publicUser(user) })
})

authRoutes.post('/verify-email/send', requireAuth, async (c) => {
  const session = c.get('user')
  const user = await loadUser(session.sub)
  if (!user) throw new HTTPException(401, { message: 'Utilisateur introuvable' })
  if (user.email_verified_at) {
    return c.json({ ok: true, alreadyVerified: true })
  }
  if (!isMailConfigured()) {
    throw new HTTPException(503, {
      message: 'Envoi d’email indisponible pour le moment (configuration Resend).',
    })
  }

  const raw = await issueEmailToken(user.id, 'verify', 60 * 24)
  const url = `${env.APP_URL.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(raw)}`
  const template = verifyEmailTemplate(user.display_name, url)
  const sent = await sendMail({ to: user.email, ...template })
  if (!sent.ok) {
    throw new HTTPException(502, { message: sent.error })
  }

  return c.json({ ok: true, alreadyVerified: false })
})

authRoutes.post('/verify-email/confirm', async (c) => {
  const body = z.object({ token: z.string().min(10) }).parse(await c.req.json())
  const consumed = await consumeEmailToken(body.token, 'verify')
  if (!consumed) {
    throw new HTTPException(400, { message: 'Lien invalide ou expiré' })
  }

  const rows = await sql<UserRow[]>`
    UPDATE users
    SET email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
    WHERE id = ${consumed.userId}::uuid
    RETURNING id, email, display_name, password_hash, email_verified_at, blocked_at,
              session_version, created_at
  `
  const user = rows[0]
  if (!user) throw new HTTPException(404, { message: 'Utilisateur introuvable' })
  return c.json({ ok: true, user: publicUser(user) })
})

authRoutes.post('/forgot-password', async (c) => {
  const body = z
    .object({ email: z.string().email().transform((v) => v.trim().toLowerCase()) })
    .parse(await c.req.json())

  // Toujours 200 pour ne pas révéler si l’email existe
  const rows = await sql<UserRow[]>`
    SELECT id, email, display_name, password_hash, email_verified_at, blocked_at,
           session_version, created_at
    FROM users WHERE email = ${body.email} LIMIT 1
  `
  const user = rows[0]
  if (user && !user.blocked_at && isMailConfigured()) {
    const raw = await issueEmailToken(user.id, 'reset', 60)
    const url = `${env.APP_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(raw)}`
    const template = resetPasswordTemplate(user.display_name, url)
    await sendMail({ to: user.email, ...template })
  }

  return c.json({
    ok: true,
    message: 'Si un compte existe pour cet email, un lien a été envoyé.',
  })
})

authRoutes.post('/reset-password', async (c) => {
  const body = z
    .object({
      token: z.string().min(10),
      password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
    })
    .parse(await c.req.json())

  // Accepte forgot-password (reset) et changement depuis le profil (change_password)
  let consumed = await consumeEmailToken(body.token, 'reset')
  if (!consumed) consumed = await consumeEmailToken(body.token, 'change_password')
  if (!consumed) {
    throw new HTTPException(400, { message: 'Lien invalide ou expiré' })
  }

  const passwordHash = await hashPassword(body.password)
  const rows = await sql<UserRow[]>`
    UPDATE users SET
      password_hash = ${passwordHash},
      session_version = session_version + 1,
      updated_at = now()
    WHERE id = ${consumed.userId}::uuid
    RETURNING id, email, display_name, password_hash, email_verified_at, blocked_at,
              session_version, created_at
  `
  const user = rows[0]
  if (!user) throw new HTTPException(404, { message: 'Utilisateur introuvable' })
  if (user.blocked_at) {
    throw new HTTPException(403, { message: 'Ce compte a été bloqué' })
  }

  clearSessionCookie(c)
  const token = await signSession({ sub: user.id, email: user.email, sv: user.session_version })
  attachSessionCookie(c, token)

  return c.json({ ok: true, user: publicUser(user), token })
})

authRoutes.post('/change-password/request', requireAuth, async (c) => {
  const session = c.get('user')
  const user = await loadUser(session.sub)
  if (!user) throw new HTTPException(401, { message: 'Utilisateur introuvable' })
  if (!isMailConfigured()) {
    throw new HTTPException(503, {
      message: 'Envoi d’email indisponible pour le moment (configuration Resend).',
    })
  }

  const raw = await issueEmailToken(user.id, 'change_password', 60)
  const url = `${env.APP_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(raw)}&intent=change`
  const template = changePasswordTemplate(user.display_name, url)
  const sent = await sendMail({ to: user.email, ...template })
  if (!sent.ok) {
    throw new HTTPException(502, { message: sent.error })
  }

  // Ferme la session courante
  await sql`
    UPDATE users SET session_version = session_version + 1, updated_at = now()
    WHERE id = ${user.id}::uuid
  `
  clearSessionCookie(c)

  return c.json({ ok: true, loggedOut: true })
})
