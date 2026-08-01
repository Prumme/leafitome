/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

try {
  const handler = createHandlerBoundToURL('/index.html')
  registerRoute(
    new NavigationRoute(handler, {
      denylist: [/^\/api\//, /^\/[^/?]+\.[^/]+$/],
    }),
  )
} catch {
  // Precache pas encore prêt au premier build
}

self.addEventListener('push', (event) => {
  let title = 'Leafitome'
  let body = 'Un petit rappel de ta clairière.'
  let url = '/app'

  if (event.data) {
    try {
      const payload = event.data.json() as { title?: string; body?: string; url?: string }
      title = payload.title ?? title
      body = payload.body ?? body
      url = payload.url ?? url
    } catch {
      body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'leafitome-daily-reminder',
      data: { url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data?.url as string | undefined) ?? '/app'
  const absolute = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if ('focus' in client) {
          await client.focus()
          if ('navigate' in client) {
            await (client as WindowClient).navigate(absolute)
          }
          return
        }
      }
      await self.clients.openWindow(absolute)
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})
