import { useEffect, useState } from 'react'
import {
  adminFetch,
  type AdminTodoRow,
  type AdminUserRow,
} from '@/features/admin/lib/adminApi'
import { RECURRENCE_LABELS } from '@/features/todos/utils/recurrence'
import type { Recurrence } from '@/features/todos/types/todo.types'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Badge } from '@/shared/components/Badge'

interface AdminUserDetailDialogProps {
  user: AdminUserRow | null
  open: boolean
  onClose: () => void
}

export function AdminUserDetailDialog({ user, open, onClose }: AdminUserDetailDialogProps) {
  const [todos, setTodos] = useState<AdminTodoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    setError(null)
    void adminFetch<{ todos: AdminTodoRow[] }>(`/users/${user.id}`)
      .then((data) => setTodos(data.todos))
      .catch((err) => setError(err instanceof Error ? err.message : 'Chargement impossible'))
      .finally(() => setLoading(false))
  }, [open, user])

  async function patchTodo(id: string, patch: { enabled?: boolean; archived?: boolean }) {
    setBusyId(id)
    try {
      const data = await adminFetch<{ todo: AdminTodoRow }>(`/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setTodos((prev) => prev.map((todo) => (todo.id === id ? data.todo : todo)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Modal
      open={open && Boolean(user)}
      title={user ? `Todos de ${user.displayName || user.email}` : 'Todos'}
      onClose={onClose}
    >
      <div className="space-y-3">
        {user ? (
          <p className="text-sm text-ink-muted">
            {user.email} · {user.todoCount} todo{user.todoCount > 1 ? 's' : ''}
          </p>
        ) : null}

        {error ? <p className="text-sm text-missed-700">{error}</p> : null}
        {loading ? <p className="text-sm text-ink-muted">Chargement…</p> : null}

        {!loading && todos.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucune todo pour cet utilisateur.</p>
        ) : null}

        <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="rounded-xl border border-forest-100 bg-forest-50/40 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-forest-950">{todo.name}</p>
                  {todo.description ? (
                    <p className="line-clamp-2 text-xs text-ink-muted">{todo.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    <Badge tone="forest">
                      {RECURRENCE_LABELS[todo.recurrence as Recurrence] ?? todo.recurrence}
                    </Badge>
                    {todo.shared ? <Badge tone="moss">Partagée ({todo.memberCount})</Badge> : null}
                    {!todo.enabled ? <Badge tone="neutral">Désactivée</Badge> : null}
                    {todo.archived ? <Badge tone="missed">Archivée</Badge> : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === todo.id}
                    onClick={() => void patchTodo(todo.id, { enabled: !todo.enabled })}
                  >
                    {todo.enabled ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === todo.id}
                    onClick={() => void patchTodo(todo.id, { archived: !todo.archived })}
                  >
                    {todo.archived ? 'Désarchiver' : 'Archiver'}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
