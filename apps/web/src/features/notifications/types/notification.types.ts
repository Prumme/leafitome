import type { Day } from '@/shared/types/common.types'

export interface NotificationPrefs {
  /** Souhaite recevoir des rappels (nécessite aussi la permission navigateur) */
  enabled: boolean
  /** Heure locale HH:mm */
  time: string
  /** Jours où un rappel peut partir */
  days: Day[]
  /** Si true : pas de notif quand tout est déjà fait */
  onlyIfIncomplete: boolean
  /** Fuseau IANA pour l’heure du rappel */
  timezone: string
  /** Dernier jour (YYYY-MM-DD) où une notif a été envoyée */
  lastSentDate: string | null
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: false,
  time: '18:00',
  days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  onlyIfIncomplete: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris',
  lastSentDate: null,
}
