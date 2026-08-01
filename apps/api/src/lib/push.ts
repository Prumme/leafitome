import webpush from 'web-push'
import { env } from '../env.js'

export function isPushConfigured(): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY)
}

let configured = false

export function configurePush(): void {
  if (!isPushConfigured()) {
    console.warn('VAPID non configuré — Web Push désactivé')
    return
  }
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)
  configured = true
}

export interface PushSubscriptionKeys {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionKeys,
  payload: { title: string; body: string; url?: string },
): Promise<'ok' | 'gone' | 'error'> {
  if (!configured) return 'error'

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? '/app',
      }),
    )
    return 'ok'
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) return 'gone'
    console.error('Push error', error)
    return 'error'
  }
}
