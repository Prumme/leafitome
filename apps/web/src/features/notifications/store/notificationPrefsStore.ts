import { create } from 'zustand'
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from '@/features/notifications/types/notification.types'
import type { Day } from '@/shared/types/common.types'
import { apiFetch } from '@/shared/lib/api/client'
import { localStorageAdapter, readJson } from '@/shared/lib/storage/adapter'

function legacyKey(userId: string) {
  return `leafitome_notification_prefs_${userId}`
}

function normalizePrefs(raw: Partial<NotificationPrefs> | null): NotificationPrefs {
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS }
  return {
    enabled: Boolean(raw.enabled),
    time: typeof raw.time === 'string' && /^\d{2}:\d{2}$/.test(raw.time) ? raw.time : '18:00',
    days:
      Array.isArray(raw.days) && raw.days.length > 0
        ? (raw.days as Day[])
        : [...DEFAULT_NOTIFICATION_PREFS.days],
    onlyIfIncomplete: raw.onlyIfIncomplete !== false,
    timezone:
      typeof raw.timezone === 'string' && raw.timezone
        ? raw.timezone
        : DEFAULT_NOTIFICATION_PREFS.timezone,
    lastSentDate: typeof raw.lastSentDate === 'string' ? raw.lastSentDate : null,
  }
}

interface NotificationPrefsState {
  userId: string | null
  prefs: NotificationPrefs
  loaded: boolean
  pushConfigured: boolean
  loadForUser: (userId: string) => Promise<void>
  updatePrefs: (patch: Partial<NotificationPrefs>) => Promise<void>
  reset: () => void
}

export const useNotificationPrefsStore = create<NotificationPrefsState>((set, get) => ({
  userId: null,
  prefs: { ...DEFAULT_NOTIFICATION_PREFS },
  loaded: false,
  pushConfigured: false,

  loadForUser: async (userId) => {
    try {
      const data = await apiFetch<{
        prefs: NotificationPrefs
        pushConfigured: boolean
      }>('/notifications/prefs')

      let prefs = normalizePrefs(data.prefs)

      // Migration one-shot depuis l’ancien localStorage
      const legacy = normalizePrefs(readJson(localStorageAdapter, legacyKey(userId), null))
      if (!prefs.enabled && legacy.enabled) {
        prefs = await syncLegacy(legacy)
        localStorageAdapter.removeItem(legacyKey(userId))
      }

      set({
        userId,
        prefs,
        pushConfigured: data.pushConfigured,
        loaded: true,
      })
    } catch {
      const legacy = normalizePrefs(readJson(localStorageAdapter, legacyKey(userId), null))
      set({ userId, prefs: legacy, pushConfigured: false, loaded: true })
    }
  },

  updatePrefs: async (patch) => {
    const { prefs } = get()
    const optimistic = normalizePrefs({ ...prefs, ...patch })
    set({ prefs: optimistic })

    try {
      const data = await apiFetch<{
        prefs: NotificationPrefs
        pushConfigured: boolean
      }>('/notifications/prefs', {
        method: 'PATCH',
        body: JSON.stringify({
          enabled: optimistic.enabled,
          time: optimistic.time,
          days: optimistic.days,
          onlyIfIncomplete: optimistic.onlyIfIncomplete,
          timezone: optimistic.timezone,
        }),
      })
      set({
        prefs: normalizePrefs(data.prefs),
        pushConfigured: data.pushConfigured,
      })
    } catch (error) {
      set({ prefs })
      throw error
    }
  },

  reset: () => {
    set({
      userId: null,
      prefs: { ...DEFAULT_NOTIFICATION_PREFS },
      loaded: false,
      pushConfigured: false,
    })
  },
}))

async function syncLegacy(legacy: NotificationPrefs): Promise<NotificationPrefs> {
  const data = await apiFetch<{ prefs: NotificationPrefs }>('/notifications/prefs', {
    method: 'PATCH',
    body: JSON.stringify({
      enabled: legacy.enabled,
      time: legacy.time,
      days: legacy.days,
      onlyIfIncomplete: legacy.onlyIfIncomplete,
      timezone: legacy.timezone || DEFAULT_NOTIFICATION_PREFS.timezone,
    }),
  })
  return normalizePrefs(data.prefs)
}
