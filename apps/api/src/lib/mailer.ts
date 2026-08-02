import { Resend } from 'resend'
import { env } from '../env.js'

let client: Resend | null = null

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null
  if (!client) client = new Resend(env.RESEND_API_KEY)
  return client
}

export function isMailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM)
}

export async function sendMail(input: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const resend = getClient()
  if (!resend) {
    console.warn('[mail] RESEND_API_KEY manquant — email non envoyé:', input.subject, '→', input.to)
    return { ok: false, error: 'Email non configuré (RESEND_API_KEY)' }
  }

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [input.to],
    subject: input.subject,
    html: input.html,
  })

  if (error) {
    console.error('[mail] Resend error', error)
    return { ok: false, error: error.message }
  }

  return { ok: true, id: data?.id }
}
