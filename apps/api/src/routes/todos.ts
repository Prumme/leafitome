import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { sql } from '../db/client.js'
import { createId } from '../lib/id.js'
import { todoInputSchema, todoUpdateSchema } from '../lib/schemas.js'
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
  priority: 'VHIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VLOW'
  color: string | null
  enabled: boolean
  archived: boolean
  created_at: Date
  updated_at: Date
}

function mapTodo(row: TodoRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    recurrence: row.recurrence,
    days: row.days ?? undefined,
    dayOfMonth: row.day_of_month ?? undefined,
    earlyCompletable: row.early_completable,
    priority: row.priority,
    color: row.color ?? undefined,
    enabled: row.enabled,
    archived: row.archived,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function daysParam(days: string[] | null | undefined) {
  if (!days || days.length === 0) return null
  return days
}

export const todoRoutes = new Hono<{ Variables: AuthVariables }>()

todoRoutes.use('*', requireAuth)

todoRoutes.get('/', async (c) => {
  const userId = c.get('user').sub
  const rows = await sql<TodoRow[]>`
    SELECT * FROM todos WHERE user_id = ${userId}::uuid ORDER BY created_at ASC
  `
  return c.json({ todos: rows.map(mapTodo) })
})

todoRoutes.put('/replace', async (c) => {
  const userId = c.get('user').sub
  const payload = await c.req.json()
  const todos = z.array(todoInputSchema).parse(payload.todos ?? payload)

  await sql.begin(async (tx) => {
    await tx`DELETE FROM todos WHERE user_id = ${userId}::uuid`
    for (const body of todos) {
      const id = body.id ?? createId('todo')
      const now = new Date()
      const days = daysParam(body.days)
      await tx`
        INSERT INTO todos (
          id, user_id, name, description, recurrence, days, day_of_month,
          early_completable, priority, color, enabled, archived, created_at, updated_at
        ) VALUES (
          ${id},
          ${userId}::uuid,
          ${body.name},
          ${body.description ?? null},
          ${body.recurrence},
          ${days},
          ${body.dayOfMonth ?? null},
          ${body.earlyCompletable ?? false},
          ${body.priority},
          ${body.color ?? null},
          ${body.enabled ?? true},
          ${body.archived ?? false},
          ${body.createdAt ? new Date(body.createdAt) : now},
          ${body.updatedAt ? new Date(body.updatedAt) : now}
        )
      `
    }
  })

  const rows = await sql<TodoRow[]>`
    SELECT * FROM todos WHERE user_id = ${userId}::uuid ORDER BY created_at ASC
  `
  return c.json({ todos: rows.map(mapTodo) })
})

todoRoutes.post('/', async (c) => {
  const userId = c.get('user').sub
  const body = todoInputSchema.parse(await c.req.json())
  const id = body.id ?? createId('todo')
  const now = new Date()
  const days = daysParam(body.days)

  const rows = await sql<TodoRow[]>`
    INSERT INTO todos (
      id, user_id, name, description, recurrence, days, day_of_month,
      early_completable, priority, color, enabled, archived, created_at, updated_at
    ) VALUES (
      ${id},
      ${userId}::uuid,
      ${body.name},
      ${body.description ?? null},
      ${body.recurrence},
      ${days},
      ${body.dayOfMonth ?? null},
      ${body.earlyCompletable ?? false},
      ${body.priority},
      ${body.color ?? null},
      ${body.enabled ?? true},
      ${body.archived ?? false},
      ${body.createdAt ? new Date(body.createdAt) : now},
      ${body.updatedAt ? new Date(body.updatedAt) : now}
    )
    RETURNING *
  `
  const todo = rows[0]
  if (!todo) throw new HTTPException(500, { message: 'Création todo impossible' })
  return c.json({ todo: mapTodo(todo) }, 201)
})

todoRoutes.patch('/:id', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const body = todoUpdateSchema.parse(await c.req.json())

  const existing = await sql<TodoRow[]>`
    SELECT * FROM todos WHERE id = ${id} AND user_id = ${userId}::uuid LIMIT 1
  `
  if (!existing[0]) throw new HTTPException(404, { message: 'Todo introuvable' })

  const current = existing[0]
  const name = body.name ?? current.name
  const description = body.description !== undefined ? (body.description ?? null) : current.description
  const recurrence = body.recurrence ?? current.recurrence
  const days =
    body.days !== undefined ? daysParam(body.days) : current.days
  const dayOfMonth = body.dayOfMonth !== undefined ? (body.dayOfMonth ?? null) : current.day_of_month
  const earlyCompletable =
    body.earlyCompletable !== undefined ? body.earlyCompletable : current.early_completable
  const priority = body.priority ?? current.priority
  const color = body.color !== undefined ? (body.color ?? null) : current.color
  const enabled = body.enabled !== undefined ? body.enabled : current.enabled
  const archived = body.archived !== undefined ? body.archived : current.archived

  const rows = await sql<TodoRow[]>`
    UPDATE todos SET
      name = ${name},
      description = ${description},
      recurrence = ${recurrence},
      days = ${days},
      day_of_month = ${dayOfMonth},
      early_completable = ${earlyCompletable},
      priority = ${priority},
      color = ${color},
      enabled = ${enabled},
      archived = ${archived},
      updated_at = now()
    WHERE id = ${id} AND user_id = ${userId}::uuid
    RETURNING *
  `
  const todo = rows[0]
  if (!todo) throw new HTTPException(404, { message: 'Todo introuvable' })
  return c.json({ todo: mapTodo(todo) })
})

todoRoutes.delete('/:id', async (c) => {
  const userId = c.get('user').sub
  const id = c.req.param('id')
  const result = await sql`
    DELETE FROM todos WHERE id = ${id} AND user_id = ${userId}::uuid
  `
  if (result.count === 0) throw new HTTPException(404, { message: 'Todo introuvable' })
  return c.json({ ok: true })
})
