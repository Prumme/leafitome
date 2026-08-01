import { sql } from '../db/client.js'
import {
  computeDayCompletion,
  type HistoryRowLite,
  type TodoRowLite,
} from './dailyCompletion.js'
import { buildReminderMessage } from './reminderMessages.js'
import { isPushConfigured, sendPushNotification } from './push.js'
import { getZonedNow, normalizeTime, timeToMinutes } from './zonedTime.js'

type PrefsRow = {
  user_id: string
  enabled: boolean
  reminder_time: string | Date
  days: string[]
  only_if_incomplete: boolean
  timezone: string
  last_sent_date: string | Date | null
}

type SubRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

function dateOnly(value: string | Date | null): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

async function loadUserDayData(userId: string, dateStr: string) {
  const todos = await sql<TodoRowLite[]>`
    SELECT id, recurrence, days, day_of_month, early_completable,
           deadline::text AS deadline, deadline_updated_at, enabled, archived, created_at
    FROM todos
    WHERE user_id = ${userId}::uuid AND archived = false
  `
  const entries = await sql<HistoryRowLite[]>`
    SELECT id, todo_id, date::text AS date, status
    FROM history_entries
    WHERE user_id = ${userId}::uuid
      AND date >= (${dateStr}::date - INTERVAL '62 days')
      AND date <= ${dateStr}::date
  `
  return { todos, entries }
}

export async function sendReminderToUser(
  userId: string,
  options: { force?: boolean } = {},
): Promise<{ sent: number; skipped?: string }> {
  if (!isPushConfigured()) return { sent: 0, skipped: 'push_disabled' }

  const prefsRows = await sql<PrefsRow[]>`
    SELECT user_id, enabled, reminder_time, days, only_if_incomplete, timezone, last_sent_date
    FROM notification_prefs
    WHERE user_id = ${userId}::uuid
    LIMIT 1
  `
  const prefs = prefsRows[0]
  if (!prefs?.enabled && !options.force) return { sent: 0, skipped: 'disabled' }

  const timezone = prefs?.timezone || 'Europe/Paris'
  const zoned = getZonedNow(timezone)
  const days = prefs?.days?.length ? prefs.days : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  if (!options.force) {
    if (!days.includes(zoned.weekday)) return { sent: 0, skipped: 'day' }
    if (dateOnly(prefs.last_sent_date) === zoned.date) return { sent: 0, skipped: 'already_sent' }
    const target = timeToMinutes(normalizeTime(prefs.reminder_time))
    if (zoned.minutes < target) return { sent: 0, skipped: 'too_early' }
  }

  const { todos, entries } = await loadUserDayData(userId, zoned.date)
  const { total, completionRate } = computeDayCompletion(todos, entries, zoned.date)

  if (!options.force && prefs.only_if_incomplete && total > 0 && completionRate >= 100) {
    await sql`
      UPDATE notification_prefs
      SET last_sent_date = ${zoned.date}::date, updated_at = now()
      WHERE user_id = ${userId}::uuid
    `
    return { sent: 0, skipped: 'complete' }
  }

  const message = buildReminderMessage(completionRate, total)
  const subs = await sql<SubRow[]>`
    SELECT id, endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE user_id = ${userId}::uuid
  `
  if (subs.length === 0) return { sent: 0, skipped: 'no_subscription' }

  let sent = 0
  for (const sub of subs) {
    const result = await sendPushNotification(sub, {
      title: message.title,
      body: message.body,
      url: '/app',
    })
    if (result === 'ok') sent += 1
    if (result === 'gone') {
      await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}::uuid`
    }
  }

  if (sent > 0 && !options.force) {
    await sql`
      UPDATE notification_prefs
      SET last_sent_date = ${zoned.date}::date, updated_at = now()
      WHERE user_id = ${userId}::uuid
    `
  }

  return { sent }
}

export async function runReminderTick(): Promise<void> {
  if (!isPushConfigured()) return

  const prefsRows = await sql<PrefsRow[]>`
    SELECT user_id, enabled, reminder_time, days, only_if_incomplete, timezone, last_sent_date
    FROM notification_prefs
    WHERE enabled = true
  `

  for (const prefs of prefsRows) {
    try {
      await sendReminderToUser(prefs.user_id)
    } catch (error) {
      console.error(`Reminder failed for ${prefs.user_id}`, error)
    }
  }
}

export function startReminderScheduler(): void {
  if (!isPushConfigured()) {
    console.warn('Scheduler rappels non démarré (VAPID manquant)')
    return
  }

  const intervalMs = 60_000
  console.log('Scheduler rappels Web Push : toutes les 60s')
  void runReminderTick()
  setInterval(() => {
    void runReminderTick()
  }, intervalMs)
}
