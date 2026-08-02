import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { sql } from '../db/client.js'
import { actorLabel, createAppMessage } from '../lib/messages.js'
import { getMembership } from '../lib/todoAccess.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

type ShareTodoRow = {
  id: string
  name: string
  description: string | null
  recurrence: string
  days: string[] | null
  day_of_month: number | null
  deadline: string | null
  priority: string
  shared: boolean
  share_token: string | null
  user_id: string
  owner_name: string | null
  owner_email: string
}

function mapPreview(row: ShareTodoRow, membershipRole: 'OWNER' | 'MEMBER' | null) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    recurrence: row.recurrence,
    days: row.days ?? undefined,
    dayOfMonth: row.day_of_month ?? undefined,
    deadline:
      typeof row.deadline === 'string' ? row.deadline.slice(0, 10) : row.deadline ?? undefined,
    priority: row.priority,
    ownerDisplayName: row.owner_name?.trim() || row.owner_email.split('@')[0] || 'Quelqu’un',
    membershipRole,
    alreadyMember: membershipRole != null,
  }
}

async function loadSharedTodo(token: string): Promise<ShareTodoRow | null> {
  const rows = await sql<ShareTodoRow[]>`
    SELECT
      t.id, t.name, t.description, t.recurrence, t.days, t.day_of_month,
      t.deadline::text AS deadline, t.priority, t.shared, t.share_token, t.user_id,
      u.display_name AS owner_name, u.email AS owner_email
    FROM todos t
    INNER JOIN users u ON u.id = t.user_id
    WHERE t.share_token = ${token} AND t.shared = true AND t.archived = false
    LIMIT 1
  `
  return rows[0] ?? null
}

export const shareRoutes = new Hono<{ Variables: AuthVariables }>()

shareRoutes.use('*', requireAuth)

shareRoutes.get('/:token', async (c) => {
  const userId = c.get('user').sub
  const token = c.req.param('token')
  const todo = await loadSharedTodo(token)
  if (!todo) throw new HTTPException(404, { message: 'Invitation introuvable ou expirée' })

  const membership = await getMembership(todo.id, userId)
  return c.json({ todo: mapPreview(todo, membership?.role ?? null) })
})

shareRoutes.post('/:token/join', async (c) => {
  const userId = c.get('user').sub
  const token = c.req.param('token')
  const todo = await loadSharedTodo(token)
  if (!todo) throw new HTTPException(404, { message: 'Invitation introuvable ou expirée' })

  const existing = await getMembership(todo.id, userId)
  if (existing) {
    return c.json({ ok: true, alreadyMember: true, todoId: todo.id })
  }

  await sql`
    INSERT INTO todo_members (todo_id, user_id, role, joined_at)
    VALUES (${todo.id}, ${userId}::uuid, 'MEMBER', now())
  `

  const label = await actorLabel(userId)
  await createAppMessage({
    userId: todo.user_id,
    type: 'SHARE_JOINED',
    title: 'Nouveau membre',
    body: `${label} a rejoint la todo « ${todo.name} ».`,
    meta: { todoId: todo.id, actorId: userId },
  })

  return c.json({ ok: true, alreadyMember: false, todoId: todo.id }, 201)
})

shareRoutes.post('/:token/decline', async (c) => {
  const userId = c.get('user').sub
  const token = c.req.param('token')
  const todo = await loadSharedTodo(token)
  if (!todo) throw new HTTPException(404, { message: 'Invitation introuvable ou expirée' })

  const existing = await getMembership(todo.id, userId)
  if (existing) {
    throw new HTTPException(400, { message: 'Tu es déjà membre de cette todo' })
  }

  const label = await actorLabel(userId)
  await createAppMessage({
    userId: todo.user_id,
    type: 'SHARE_DECLINED',
    title: 'Invitation refusée',
    body: `${label} a refusé de rejoindre « ${todo.name} ».`,
    meta: { todoId: todo.id, actorId: userId },
  })

  return c.json({ ok: true })
})
