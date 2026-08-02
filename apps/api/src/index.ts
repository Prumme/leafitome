import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { migrate } from './db/migrate.js'
import { sql } from './db/client.js'
import { env } from './env.js'
import { configurePush } from './lib/push.js'
import { startReminderScheduler } from './lib/reminderJob.js'
import { authRoutes } from './routes/auth.js'
import { badgeRoutes } from './routes/badges.js'
import { historyRoutes } from './routes/history.js'
import { messageRoutes } from './routes/messages.js'
import { notificationRoutes } from './routes/notifications.js'
import { shareRoutes } from './routes/share.js'
import { todoRoutes } from './routes/todos.js'
import { registerWsRoute } from './routes/ws.js'

const app = new Hono()
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

app.use(
  '*',
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/health', (c) => c.json({ ok: true, service: 'leafitome-api' }))

app.route('/auth', authRoutes)
app.route('/todos', todoRoutes)
app.route('/history', historyRoutes)
app.route('/badges', badgeRoutes)
app.route('/notifications', notificationRoutes)
app.route('/share', shareRoutes)
app.route('/messages', messageRoutes)
registerWsRoute(app, upgradeWebSocket)

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Validation',
        details: err.issues.map((issue) => issue.message),
      },
      400,
    )
  }
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: 'Erreur serveur' }, 500)
})

async function main() {
  await migrate(sql)
  console.log('Database ready')
  configurePush()
  startReminderScheduler()

  const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    console.log(`API Leafitome sur http://localhost:${info.port}`)
  })
  injectWebSocket(server)
}

main().catch((error) => {
  console.error('Impossible de démarrer l’API', error)
  process.exit(1)
})
