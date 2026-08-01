import type { NotificationPrefs } from '@/features/notifications/types/notification.types'
import type { Day } from '@/shared/types/common.types'
import { getDayFromDate, todayString } from '@/shared/utils/dates'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** Minutes depuis minuit pour "HH:mm". */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function nowMinutes(reference = new Date()): number {
  return reference.getHours() * 60 + reference.getMinutes()
}

export function formatNowTime(reference = new Date()): string {
  return `${pad2(reference.getHours())}:${pad2(reference.getMinutes())}`
}

export interface ShouldNotifyInput {
  prefs: NotificationPrefs
  permissionGranted: boolean
  completionRate: number
  total: number
  reference?: Date
  /** Force l’envoi (bouton test) en ignorant heure / déjà envoyé */
  force?: boolean
}

export function shouldSendReminder(input: ShouldNotifyInput): boolean {
  const { prefs, permissionGranted, completionRate, total, force } = input
  const reference = input.reference ?? new Date()

  if (!prefs.enabled || !permissionGranted) return false

  const day = getDayFromDate(reference) as Day
  if (!prefs.days.includes(day)) return false

  if (prefs.onlyIfIncomplete && total > 0 && completionRate >= 100) {
    return false
  }

  if (force) return true

  const today = todayString()
  if (prefs.lastSentDate === today) return false

  return nowMinutes(reference) >= timeToMinutes(prefs.time)
}
