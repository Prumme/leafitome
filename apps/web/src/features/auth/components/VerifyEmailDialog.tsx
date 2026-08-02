import { useEffect, useState } from 'react'
import { Leaf, Mail } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { apiFetch } from '@/shared/lib/api/client'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'

const DISMISS_KEY = 'leafitome_verify_email_dismissed'

function wasDismissedFor(userId: string): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === userId
  } catch {
    return false
  }
}

function dismissFor(userId: string) {
  try {
    sessionStorage.setItem(DISMISS_KEY, userId)
  } catch {
    // ignore
  }
}

export function VerifyEmailDialog() {
  const user = useAuthStore((state) => state.user)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.emailVerified) {
      setOpen(false)
      return
    }
    if (wasDismissedFor(user.id)) {
      setOpen(false)
      return
    }
    setOpen(true)
  }, [user])

  function handleClose() {
    if (user) dismissFor(user.id)
    setOpen(false)
  }

  async function handleSend() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const data = await apiFetch<{ ok: true; alreadyVerified: boolean }>(
        '/auth/verify-email/send',
        { method: 'POST' },
      )
      if (data.alreadyVerified) {
        await useAuthStore.getState().bootstrap()
        setOpen(false)
        return
      }
      setMessage('Email envoyé — jette un œil à ta boîte (et aux indésirables).')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible')
    } finally {
      setBusy(false)
    }
  }

  if (!user || user.emailVerified) return null

  return (
    <Modal open={open} title="Valide ton email" onClose={handleClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-sm text-forest-900">
            <p>
              Pour bien enraciner ton compte, confirme{' '}
              <span className="font-medium">{user.email}</span>.
            </p>
            <p className="text-ink-muted">
              Tu peux fermer cette fenêtre et continuer — on te rappellera plus tard.
            </p>
          </div>
        </div>

        {message ? <p className="text-sm text-done-700">{message}</p> : null}
        {error ? <p className="text-sm text-missed-700">{error}</p> : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Plus tard
          </Button>
          <Button type="button" onClick={() => void handleSend()} disabled={busy}>
            <Mail className="h-4 w-4" />
            {busy ? 'Envoi…' : 'Envoyer le mail de validation'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
