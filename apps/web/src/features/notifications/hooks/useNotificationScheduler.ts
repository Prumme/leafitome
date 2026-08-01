import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useNotificationPrefsStore } from '@/features/notifications/store/notificationPrefsStore'
import { getNotificationPermission } from '@/features/notifications/utils/permission'
import { ensurePushSubscription } from '@/features/notifications/utils/pushSubscribe'

/**
 * Charge les prefs serveur et renouvelle l’abonnement Web Push
 * (les envois se font côté API, même app fermée).
 */
export function useNotificationScheduler(ready: boolean) {
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const loadForUser = useNotificationPrefsStore((state) => state.loadForUser)
  const reset = useNotificationPrefsStore((state) => state.reset)
  const prefs = useNotificationPrefsStore((state) => state.prefs)
  const loaded = useNotificationPrefsStore((state) => state.loaded)
  const pushConfigured = useNotificationPrefsStore((state) => state.pushConfigured)

  useEffect(() => {
    if (!userId) {
      reset()
      return
    }
    void loadForUser(userId)
  }, [userId, loadForUser, reset])

  useEffect(() => {
    if (!ready || !loaded || !userId || !prefs.enabled || !pushConfigured) return
    if (getNotificationPermission() !== 'granted') return

    void ensurePushSubscription().catch((error) => {
      console.warn('Abonnement push impossible', error)
    })
  }, [ready, loaded, userId, prefs.enabled, pushConfigured])
}
