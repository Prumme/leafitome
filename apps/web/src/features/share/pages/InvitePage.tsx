import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Leaf, Users } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { RECURRENCE_LABELS } from '@/features/todos/utils/recurrence'
import type { Recurrence } from '@/features/todos/types/todo.types'
import { useHistoryStore } from '@/features/history/store/historyStore'
import { useTodoStore } from '@/features/todos/store/todoStore'
import { apiFetch, ApiError } from '@/shared/lib/api/client'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { SITE } from '@/shared/config/site'

interface SharePreview {
  id: string
  name: string
  description?: string
  recurrence: Recurrence
  ownerDisplayName: string
  alreadyMember: boolean
  membershipRole: 'OWNER' | 'MEMBER' | null
}

export function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const status = useAuthStore((state) => state.status)
  const [preview, setPreview] = useState<SharePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'bootstrapping') return
    if (status !== 'authenticated') {
      navigate('/login', { replace: true, state: { from: `/invite/${token}` } })
      return
    }
    if (!token) {
      setError('Lien invalide')
      setLoading(false)
      return
    }

    void (async () => {
      try {
        const data = await apiFetch<{ todo: SharePreview }>(`/share/${token}`)
        setPreview(data.todo)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Invitation introuvable')
      } finally {
        setLoading(false)
      }
    })()
  }, [status, token, navigate])

  async function join() {
    if (!token) return
    setBusy(true)
    setError(null)
    try {
      await apiFetch(`/share/${token}/join`, { method: 'POST' })
      await useTodoStore.getState().load()
      await useHistoryStore.getState().load()
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de rejoindre')
    } finally {
      setBusy(false)
    }
  }

  async function decline() {
    if (!token) return
    setBusy(true)
    setError(null)
    try {
      await apiFetch(`/share/${token}/decline`, { method: 'POST' })
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de refuser')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'bootstrapping' || loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-ink-muted">
        <Leaf className="h-8 w-8 animate-pulse text-forest-500" />
        <p>Chargement de l’invitation…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-600 text-white">
          <Leaf className="h-5 w-5" />
        </div>
        <span className="font-bold text-forest-950">{SITE.name}</span>
      </div>

      <Card className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-2 text-forest-900">
          <Users className="h-5 w-5 text-forest-600" />
          <h1 className="text-xl font-semibold">Todo partagée</h1>
        </div>

        {error ? <p className="text-sm text-missed-700">{error}</p> : null}

        {preview ? (
          <>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-forest-950">{preview.name}</p>
              {preview.description ? (
                <p className="text-sm text-ink-muted">{preview.description}</p>
              ) : null}
              <p className="text-sm text-forest-800">
                {RECURRENCE_LABELS[preview.recurrence]} · proposée par{' '}
                <span className="font-medium">{preview.ownerDisplayName}</span>
              </p>
            </div>

            {preview.alreadyMember ? (
              <div className="space-y-3">
                <p className="text-sm text-done-700">Tu fais déjà partie de cette todo.</p>
                <Button className="w-full" onClick={() => navigate('/app')}>
                  Voir mes tâches
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={busy} onClick={() => void join()}>
                  Rejoindre
                </Button>
                <Button
                  className="flex-1"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void decline()}
                >
                  Refuser
                </Button>
              </div>
            )}
          </>
        ) : null}

        <p className="text-center text-xs text-ink-muted">
          <Link to="/app" className="underline hover:text-forest-800">
            Retour à l’app
          </Link>
        </p>
      </Card>
    </div>
  )
}
