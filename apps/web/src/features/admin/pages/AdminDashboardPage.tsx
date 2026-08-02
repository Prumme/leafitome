import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw, Shield } from 'lucide-react'
import { AdminUserDetailDialog } from '@/features/admin/components/AdminUserDetailDialog'
import {
  adminFetch,
  setAdminToken,
  type AdminUserRow,
} from '@/features/admin/lib/adminApi'
import { Button } from '@/shared/components/Button'
import { SITE } from '@/shared/config/site'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminUserRow | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await adminFetch<{ users: AdminUserRow[] }>('/users')
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function logout() {
    try {
      await adminFetch('/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setAdminToken(null)
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-forest-200 bg-surface-elevated">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">{SITE.name}</p>
              <h1 className="font-bold text-forest-950">Dashboard admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Rafraîchir
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" />
              Quitter
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <p className="mb-4 text-sm text-ink-muted">
          {users.length} compte{users.length > 1 ? 's' : ''} · session admin 2 h
        </p>

        {error ? <p className="mb-4 text-sm text-missed-700">{error}</p> : null}
        {loading ? <p className="text-sm text-ink-muted">Chargement…</p> : null}

        {!loading ? (
          <div className="overflow-x-auto rounded-2xl border border-forest-200 bg-surface-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-forest-100 bg-forest-50/80 text-xs uppercase tracking-wide text-forest-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pseudo</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Todos</th>
                  <th className="px-4 py-3 font-semibold">Créé le</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-forest-50 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-forest-950">
                      {user.displayName?.trim() || '—'}
                    </td>
                    <td className="px-4 py-3 text-forest-800">{user.email}</td>
                    <td className="px-4 py-3 tabular-nums text-forest-800">{user.todoCount}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="secondary" onClick={() => setSelected(user)}>
                        Voir todos
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                      Aucun compte.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </main>

      <AdminUserDetailDialog
        user={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
