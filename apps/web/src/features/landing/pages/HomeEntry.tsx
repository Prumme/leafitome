import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { Leaf } from 'lucide-react'

/**
 * `/` : landing publique, ou redirection vers les todos si session active.
 */
export function HomeEntry() {
  const status = useAuthStore((state) => state.status)

  if (status === 'bootstrapping') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-ink-muted">
        <Leaf className="h-8 w-8 animate-pulse text-forest-500" />
        <p>Chargement…</p>
      </div>
    )
  }

  if (status === 'authenticated') {
    return <Navigate to="/app" replace />
  }

  return <LandingPage />
}
