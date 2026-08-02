import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { adminFetch, getAdminToken, setAdminToken } from '@/features/admin/lib/adminApi'

export function AdminGate() {
  const location = useLocation()
  const [status, setStatus] = useState<'loading' | 'ok' | 'anon'>('loading')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await adminFetch('/me')
        if (!cancelled) setStatus('ok')
      } catch {
        setAdminToken(null)
        if (!cancelled) setStatus('anon')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-ink-muted">
        <Shield className="h-8 w-8 animate-pulse text-forest-600" />
        <p>Vérification admin…</p>
      </div>
    )
  }

  if (status === 'anon' && !getAdminToken()) {
    return <Navigate to="/admin/login" replace />
  }

  if (status === 'anon') {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
