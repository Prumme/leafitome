import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuthStore, type AuthUser } from '@/features/auth/store/authStore'
import { apiFetch, setToken } from '@/shared/lib/api/client'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') ?? '', [params])
  const intent = params.get('intent')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Mot de passe : 8 caractères minimum')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const data = await apiFetch<{ user: AuthUser; token: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setToken(data.token)
      useAuthStore.setState({ user: data.user, status: 'authenticated', error: null })
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Réinitialisation impossible')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <p className="text-forest-900">Lien invalide ou incomplet.</p>
          <Link to="/forgot-password" className="text-sm font-medium text-forest-700 hover:underline">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

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
      <div className="relative w-full max-w-md space-y-6 rounded-3xl border border-forest-200/80 bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-600 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-forest-950">
            {intent === 'change' ? 'Nouveau mot de passe' : 'Réinitialiser le mot de passe'}
          </h1>
          <p className="text-sm text-ink-muted">Choisis une nouvelle clé pour ta clairière.</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <Input
            label="Nouveau mot de passe"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirmer"
            type="password"
            name="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error ? (
            <p className="rounded-lg bg-missed-50 px-3 py-2 text-sm text-missed-800" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      </div>
    </div>
  )
}
