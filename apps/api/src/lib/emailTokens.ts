import { createHash, randomBytes } from 'node:crypto'
import { sql } from '../db/client.js'
import { createId } from './id.js'

export type EmailTokenType = 'verify' | 'reset' | 'change_password'

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export async function issueEmailToken(
  userId: string,
  type: EmailTokenType,
  ttlMinutes: number,
): Promise<string> {
  const raw = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(raw)
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000)

  // Invalide les tokens non utilisés du même type
  await sql`
    UPDATE email_tokens
    SET used_at = now()
    WHERE user_id = ${userId}::uuid AND type = ${type} AND used_at IS NULL
  `

  await sql`
    INSERT INTO email_tokens (id, user_id, type, token_hash, expires_at, created_at)
    VALUES (${createId('etok')}, ${userId}::uuid, ${type}, ${tokenHash}, ${expiresAt}, now())
  `

  return raw
}

export async function consumeEmailToken(
  raw: string,
  type: EmailTokenType,
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(raw)
  const rows = await sql<{ id: string; user_id: string; expires_at: Date; used_at: Date | null }[]>`
    SELECT id, user_id, expires_at, used_at
    FROM email_tokens
    WHERE token_hash = ${tokenHash} AND type = ${type}
    LIMIT 1
  `
  const row = rows[0]
  if (!row || row.used_at || row.expires_at.getTime() < Date.now()) {
    return null
  }

  await sql`UPDATE email_tokens SET used_at = now() WHERE id = ${row.id}`
  return { userId: row.user_id }
}
