import { Hono } from 'hono'
import { sql } from '../db/client.js'
import { badgesReplaceSchema } from '../lib/schemas.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

type BadgeRow = {
  badge_id: string
  unlocked_at: Date
}

type FlagRow = {
  has_traveled: boolean
}

export const badgeRoutes = new Hono<{ Variables: AuthVariables }>()

badgeRoutes.use('*', requireAuth)

badgeRoutes.get('/', async (c) => {
  const userId = c.get('user').sub
  const badges = await sql<BadgeRow[]>`
    SELECT badge_id, unlocked_at FROM user_badges WHERE user_id = ${userId}::uuid
  `
  const flags = await sql<FlagRow[]>`
    SELECT has_traveled FROM user_badge_flags WHERE user_id = ${userId}::uuid LIMIT 1
  `

  const unlocked: Record<string, { unlockedAt: string }> = {}
  for (const row of badges) {
    unlocked[row.badge_id] = { unlockedAt: row.unlocked_at.toISOString() }
  }

  return c.json({
    progress: {
      unlocked,
      hasTraveled: Boolean(flags[0]?.has_traveled),
    },
  })
})

badgeRoutes.put('/', async (c) => {
  const userId = c.get('user').sub
  const body = badgesReplaceSchema.parse(await c.req.json())

  await sql.begin(async (tx) => {
    await tx`DELETE FROM user_badges WHERE user_id = ${userId}::uuid`
    for (const [badgeId, unlock] of Object.entries(body.unlocked)) {
      await tx`
        INSERT INTO user_badges (user_id, badge_id, unlocked_at)
        VALUES (${userId}::uuid, ${badgeId}, ${new Date(unlock.unlockedAt)})
      `
    }
    await tx`
      INSERT INTO user_badge_flags (user_id, has_traveled)
      VALUES (${userId}::uuid, ${Boolean(body.hasTraveled)})
      ON CONFLICT (user_id) DO UPDATE SET has_traveled = EXCLUDED.has_traveled
    `
  })

  return c.json({
    progress: {
      unlocked: body.unlocked,
      hasTraveled: Boolean(body.hasTraveled),
    },
  })
})

badgeRoutes.post('/unlock', async (c) => {
  const userId = c.get('user').sub
  const payload = await c.req.json()
  const ids: string[] = Array.isArray(payload.ids) ? payload.ids : []
  const now = new Date()

  for (const badgeId of ids) {
    await sql`
      INSERT INTO user_badges (user_id, badge_id, unlocked_at)
      VALUES (${userId}::uuid, ${badgeId}, ${now})
      ON CONFLICT (user_id, badge_id) DO NOTHING
    `
  }

  if (payload.hasTraveled === true) {
    await sql`
      INSERT INTO user_badge_flags (user_id, has_traveled)
      VALUES (${userId}::uuid, true)
      ON CONFLICT (user_id) DO UPDATE SET has_traveled = true
    `
  }

  const badges = await sql<BadgeRow[]>`
    SELECT badge_id, unlocked_at FROM user_badges WHERE user_id = ${userId}::uuid
  `
  const flags = await sql<FlagRow[]>`
    SELECT has_traveled FROM user_badge_flags WHERE user_id = ${userId}::uuid LIMIT 1
  `
  const unlocked: Record<string, { unlockedAt: string }> = {}
  for (const row of badges) {
    unlocked[row.badge_id] = { unlockedAt: row.unlocked_at.toISOString() }
  }

  return c.json({
    progress: {
      unlocked,
      hasTraveled: Boolean(flags[0]?.has_traveled),
    },
  })
})
