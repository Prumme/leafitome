export type NotificationPermissionState = NotificationPermission | 'unsupported'

export function getNotificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!getNotificationSupport()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!getNotificationSupport()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export async function showAppNotification(title: string, body: string): Promise<boolean> {
  if (!getNotificationSupport() || Notification.permission !== 'granted') {
    return false
  }

  const options: NotificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'leafitome-daily-reminder',
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, options)
      return true
    }
  } catch {
    // Fallback page Notification
  }

  try {
    const notification = new Notification(title, options)
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    return true
  } catch {
    return false
  }
}
