import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { sql } from '../db/client.js'
import { createId } from '../lib/id.js'
import { actorLabel, createAppMessage } from '../lib/messages.js'
import { historyInputSchema, historyUpdateSchema } from '../lib/schemas.js'
import { getMembership } from '../lib/todoAccess.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

type HistoryRow = {
  id: string
  user_id: string
  todo_id: string
  date: string
  status: 'DONE' | 'MISSED'
  completed_by: string | null
  completed_by_name: string | null
  created_at: Date
}

function mapEntry(row: HistoryRow) {
  return {
    id: row.id,
    todoId: row.todo_id,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : String(row.date).slice(0, 10),
    status: row.status,
    completedBy: row.completed_by ?? undefined,
    completedByName: row.completed_by_name ?? undefined,
    createdAt: row.created_at.toISOString(),
  }
}

export const historyRoutes = new Hono<{ Variables: AuthVariables }>()

historyRoutes.use('*', requireAuth)

historyRoutes.get('/', async (c) => {
  const userId = c.get('user').sub
  const rows = await sql<HistoryRow[]>`
    SELECT
      h.id, h.user_id, h.todo_id, h.date::text AS date, h.status,
      h.completed_by,
      COALESCE(u.display_name, split_part(u.email, '@', 1)) AS completed_by_name,
      h.created_at
    FROM history_entries h
    INNER JOIN todo_members m ON m.todo_id = h.todo_id AND m.user_id = ${userId}::uuid
    LEFT JOIN users u ON u.id = h.completed_by
    ORDER BY h.date ASC, h.created_at ASC
  `
  return c.json({ entries: rows.map(mapEntry) })
})

historyRoutes.post('/', async (c) => {
  const userId = c.get('user').sub
  const body = historyInputSchema.parse(await c.req.json())
  const id = body.id ?? createId('hist')

  const membership = await getMembership(body.todoId, userId)
  if (!membership) throw new HTTPException(400, { message: 'Todo introuvable' })

  const todoRows = await sql<{ name: string; user_id: string; shared: boolean }[]>`
    SELECT name, user_id, shared FROM todos WHERE id = ${body.todoId} LIMIT 1
  `
  const todo = todoRows[0]
  if (!todo) throw new HTTPException(400, { message: 'Todo introuvable' })

  const rows = await sql<HistoryRow[]>`
    INSERT INTO history_entries (id, user_id, todo_id, date, status, completed_by, created_at)
    VALUES (
      ${id},
      ${todo.user_id}::uuid,
      ${body.todoId},
      ${body.date}::date,
      ${body.status},
      ${userId}::uuid,
      ${body.createdAt ? new Date(body.createdAt) : new Date()}
    )
    ON CONFLICT (todo_id, date) DO UPDATE SET
      status = EXCLUDED.status,
      completed_by = EXCLUDED.completed_by
    RETURNING id, user_id, todo_id, date::text AS date, status, completed_by, created_at
  `
  const entry = rows[0]
  if (!entry) throw new HTTPException(500, { message: 'Création historique impossible' })

  const nameRows = await sql<{ display_name: string | null; email: string }[]>`
    SELECT display_name, email FROM users WHERE id = ${userId}::uuid LIMIT 1
  `
  const completedByName =
    nameRows[0]?.display_name?.trim() || nameRows[0]?.email.split('@')[0] || undefined

  if (todo.shared && body.status === 'DONE') {
    const label = await actorLabel(userId)
    const recipients = await sql<{ user_id: string }[]>`
      SELECT user_id FROM todo_members
      WHERE todo_id = ${body.todoId} AND user_id <> ${userId}::uuid
    `
    for (const recipient of recipients) {
      await createAppMessage({
        userId: recipient.user_id,
        type: 'SHARE_COMPLETED',
        title: 'Todo effectuée',
        body: `${label} a validé « ${todo.name} ».`,
        meta: { todoId: body.todoId, actorId: userId, date: body.date },
      })
    }
  }

  return c.json(
    {
      entry: mapEntry({
        ...entry,
        completed_by_name: completedByName ?? null,
      }),
    },
    201,
  )
})

historyRoutes.patch('/:id', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const body = historyUpdateSchema.parse(await c.req.json())

  const existing = await sql<{ todo_id: string }[]>`
    SELECT todo_id FROM history_entries WHERE id = ${id} LIMIT 1
  `
  if (!existing[0]) throw new HTTPException(404, { message: 'Entrée introuvable' })
  const membership = await getMembership(existing[0].todo_id, userId)
  if (!membership) throw new HTTPException(404, { message: 'Entrée introuvable' })

  const rows = await sql<HistoryRow[]>`
    UPDATE history_entries SET
      status = ${body.status},
      completed_by = ${userId}::uuid
    WHERE id = ${id}
    RETURNING id, user_id, todo_id, date::text AS date, status, completed_by, created_at
  `
  const entry = rows[0]
  if (!entry) throw new HTTPException(404, { message: 'Entrée introuvable' })

  const nameRows = await sql<{ display_name: string | null; email: string }[]>`
    SELECT display_name, email FROM users WHERE id = ${userId}::uuid LIMIT 1
  `
  const completedByName =
    nameRows[0]?.display_name?.trim() || nameRows[0]?.email.split('@')[0] || null

  return c.json({
    entry: mapEntry({ ...entry, completed_by_name: completedByName }),
  })
})

historyRoutes.delete('/:id', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')

  const existing = await sql<{ todo_id: string; date: string }[]>`
    SELECT todo_id, date::text AS date FROM history_entries WHERE id = ${id} LIMIT 1
  `
  if (!existing[0]) throw new HTTPException(404, { message: 'Entrée introuvable' })

  const membership = await getMembership(existing[0].todo_id, userId)
  if (!membership) throw new HTTPException(404, { message: 'Entrée introuvable' })

  const todoRows = await sql<{ name: string; shared: boolean }[]>`
    SELECT name, shared FROM todos WHERE id = ${existing[0].todo_id} LIMIT 1
  `

  const result = await sql`DELETE FROM history_entries WHERE id = ${id}`
  if (result.count === 0) throw new HTTPException(404, { message: 'Entrée introuvable' })

  if (todoRows[0]?.shared) {
    const label = await actorLabel(userId)
    const recipients = await sql<{ user_id: string }[]>`
      SELECT user_id FROM todo_members
      WHERE todo_id = ${existing[0].todo_id} AND user_id <> ${userId}::uuid
    `
    for (const recipient of recipients) {
      await createAppMessage({
        userId: recipient.user_id,
        type: 'SHARE_UNCOMPLETED',
        title: 'Validation annulée',
        body: `${label} a décoché « ${todoRows[0].name} ».`,
        meta: {
          todoId: existing[0].todo_id,
          actorId: userId,
          date: existing[0].date.slice(0, 10),
        },
      })
    }
  }

  return c.json({ ok: true })
})

historyRoutes.put('/replace', async (c) => {
  const userId = c.get('user').sub
  const payload = await c.req.json()
  const entries = z.array(historyInputSchema).parse(payload.entries ?? payload)

  await sql.begin(async (tx) => {
    await tx`
      DELETE FROM history_entries
      WHERE todo_id IN (
        SELECT todo_id FROM todo_members
        WHERE user_id = ${userId}::uuid AND role = 'OWNER'
      )
    `
    for (const body of entries) {
      const membership = await getMembership(body.todoId, userId)
      if (!membership || membership.role !== 'OWNER') continue
      const todoRows = await sql<{ user_id: string }[]>`
        SELECT user_id FROM todos WHERE id = ${body.todoId} LIMIT 1
      `
      if (!todoRows[0]) continue
      const id = body.id ?? createId('hist')
      await tx`
        INSERT INTO history_entries (id, user_id, todo_id, date, status, completed_by, created_at)
        VALUES (
          ${id},
          ${todoRows[0].user_id}::uuid,
          ${body.todoId},
          ${body.date}::date,
          ${body.status},
          ${userId}::uuid,
          ${body.createdAt ? new Date(body.createdAt) : new Date()}
        )
        ON CONFLICT (todo_id, date) DO UPDATE SET
          status = EXCLUDED.status,
          completed_by = EXCLUDED.completed_by
      `
    }
  })

  const rows = await sql<HistoryRow[]>`
    SELECT
      h.id, h.user_id, h.todo_id, h.date::text AS date, h.status,
      h.completed_by,
      COALESCE(u.display_name, split_part(u.email, '@', 1)) AS completed_by_name,
      h.created_at
    FROM history_entries h
    INNER JOIN todo_members m ON m.todo_id = h.todo_id AND m.user_id = ${userId}::uuid
    LEFT JOIN users u ON u.id = h.completed_by
    ORDER BY h.date ASC, h.created_at ASC
  `
  return c.json({ entries: rows.map(mapEntry) })
})
