import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { sql } from '../db/client.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

type MessageRow = {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  meta: Record<string, unknown> | null
  read_at: Date | null
  created_at: Date
}

function mapMessage(row: MessageRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    meta: row.meta ?? {},
    readAt: row.read_at ? row.read_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  }
}

export const messageRoutes = new Hono<{ Variables: AuthVariables }>()

messageRoutes.use('*', requireAuth)

messageRoutes.get('/', async (c) => {
  const userId = c.get('user').sub
  const rows = await sql<MessageRow[]>`
    SELECT id, user_id, type, title, body, meta, read_at, created_at
    FROM app_messages
    WHERE user_id = ${userId}::uuid
    ORDER BY created_at DESC
    LIMIT 100
  `
  const unreadCount = rows.filter((row) => !row.read_at).length
  return c.json({ messages: rows.map(mapMessage), unreadCount })
})

messageRoutes.patch('/read', async (c) => {
  const userId = c.get('user').sub
  const body = z
    .object({
      ids: z.array(z.string().min(1)).optional(),
      all: z.boolean().optional(),
    })
    .parse(await c.req.json().catch(() => ({})))

  if (body.all) {
    await sql`
      UPDATE app_messages
      SET read_at = now()
      WHERE user_id = ${userId}::uuid AND read_at IS NULL
    `
    return c.json({ ok: true })
  }

  if (!body.ids?.length) {
    throw new HTTPException(400, { message: 'ids ou all requis' })
  }

  await sql`
    UPDATE app_messages
    SET read_at = now()
    WHERE user_id = ${userId}::uuid
      AND id = ANY(${body.ids})
      AND read_at IS NULL
  `
  return c.json({ ok: true })
})
