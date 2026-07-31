import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { sql } from '../db/client.js'
import { createId } from '../lib/id.js'
import { historyInputSchema, historyUpdateSchema } from '../lib/schemas.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

type HistoryRow = {
  id: string
  user_id: string
  todo_id: string
  date: string
  status: 'DONE' | 'MISSED'
  created_at: Date
}

function mapEntry(row: HistoryRow) {
  return {
    id: row.id,
    todoId: row.todo_id,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : String(row.date).slice(0, 10),
    status: row.status,
    createdAt: row.created_at.toISOString(),
  }
}

export const historyRoutes = new Hono<{ Variables: AuthVariables }>()

historyRoutes.use('*', requireAuth)

historyRoutes.get('/', async (c) => {
  const userId = c.get('user').sub
  const rows = await sql<HistoryRow[]>`
    SELECT id, user_id, todo_id, date::text AS date, status, created_at
    FROM history_entries
    WHERE user_id = ${userId}::uuid
    ORDER BY date ASC, created_at ASC
  `
  return c.json({ entries: rows.map(mapEntry) })
})

historyRoutes.post('/', async (c) => {
  const userId = c.get('user').sub
  const body = historyInputSchema.parse(await c.req.json())
  const id = body.id ?? createId('hist')

  const todo = await sql`
    SELECT id FROM todos WHERE id = ${body.todoId} AND user_id = ${userId}::uuid LIMIT 1
  `
  if (!todo[0]) throw new HTTPException(400, { message: 'Todo introuvable' })

  const rows = await sql<HistoryRow[]>`
    INSERT INTO history_entries (id, user_id, todo_id, date, status, created_at)
    VALUES (
      ${id},
      ${userId}::uuid,
      ${body.todoId},
      ${body.date}::date,
      ${body.status},
      ${body.createdAt ? new Date(body.createdAt) : new Date()}
    )
    ON CONFLICT (todo_id, date) DO UPDATE SET
      status = EXCLUDED.status
    RETURNING id, user_id, todo_id, date::text AS date, status, created_at
  `
  const entry = rows[0]
  if (!entry) throw new HTTPException(500, { message: 'Création historique impossible' })
  return c.json({ entry: mapEntry(entry) }, 201)
})

historyRoutes.patch('/:id', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const body = historyUpdateSchema.parse(await c.req.json())

  const rows = await sql<HistoryRow[]>`
    UPDATE history_entries SET status = ${body.status}
    WHERE id = ${id} AND user_id = ${userId}::uuid
    RETURNING id, user_id, todo_id, date::text AS date, status, created_at
  `
  const entry = rows[0]
  if (!entry) throw new HTTPException(404, { message: 'Entrée introuvable' })
  return c.json({ entry: mapEntry(entry) })
})

historyRoutes.delete('/:id', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const result = await sql`
    DELETE FROM history_entries WHERE id = ${id} AND user_id = ${userId}::uuid
  `
  if (result.count === 0) throw new HTTPException(404, { message: 'Entrée introuvable' })
  return c.json({ ok: true })
})

historyRoutes.put('/replace', async (c) => {
  const userId = c.get('user').sub
  const payload = await c.req.json()
  const entries = z.array(historyInputSchema).parse(payload.entries ?? payload)

  await sql.begin(async (tx) => {
    await tx`DELETE FROM history_entries WHERE user_id = ${userId}::uuid`
    for (const body of entries) {
      const id = body.id ?? createId('hist')
      await tx`
        INSERT INTO history_entries (id, user_id, todo_id, date, status, created_at)
        VALUES (
          ${id},
          ${userId}::uuid,
          ${body.todoId},
          ${body.date}::date,
          ${body.status},
          ${body.createdAt ? new Date(body.createdAt) : new Date()}
        )
        ON CONFLICT (todo_id, date) DO UPDATE SET status = EXCLUDED.status
      `
    }
  })

  const rows = await sql<HistoryRow[]>`
    SELECT id, user_id, todo_id, date::text AS date, status, created_at
    FROM history_entries
    WHERE user_id = ${userId}::uuid
    ORDER BY date ASC, created_at ASC
  `
  return c.json({ entries: rows.map(mapEntry) })
})
