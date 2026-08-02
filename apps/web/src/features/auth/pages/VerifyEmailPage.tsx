import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuthStore, type AuthUser } from '@/features/auth/store/authStore'
import { apiFetch } from '@/shared/lib/api/client'
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') ?? '', [params])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Lien invalide ou incomplet.')
      return
    }

    let cancelled = false
    void apiFetch<{ ok: true; user: AuthUser }>('/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(async (data) => {
        if (cancelled) return
        const current = useAuthStore.getState().user
        if (current?.id === data.user.id) {
          useAuthStore.setState({ user: data.user })
        } else {
          await useAuthStore.getState().bootstrap()
        }
        setStatus('ok')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Validation impossible')
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 10% 0%, rgb(109 165 127 / 0.35), transparent),' +
            'radial-gradient(ellipse 60% 40% at 90% 100%, rgb(61 109 76 / 0.2), transparent),' +
            'linear-gradient(180deg, #eef5f0 0%, #f7faf8 50%, #e8f0ea 100%)',
        }}
      />
      <div className="relative w-full max-w-md space-y-5 rounded-3xl border border-forest-200/80 bg-white/90 p-6 text-center shadow-soft backdrop-blur sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-600 text-white">
          <Leaf className="h-6 w-6" />
        </div>
        {status === 'loading' ? (
          <p className="text-forest-900">Validation de ton email…</p>
        ) : null}
        {status === 'ok' ? (
          <>
            <h1 className="font-display text-2xl font-bold text-forest-950">Email confirmé</h1>
            <p className="text-sm text-ink-muted">
              Ta feuille est plantée — ton compte est bien enraciné.
            </p>
            <Link
              to="/app"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-soft hover:bg-primary-hover"
            >
              Retour à l’app
            </Link>
          </>
        ) : null}
        {status === 'error' ? (
          <>
            <h1 className="font-display text-2xl font-bold text-forest-950">Lien invalide</h1>
            <p className="text-sm text-missed-700">{error}</p>
            <Link
              to="/app"
              className="inline-flex w-full items-center justify-center rounded-lg border border-forest-200 bg-surface-elevated px-3.5 py-2 text-sm font-medium text-forest-800 hover:bg-forest-100"
            >
              Ouvrir l’app
            </Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
