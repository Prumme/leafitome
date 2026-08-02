import { createHash, timingSafeEqual } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env.js'

const encoder = new TextEncoder()
const secret = encoder.encode(env.JWT_SECRET)
export const ADMIN_COOKIE = 'leafitome_admin'
export const ADMIN_SESSION_HOURS = 2

export function isAdminPasswordConfigured(): boolean {
  return Boolean(env.ADMIN_PASSWORD)
}

export function verifyAdminPassword(input: string): boolean {
  if (!env.ADMIN_PASSWORD) return false
  const a = createHash('sha256').update(input).digest()
  const b = createHash('sha256').update(env.ADMIN_PASSWORD).digest()
  return timingSafeEqual(a, b)
}

export async function signAdminSession(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin')
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_HOURS}h`)
    .sign(secret)
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.sub === 'admin' && payload.role === 'admin'
  } catch {
    return false
  }
}
