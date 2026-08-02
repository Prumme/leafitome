import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { sql } from '../db/client.js'
import { createId } from '../lib/id.js'
import { actorLabel, createAppMessage } from '../lib/messages.js'
import { todoInputSchema, todoUpdateSchema } from '../lib/schemas.js'
import { getMembership } from '../lib/todoAccess.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

type TodoRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  recurrence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONDAY'
  days: string[] | null
  day_of_month: number | null
  early_completable: boolean
  deadline: string | null
  deadline_updated_at: Date | null
  priority: 'VHIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VLOW'
  color: string | null
  enabled: boolean
  archived: boolean
  shared: boolean
  share_token: string | null
  created_at: Date
  updated_at: Date
  member_role?: 'OWNER' | 'MEMBER'
}

/** Normalise DATE Postgres (string ou Date) → YYYY-MM-DD. */
function toDateOnly(value: string | Date | null | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
    return match?.[1]
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear()
    const m = String(value.getUTCMonth() + 1).padStart(2, '0')
    const d = String(value.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return undefined
}

function mapTodo(row: TodoRow) {
  const membershipRole = row.member_role ?? 'OWNER'
  const isOwner = membershipRole === 'OWNER'
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    recurrence: row.recurrence,
    days: row.days ?? undefined,
    dayOfMonth: row.day_of_month ?? undefined,
    earlyCompletable: row.early_completable,
    deadline: toDateOnly(row.deadline),
    deadlineUpdatedAt: row.deadline_updated_at
      ? row.deadline_updated_at.toISOString()
      : undefined,
    priority: row.priority,
    color: row.color ?? undefined,
    enabled: row.enabled,
    archived: row.archived,
    shared: Boolean(row.shared),
    shareToken: row.shared && isOwner ? (row.share_token ?? undefined) : undefined,
    ownerId: row.user_id,
    membershipRole,
    isOwner,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function daysParam(days: string[] | null | undefined) {
  if (!days || days.length === 0) return null
  return days
}

function resolveDeadlineFields(
  recurrence: string,
  deadline: string | null | undefined,
  previousDeadline: string | null | undefined,
  previousUpdatedAt: Date | null | undefined,
  explicitUpdatedAt?: string,
): { deadline: string | null; deadlineUpdatedAt: Date | null } {
  if (recurrence !== 'ONDAY') {
    return { deadline: null, deadlineUpdatedAt: null }
  }
  const next = deadline ?? null
  if (!next) {
    return { deadline: null, deadlineUpdatedAt: null }
  }
  const prev =
    previousDeadline == null
      ? null
      : typeof previousDeadline === 'string'
        ? previousDeadline.slice(0, 10)
        : String(previousDeadline).slice(0, 10)
  if (explicitUpdatedAt) {
    return { deadline: next, deadlineUpdatedAt: new Date(explicitUpdatedAt) }
  }
  if (next !== prev || !previousUpdatedAt) {
    return { deadline: next, deadlineUpdatedAt: new Date() }
  }
  return { deadline: next, deadlineUpdatedAt: previousUpdatedAt }
}

async function resolveShareFields(
  shared: boolean,
  previousShared: boolean,
  previousToken: string | null,
): Promise<{ shared: boolean; shareToken: string | null }> {
  if (!shared) {
    return { shared: false, shareToken: previousToken }
  }
  if (previousToken) {
    return { shared: true, shareToken: previousToken }
  }
  return { shared: true, shareToken: createId('share') }
}

export const todoRoutes = new Hono<{ Variables: AuthVariables }>()

todoRoutes.use('*', requireAuth)

todoRoutes.get('/', async (c) => {
  const userId = c.get('user').sub
  const rows = await sql<TodoRow[]>`
    SELECT t.*, m.role AS member_role
    FROM todos t
    INNER JOIN todo_members m ON m.todo_id = t.id
    WHERE m.user_id = ${userId}::uuid
    ORDER BY t.created_at ASC
  `
  return c.json({ todos: rows.map(mapTodo) })
})

todoRoutes.put('/replace', async (c) => {
  const userId = c.get('user').sub
  const payload = await c.req.json()
  const todos = z.array(todoInputSchema).parse(payload.todos ?? payload)

  await sql.begin(async (tx) => {
    // Ne remplace que les todos dont l’utilisateur est OWNER
    await tx`
      DELETE FROM todos
      WHERE id IN (
        SELECT todo_id FROM todo_members
        WHERE user_id = ${userId}::uuid AND role = 'OWNER'
      )
    `
    for (const body of todos) {
      const id = body.id ?? createId('todo')
      const now = new Date()
      const days = daysParam(body.days)
      const { deadline, deadlineUpdatedAt } = resolveDeadlineFields(
        body.recurrence,
        body.deadline,
        null,
        null,
        body.deadlineUpdatedAt,
      )
      const shared = Boolean(body.shared)
      const shareToken = shared ? createId('share') : null
      await tx`
        INSERT INTO todos (
          id, user_id, name, description, recurrence, days, day_of_month,
          early_completable, deadline, deadline_updated_at, priority, color,
          enabled, archived, shared, share_token, created_at, updated_at
        ) VALUES (
          ${id},
          ${userId}::uuid,
          ${body.name},
          ${body.description ?? null},
          ${body.recurrence},
          ${days},
          ${body.dayOfMonth ?? null},
          ${body.earlyCompletable ?? false},
          ${deadline},
          ${deadlineUpdatedAt},
          ${body.priority},
          ${body.color ?? null},
          ${body.enabled ?? true},
          ${body.archived ?? false},
          ${shared},
          ${shareToken},
          ${body.createdAt ? new Date(body.createdAt) : now},
          ${body.updatedAt ? new Date(body.updatedAt) : now}
        )
      `
      await tx`
        INSERT INTO todo_members (todo_id, user_id, role, joined_at)
        VALUES (${id}, ${userId}::uuid, 'OWNER', now())
      `
    }
  })

  const rows = await sql<TodoRow[]>`
    SELECT t.*, m.role AS member_role
    FROM todos t
    INNER JOIN todo_members m ON m.todo_id = t.id
    WHERE m.user_id = ${userId}::uuid
    ORDER BY t.created_at ASC
  `
  return c.json({ todos: rows.map(mapTodo) })
})

todoRoutes.post('/', async (c) => {
  const userId = c.get('user').sub
  const body = todoInputSchema.parse(await c.req.json())
  const id = body.id ?? createId('todo')
  const now = new Date()
  const days = daysParam(body.days)
  const { deadline, deadlineUpdatedAt } = resolveDeadlineFields(
    body.recurrence,
    body.deadline,
    null,
    null,
    body.deadlineUpdatedAt,
  )
  const shared = Boolean(body.shared)
  const shareToken = shared ? createId('share') : null

  const rows = await sql.begin(async (tx) => {
    const inserted = await tx<TodoRow[]>`
      INSERT INTO todos (
        id, user_id, name, description, recurrence, days, day_of_month,
        early_completable, deadline, deadline_updated_at, priority, color,
        enabled, archived, shared, share_token, created_at, updated_at
      ) VALUES (
        ${id},
        ${userId}::uuid,
        ${body.name},
        ${body.description ?? null},
        ${body.recurrence},
        ${days},
        ${body.dayOfMonth ?? null},
        ${body.earlyCompletable ?? false},
        ${deadline},
        ${deadlineUpdatedAt},
        ${body.priority},
        ${body.color ?? null},
        ${body.enabled ?? true},
        ${body.archived ?? false},
        ${shared},
        ${shareToken},
        ${body.createdAt ? new Date(body.createdAt) : now},
        ${body.updatedAt ? new Date(body.updatedAt) : now}
      )
      RETURNING *
    `
    await tx`
      INSERT INTO todo_members (todo_id, user_id, role, joined_at)
      VALUES (${id}, ${userId}::uuid, 'OWNER', now())
    `
    return inserted
  })

  const todo = rows[0]
  if (!todo) throw new HTTPException(500, { message: 'Création todo impossible' })
  return c.json({ todo: mapTodo({ ...todo, member_role: 'OWNER' }) }, 201)
})

todoRoutes.get('/:id/members', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const membership = await getMembership(id, userId)
  if (!membership || membership.role !== 'OWNER') {
    throw new HTTPException(403, { message: 'Réservé au créateur' })
  }

  const rows = await sql<
    { user_id: string; role: string; joined_at: Date; display_name: string | null; email: string }[]
  >`
    SELECT m.user_id, m.role, m.joined_at, u.display_name, u.email
    FROM todo_members m
    INNER JOIN users u ON u.id = m.user_id
    WHERE m.todo_id = ${id}
    ORDER BY m.role ASC, m.joined_at ASC
  `

  return c.json({
    members: rows.map((row) => ({
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at.toISOString(),
      displayName: row.display_name,
      email: row.email,
    })),
  })
})

todoRoutes.delete('/:id/members/me', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const membership = await getMembership(id, userId)
  if (!membership) throw new HTTPException(404, { message: 'Tu n’es pas membre' })
  if (membership.role === 'OWNER') {
    throw new HTTPException(400, { message: 'Le créateur ne peut pas quitter sa todo' })
  }

  const todoRows = await sql<{ name: string; user_id: string }[]>`
    SELECT name, user_id FROM todos WHERE id = ${id} LIMIT 1
  `
  const todo = todoRows[0]
  await sql`DELETE FROM todo_members WHERE todo_id = ${id} AND user_id = ${userId}::uuid`

  if (todo) {
    const label = await actorLabel(userId)
    await createAppMessage({
      userId: todo.user_id,
      type: 'SHARE_LEFT',
      title: 'Membre parti',
      body: `${label} a quitté la todo « ${todo.name} ».`,
      meta: { todoId: id, actorId: userId },
    })
  }

  return c.json({ ok: true })
})

todoRoutes.delete('/:id/members/:memberId', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const memberId = c.req.param('memberId')
  const membership = await getMembership(id, userId)
  if (!membership || membership.role !== 'OWNER') {
    throw new HTTPException(403, { message: 'Réservé au créateur' })
  }
  if (memberId === userId) {
    throw new HTTPException(400, { message: 'Impossible de se retirer soi-même' })
  }

  const target = await getMembership(id, memberId)
  if (!target || target.role === 'OWNER') {
    throw new HTTPException(404, { message: 'Membre introuvable' })
  }

  const todoRows = await sql<{ name: string }[]>`
    SELECT name FROM todos WHERE id = ${id} LIMIT 1
  `
  await sql`DELETE FROM todo_members WHERE todo_id = ${id} AND user_id = ${memberId}::uuid`

  if (todoRows[0]) {
    await createAppMessage({
      userId: memberId,
      type: 'SHARE_REMOVED',
      title: 'Accès retiré',
      body: `Tu n’as plus accès à la todo partagée « ${todoRows[0].name} ».`,
      meta: { todoId: id },
    })
  }

  return c.json({ ok: true })
})

todoRoutes.patch('/:id', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const body = todoUpdateSchema.parse(await c.req.json())

  const membership = await getMembership(id, userId)
  if (!membership || membership.role !== 'OWNER') {
    throw new HTTPException(403, { message: 'Seul le créateur peut modifier cette todo' })
  }

  const existing = await sql<TodoRow[]>`
    SELECT * FROM todos WHERE id = ${id} AND user_id = ${userId}::uuid LIMIT 1
  `
  if (!existing[0]) throw new HTTPException(404, { message: 'Todo introuvable' })

  const current = existing[0]
  const name = body.name ?? current.name
  const description = body.description !== undefined ? (body.description ?? null) : current.description
  const recurrence = body.recurrence ?? current.recurrence
  const days = body.days !== undefined ? daysParam(body.days) : current.days
  const dayOfMonth = body.dayOfMonth !== undefined ? (body.dayOfMonth ?? null) : current.day_of_month
  const earlyCompletable =
    body.earlyCompletable !== undefined ? body.earlyCompletable : current.early_completable
  const priority = body.priority ?? current.priority
  const color = body.color !== undefined ? (body.color ?? null) : current.color
  const enabled = body.enabled !== undefined ? body.enabled : current.enabled
  const archived = body.archived !== undefined ? body.archived : current.archived

  const currentDeadline = toDateOnly(current.deadline) ?? null
  const nextDeadlineInput = body.deadline !== undefined ? body.deadline : currentDeadline
  const { deadline, deadlineUpdatedAt } = resolveDeadlineFields(
    recurrence,
    nextDeadlineInput,
    currentDeadline,
    current.deadline_updated_at,
    body.deadlineUpdatedAt,
  )

  const nextShared = body.shared !== undefined ? body.shared : current.shared
  const { shared, shareToken } = await resolveShareFields(
    nextShared,
    current.shared,
    current.share_token,
  )

  // Couper le partage : retirer les membres + les prévenir
  if (current.shared && !shared) {
    const members = await sql<{ user_id: string }[]>`
      SELECT user_id FROM todo_members
      WHERE todo_id = ${id} AND role = 'MEMBER'
    `
    await sql`DELETE FROM todo_members WHERE todo_id = ${id} AND role = 'MEMBER'`
    for (const member of members) {
      await createAppMessage({
        userId: member.user_id,
        type: 'SHARE_REMOVED',
        title: 'Partage terminé',
        body: `Le partage de « ${current.name} » a été désactivé. Tu n’y as plus accès.`,
        meta: { todoId: id },
      })
    }
  }

  const rows = await sql<TodoRow[]>`
    UPDATE todos SET
      name = ${name},
      description = ${description},
      recurrence = ${recurrence},
      days = ${days},
      day_of_month = ${dayOfMonth},
      early_completable = ${earlyCompletable},
      deadline = ${deadline},
      deadline_updated_at = ${deadlineUpdatedAt},
      priority = ${priority},
      color = ${color},
      enabled = ${enabled},
      archived = ${archived},
      shared = ${shared},
      share_token = ${shareToken},
      updated_at = now()
    WHERE id = ${id} AND user_id = ${userId}::uuid
    RETURNING *
  `
  const todo = rows[0]
  if (!todo) throw new HTTPException(404, { message: 'Todo introuvable' })
  return c.json({ todo: mapTodo({ ...todo, member_role: 'OWNER' }) })
})

todoRoutes.delete('/:id', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const membership = await getMembership(id, userId)
  if (!membership || membership.role !== 'OWNER') {
    throw new HTTPException(403, { message: 'Seul le créateur peut supprimer cette todo' })
  }
  const result = await sql`
    DELETE FROM todos WHERE id = ${id} AND user_id = ${userId}::uuid
  `
  if (result.count === 0) throw new HTTPException(404, { message: 'Todo introuvable' })
  return c.json({ ok: true })
})
