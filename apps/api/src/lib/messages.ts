import { sql } from '../db/client.js'
import { createId } from './id.js'

export type AppMessageType =
  | 'SHARE_JOINED'
  | 'SHARE_DECLINED'
  | 'SHARE_COMPLETED'
  | 'SHARE_UNCOMPLETED'
  | 'SHARE_REMOVED'
  | 'SHARE_LEFT'

export async function createAppMessage(input: {
  userId: string
  type: AppMessageType
  title: string
  body: string
  meta?: Record<string, unknown>
}): Promise<void> {
  await sql`
    INSERT INTO app_messages (id, user_id, type, title, body, meta, created_at)
    VALUES (
      ${createId('msg')},
      ${input.userId}::uuid,
      ${input.type},
      ${input.title},
      ${input.body},
      ${sql.json((input.meta ?? {}) as Parameters<typeof sql.json>[0])},
      now()
    )
  `
}

export async function actorLabel(userId: string): Promise<string> {
  const rows = await sql<{ display_name: string | null; email: string }[]>`
    SELECT display_name, email FROM users WHERE id = ${userId}::uuid LIMIT 1
  `
  const user = rows[0]
  if (!user) return 'Quelqu’un'
  return user.display_name?.trim() || user.email.split('@')[0] || 'Quelqu’un'
}
