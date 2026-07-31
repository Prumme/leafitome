import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env.js'

const encoder = new TextEncoder()
const secret = encoder.encode(env.JWT_SECRET)

export interface SessionPayload {
  sub: string
  email: string
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secret)
  if (!payload.sub || typeof payload.email !== 'string') {
    throw new Error('Session invalide')
  }
  return { sub: payload.sub, email: payload.email }
}
