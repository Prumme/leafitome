import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { Leaf } from 'lucide-react'

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'bootstrapping') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-ink-muted">
        <Leaf className="h-8 w-8 animate-pulse text-forest-500" />
        <p>Vérification de la session…</p>
      </div>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function GuestRoute() {
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

  return <Outlet />
}

export function useAuthBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap)
  useEffect(() => {
    void bootstrap()
  }, [bootstrap])
}
