import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { adminFetch, setAdminToken } from '@/features/admin/lib/adminApi'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { SITE } from '@/shared/config/site'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await adminFetch<{ token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      setAdminToken(data.token)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accès refusé')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm space-y-6 rounded-3xl border border-forest-200 bg-surface-elevated p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">{SITE.name}</p>
            <h1 className="text-xl font-bold text-forest-950">Admin</h1>
          </div>
        </div>

        <p className="text-sm text-ink-muted">
          Accès réservé. Session valable 2 heures après connexion.
        </p>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <Input
            label="Mot de passe admin"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <p className="text-sm text-missed-700">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy || !password}>
            {busy ? 'Vérification…' : 'Entrer'}
          </Button>
        </form>

        <p className="text-center text-xs text-ink-muted">
          <Link to="/" className="underline hover:text-forest-800">
            Retour au site
          </Link>
        </p>
      </div>
    </div>
  )
}
