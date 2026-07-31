import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { SITE } from '@/shared/config/site'

export function RegisterPage() {
  const register = useAuthStore((state) => state.register)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    clearError()
    setBusy(true)
    try {
      await register({
        email,
        password,
        displayName: displayName.trim() || undefined,
      })
      navigate('/app', { replace: true })
    } catch {
      // error in store
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 90% 0%, rgb(132 192 101 / 0.3), transparent),' +
            'radial-gradient(ellipse 60% 40% at 10% 100%, rgb(61 109 76 / 0.18), transparent),' +
            'linear-gradient(180deg, #eef5f0 0%, #f7faf8 55%, #e8f0ea 100%)',
        }}
      />
      <div className="relative w-full max-w-md space-y-6 rounded-3xl border border-forest-200/80 bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-600 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-forest-950">Créer un compte</h1>
          <p className="text-sm text-ink-muted">
            Plante ta première graine sur {SITE.name} — gratuit pour le moment.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <Input
            label="Prénom / pseudo (optionnel)"
            name="displayName"
            autoComplete="nickname"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Mot de passe"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-bark-500">8 caractères minimum. La vérification email arrivera bientôt.</p>
          {error ? (
            <p className="rounded-lg bg-missed-50 px-3 py-2 text-sm text-missed-800" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Création…' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-muted">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-forest-700 hover:underline">
            Se connecter
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link to="/" className="text-bark-500 hover:text-forest-700">
            ← Retour à l’accueil
          </Link>
        </p>
      </div>
    </div>
  )
}
