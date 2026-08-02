import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { apiFetch } from '@/shared/lib/api/client'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { SITE } from '@/shared/config/site'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const data = await apiFetch<{ ok: true; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setMessage(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demande impossible')
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
            Mot de passe oublié
          </h1>
          <p className="text-sm text-ink-muted">
            On te renvoie un sentier vers {SITE.name}.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {message ? (
            <p className="rounded-lg bg-done-50 px-3 py-2 text-sm text-done-800" role="status">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-missed-50 px-3 py-2 text-sm text-missed-800" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Envoi…' : 'Envoyer le lien'}
          </Button>
        </form>

        <p className="text-center text-sm">
          <Link to="/login" className="font-medium text-forest-700 hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
