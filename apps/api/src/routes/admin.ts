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
  todo_count: number
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
      (
        SELECT COUNT(*)::int FROM todos t WHERE t.user_id = u.id
      ) AS todo_count
    FROM users u
    ORDER BY u.created_at DESC
  `

  return c.json({
    users: rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      createdAt: row.created_at.toISOString(),
      todoCount: row.todo_count,
    })),
  })
})

adminRoutes.get('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const users = await sql<UserStatsRow[]>`
    SELECT
      u.id,
      u.email,
      u.display_name,
      u.created_at,
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
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at.toISOString(),
      todoCount: user.todo_count,
    },
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
