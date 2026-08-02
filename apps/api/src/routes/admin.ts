import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { sql } from '../db/client.js'
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_HOURS,
  isAdminPasswordConfigured,
  signAdminSession,
  verifyAdminPassword,
} from '../lib/adminSession.js'
import { env } from '../env.js'
import { requireAdmin } from '../middleware/adminAuth.js'

type UserStatsRow = {
  id: string
  email: string
  display_name: string | null
  created_at: Date
  email_verified_at: Date | null
  blocked_at: Date | null
  blocked_reason: string | null
  todo_count: number
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

function mapAdminUser(row: UserStatsRow) {
  const createdMs = row.created_at.getTime()
  const unverifiedForMs = row.email_verified_at ? 0 : Date.now() - createdMs
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at.toISOString(),
    emailVerified: Boolean(row.email_verified_at),
    emailVerifiedAt: row.email_verified_at ? row.email_verified_at.toISOString() : null,
    blocked: Boolean(row.blocked_at),
    blockedAt: row.blocked_at ? row.blocked_at.toISOString() : null,
    blockedReason: row.blocked_reason,
    canPurgeUnverified: !row.email_verified_at && unverifiedForMs >= TWO_WEEKS_MS,
    todoCount: row.todo_count,
  }
}

type UserTodoRow = {
  id: string
  name: string
  description: string | null
  recurrence: string
  priority: string
  enabled: boolean
  archived: boolean
  shared: boolean
  created_at: Date
  updated_at: Date
  member_count: number
}

export const adminRoutes = new Hono()

adminRoutes.get('/status', (c) => {
  return c.json({ configured: isAdminPasswordConfigured() })
})

adminRoutes.post('/login', async (c) => {
  if (!isAdminPasswordConfigured()) {
    throw new HTTPException(503, { message: 'ADMIN_PASSWORD non configuré' })
  }

  const body = z.object({ password: z.string().min(1) }).parse(await c.req.json())
  if (!verifyAdminPassword(body.password)) {
    throw new HTTPException(401, { message: 'Mot de passe incorrect' })
  }

  const token = await signAdminSession()
  setCookie(c, ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: ADMIN_SESSION_HOURS * 60 * 60,
    secure: env.COOKIE_SECURE,
  })

  return c.json({
    ok: true,
    expiresInHours: ADMIN_SESSION_HOURS,
    token,
  })
})

adminRoutes.post('/logout', async (c) => {
  deleteCookie(c, ADMIN_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

adminRoutes.get('/me', requireAdmin, (c) => {
  return c.json({ ok: true, role: 'admin', expiresInHours: ADMIN_SESSION_HOURS })
})

adminRoutes.get('/users', requireAdmin, async (c) => {
  const rows = await sql<UserStatsRow[]>`
    SELECT
      u.id,
      u.email,
      u.display_name,
      u.created_at,
      u.email_verified_at,
      u.blocked_at,
      u.blocked_reason,
      (
        SELECT COUNT(*)::int FROM todos t WHERE t.user_id = u.id
      ) AS todo_count
    FROM users u
    ORDER BY u.created_at DESC
  `

  return c.json({ users: rows.map(mapAdminUser) })
})

adminRoutes.get('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const users = await sql<UserStatsRow[]>`
    SELECT
      u.id,
      u.email,
      u.display_name,
      u.created_at,
      u.email_verified_at,
      u.blocked_at,
      u.blocked_reason,
      (
        SELECT COUNT(*)::int FROM todos t WHERE t.user_id = u.id
      ) AS todo_count
    FROM users u
    WHERE u.id = ${id}::uuid
    LIMIT 1
  `
  const user = users[0]
  if (!user) throw new HTTPException(404, { message: 'Utilisateur introuvable' })

  const todos = await sql<UserTodoRow[]>`
    SELECT
      t.id,
      t.name,
      t.description,
      t.recurrence,
      t.priority,
      t.enabled,
      t.archived,
      t.shared,
      t.created_at,
      t.updated_at,
      (
        SELECT COUNT(*)::int FROM todo_members m WHERE m.todo_id = t.id
      ) AS member_count
    FROM todos t
    WHERE t.user_id = ${id}::uuid
    ORDER BY t.created_at DESC
  `

  return c.json({
    user: mapAdminUser(user),
    todos: todos.map((todo) => ({
      id: todo.id,
      name: todo.name,
      description: todo.description ?? undefined,
      recurrence: todo.recurrence,
      priority: todo.priority,
      enabled: todo.enabled,
      archived: todo.archived,
      shared: todo.shared,
      memberCount: todo.member_count,
      createdAt: todo.created_at.toISOString(),
      updatedAt: todo.updated_at.toISOString(),
    })),
  })
})

adminRoutes.post('/users/:id/block', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = z
    .object({ reason: z.string().trim().max(500).optional() })
    .parse(await c.req.json().catch(() => ({})))

  const rows = await sql<UserStatsRow[]>`
    UPDATE users SET
      blocked_at = now(),
      blocked_reason = ${body.reason ?? 'Bloqué par un administrateur'},
      session_version = session_version + 1,
      updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING
      id, email, display_name, created_at, email_verified_at, blocked_at, blocked_reason,
      (SELECT COUNT(*)::int FROM todos t WHERE t.user_id = users.id) AS todo_count
  `
  const user = rows[0]
  if (!user) throw new HTTPException(404, { message: 'Utilisateur introuvable' })
  return c.json({ user: mapAdminUser(user) })
})

adminRoutes.post('/users/:id/unblock', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const rows = await sql<UserStatsRow[]>`
    UPDATE users SET
      blocked_at = NULL,
      blocked_reason = NULL,
      updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING
      id, email, display_name, created_at, email_verified_at, blocked_at, blocked_reason,
      (SELECT COUNT(*)::int FROM todos t WHERE t.user_id = users.id) AS todo_count
  `
  const user = rows[0]
  if (!user) throw new HTTPException(404, { message: 'Utilisateur introuvable' })
  return c.json({ user: mapAdminUser(user) })
})

/** Suppression réservée aux comptes non vérifiés depuis ≥ 14 jours (ou déjà bloqués). */
adminRoutes.delete('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const rows = await sql<
    { id: string; email_verified_at: Date | null; created_at: Date; blocked_at: Date | null }[]
  >`
    SELECT id, email_verified_at, created_at, blocked_at
    FROM users WHERE id = ${id}::uuid LIMIT 1
  `
  const user = rows[0]
  if (!user) throw new HTTPException(404, { message: 'Utilisateur introuvable' })

  const unverifiedTooLong =
    !user.email_verified_at && Date.now() - user.created_at.getTime() >= TWO_WEEKS_MS
  if (!unverifiedTooLong && !user.blocked_at) {
    throw new HTTPException(400, {
      message:
        'Suppression autorisée seulement si le compte est bloqué, ou non vérifié depuis 14 jours.',
    })
  }

  await sql`DELETE FROM users WHERE id = ${id}::uuid`
  return c.json({ ok: true })
})

/** Modération : archiver / désarchiver / activer / désactiver une todo. */
adminRoutes.patch('/todos/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = z
    .object({
      enabled: z.boolean().optional(),
      archived: z.boolean().optional(),
    })
    .parse(await c.req.json())

  if (body.enabled === undefined && body.archived === undefined) {
    throw new HTTPException(400, { message: 'Rien à modifier' })
  }

  const existing = await sql<{ id: string; enabled: boolean; archived: boolean }[]>`
    SELECT id, enabled, archived FROM todos WHERE id = ${id} LIMIT 1
  `
  if (!existing[0]) throw new HTTPException(404, { message: 'Todo introuvable' })

  const enabled = body.enabled ?? existing[0].enabled
  const archived = body.archived ?? existing[0].archived

  const rows = await sql<UserTodoRow[]>`
    UPDATE todos SET
      enabled = ${enabled},
      archived = ${archived},
      updated_at = now()
    WHERE id = ${id}
    RETURNING
      id, name, description, recurrence, priority, enabled, archived, shared,
      created_at, updated_at,
      (SELECT COUNT(*)::int FROM todo_members m WHERE m.todo_id = todos.id) AS member_count
  `

  const todo = rows[0]
  if (!todo) throw new HTTPException(404, { message: 'Todo introuvable' })

  return c.json({
    todo: {
      id: todo.id,
      name: todo.name,
      description: todo.description ?? undefined,
      recurrence: todo.recurrence,
      priority: todo.priority,
      enabled: todo.enabled,
      archived: todo.archived,
      shared: todo.shared,
      memberCount: todo.member_count,
      createdAt: todo.created_at.toISOString(),
      updatedAt: todo.updated_at.toISOString(),
    },
  })
})
