import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { sql } from '../db/client.js'
import { env } from '../env.js'
import { isPushConfigured } from '../lib/push.js'
import { sendReminderToUser } from '../lib/reminderJob.js'
import { notificationPrefsSchema, pushSubscriptionSchema } from '../lib/schemas.js'
import { normalizeTime } from '../lib/zonedTime.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

type PrefsRow = {
  user_id: string
  enabled: boolean
  reminder_time: string | Date
  days: string[]
  only_if_incomplete: boolean
  timezone: string
  last_sent_date: string | Date | null
  updated_at: Date
}

function mapPrefs(row: PrefsRow | undefined) {
  if (!row) {
    return {
      enabled: false,
      time: '18:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      onlyIfIncomplete: true,
      timezone: 'Europe/Paris',
      lastSentDate: null as string | null,
    }
  }

  return {
    enabled: row.enabled,
    time: normalizeTime(row.reminder_time),
    days: row.days?.length ? row.days : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    onlyIfIncomplete: row.only_if_incomplete,
    timezone: row.timezone || 'Europe/Paris',
    lastSentDate:
      row.last_sent_date == null
        ? null
        : typeof row.last_sent_date === 'string'
          ? row.last_sent_date.slice(0, 10)
          : row.last_sent_date.toISOString().slice(0, 10),
  }
}

async function ensurePrefs(userId: string): Promise<PrefsRow> {
  const existing = await sql<PrefsRow[]>`
    SELECT user_id, enabled, reminder_time, days, only_if_incomplete, timezone, last_sent_date, updated_at
    FROM notification_prefs WHERE user_id = ${userId}::uuid LIMIT 1
  `
  if (existing[0]) return existing[0]

  const created = await sql<PrefsRow[]>`
    INSERT INTO notification_prefs (user_id)
    VALUES (${userId}::uuid)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id, enabled, reminder_time, days, only_if_incomplete, timezone, last_sent_date, updated_at
  `
  if (created[0]) return created[0]

  const again = await sql<PrefsRow[]>`
    SELECT user_id, enabled, reminder_time, days, only_if_incomplete, timezone, last_sent_date, updated_at
    FROM notification_prefs WHERE user_id = ${userId}::uuid LIMIT 1
  `
  if (!again[0]) throw new HTTPException(500, { message: 'Prefs introuvables' })
  return again[0]
}

export const notificationRoutes = new Hono<{ Variables: AuthVariables }>()

notificationRoutes.get('/vapid-public-key', (c) => {
  if (!isPushConfigured()) {
    return c.json({ configured: false, publicKey: null })
  }
  return c.json({ configured: true, publicKey: env.VAPID_PUBLIC_KEY })
})

notificationRoutes.use('*', requireAuth)

notificationRoutes.get('/prefs', async (c) => {
  const userId = c.get('user').sub
  const row = await ensurePrefs(userId)
  return c.json({ prefs: mapPrefs(row), pushConfigured: isPushConfigured() })
})

notificationRoutes.patch('/prefs', async (c) => {
  const userId = c.get('user').sub
  const body = notificationPrefsSchema.parse(await c.req.json())
  await ensurePrefs(userId)

  const current = await sql<PrefsRow[]>`
    SELECT user_id, enabled, reminder_time, days, only_if_incomplete, timezone, last_sent_date, updated_at
    FROM notification_prefs WHERE user_id = ${userId}::uuid LIMIT 1
  `
  const cur = current[0]!
  const enabled = body.enabled ?? cur.enabled
  const time = body.time ?? normalizeTime(cur.reminder_time)
  const days = body.days ?? cur.days
  const onlyIfIncomplete = body.onlyIfIncomplete ?? cur.only_if_incomplete
  const timezone = body.timezone ?? cur.timezone

  const rows = await sql<PrefsRow[]>`
    UPDATE notification_prefs SET
      enabled = ${enabled},
      reminder_time = ${time}::time,
      days = ${days},
      only_if_incomplete = ${onlyIfIncomplete},
      timezone = ${timezone},
      updated_at = now()
    WHERE user_id = ${userId}::uuid
    RETURNING user_id, enabled, reminder_time, days, only_if_incomplete, timezone, last_sent_date, updated_at
  `

  return c.json({ prefs: mapPrefs(rows[0]), pushConfigured: isPushConfigured() })
})

notificationRoutes.post('/subscribe', async (c) => {
  if (!isPushConfigured()) {
    throw new HTTPException(503, { message: 'Web Push non configuré sur le serveur' })
  }
  const userId = c.get('user').sub
  const body = pushSubscriptionSchema.parse(await c.req.json())
  await ensurePrefs(userId)

  await sql`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
    VALUES (
      ${userId}::uuid,
      ${body.endpoint},
      ${body.keys.p256dh},
      ${body.keys.auth},
      ${body.userAgent ?? null},
      now()
    )
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      user_agent = EXCLUDED.user_agent,
      updated_at = now()
  `

  return c.json({ ok: true }, 201)
})

notificationRoutes.delete('/subscribe', async (c) => {
  const userId = c.get('user').sub
  const body = z.object({ endpoint: z.string().url() }).parse(await c.req.json())
  await sql`
    DELETE FROM push_subscriptions
    WHERE user_id = ${userId}::uuid AND endpoint = ${body.endpoint}
  `
  return c.json({ ok: true })
})

notificationRoutes.post('/test', async (c) => {
  if (!isPushConfigured()) {
    throw new HTTPException(503, { message: 'Web Push non configuré sur le serveur' })
  }
  const userId = c.get('user').sub
  await ensurePrefs(userId)
  const result = await sendReminderToUser(userId, { force: true })
  if (result.skipped === 'no_subscription') {
    throw new HTTPException(400, {
      message: 'Aucun abonnement push. Réactive les notifications sur cet appareil.',
    })
  }
  return c.json({ ok: true, sent: result.sent })
})
