import { sql } from '../db/client.js'

export type MemberRole = 'OWNER' | 'MEMBER'

export async function getMembership(
  todoId: string,
  userId: string,
): Promise<{ role: MemberRole } | null> {
  const rows = await sql<{ role: MemberRole }[]>`
    SELECT role FROM todo_members
    WHERE todo_id = ${todoId} AND user_id = ${userId}::uuid
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function requireMembership(todoId: string, userId: string) {
  const membership = await getMembership(todoId, userId)
  if (!membership) return null
  return membership
}

export async function getTodoOwnerId(todoId: string): Promise<string | null> {
  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id FROM todos WHERE id = ${todoId} LIMIT 1
  `
  return rows[0]?.user_id ?? null
}

export async function getMemberUserIds(todoId: string): Promise<string[]> {
  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id FROM todo_members WHERE todo_id = ${todoId}
  `
  return rows.map((row) => row.user_id)
}
