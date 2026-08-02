import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile() {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env'),
  ]
  for (const file of candidates) {
    if (!existsSync(file)) continue
    const content = readFileSync(file, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!(key in process.env)) process.env[key] = value
    }
  }
}

loadEnvFile()

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Variable d'environnement manquante: ${name}`)
  return value
}

export const env = {
  DATABASE_URL: required('DATABASE_URL', 'postgres://leafitome:leafitome@localhost:5433/leafitome'),
  PORT: Number(process.env.PORT ?? 3001),
  JWT_SECRET: required('JWT_SECRET', 'dev-leafitome-change-me-in-production'),
  CORS_ORIGIN: required('CORS_ORIGIN', 'http://localhost:5173'),
  COOKIE_SECURE:
    process.env.COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ?? '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ?? '',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT ?? 'mailto:hello@leafitome.local',
  /** Mot de passe du dashboard /admin (vide = admin désactivé) */
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? '',
}
