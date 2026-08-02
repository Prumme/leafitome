import { useState } from 'react'
import { Download, Plus, Upload } from 'lucide-react'
import { useBadgeStore } from '@/features/badges/store/badgeStore'
import { ImportBackupDialog } from '@/features/todos/components/ImportBackupDialog'
import { TodoForm } from '@/features/todos/components/TodoForm'
import { TodoManageCard } from '@/features/todos/components/TodoManageCard'
import { useTodos } from '@/features/todos/hooks/useTodos'
import { useHistoryStore } from '@/features/history/store/historyStore'
import { useTodoStore } from '@/features/todos/store/todoStore'
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/features/todos/types/todo.types'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { Modal } from '@/shared/components/Modal'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDisclosure } from '@/shared/hooks/useDisclosure'
import { buildBackup, downloadBackup } from '@/shared/lib/backup/backup'

export function RecurrencesPage() {
  const { activeTodos, loaded } = useTodos()
  const todos = useTodoStore((state) => state.todos)
  const createTodo = useTodoStore((state) => state.createTodo)
  const updateTodo = useTodoStore((state) => state.updateTodo)
  const archiveTodo = useTodoStore((state) => state.archiveTodo)
  const toggleEnabled = useTodoStore((state) => state.toggleEnabled)
  const history = useHistoryStore((state) => state.entries)
  const badges = useBadgeStore((state) => state.progress)
  const markTraveled = useBadgeStore((state) => state.markTraveled)

  const createModal = useDisclosure()
  const editModal = useDisclosure()
  const importModal = useDisclosure()
  const [editing, setEditing] = useState<Todo | null>(null)

  function openEdit(todo: Todo) {
    setEditing(todo)
    editModal.open()
  }

  function closeEdit() {
    editModal.close()
    setEditing(null)
  }

  async function handleCreate(data: CreateTodoInput | UpdateTodoInput) {
    await createTodo(data as CreateTodoInput)
    createModal.close()
  }

  async function handleUpdate(data: CreateTodoInput | UpdateTodoInput) {
    if (!editing) return
    await updateTodo(editing.id, data)
    closeEdit()
  }

  async function handleExport() {
    const next = { ...badges, hasTraveled: true }
    // Backup : uniquement les todos dont on est créateur (pas les joined)
    const owned = todos.filter((todo) => todo.isOwner !== false && todo.membershipRole !== 'MEMBER')
    const ownedIds = new Set(owned.map((todo) => todo.id))
    const ownedHistory = history.filter((entry) => ownedIds.has(entry.todoId))
    downloadBackup(buildBackup(owned, ownedHistory, next))
    await markTraveled()
  }

  if (!loaded) {
    return <p className="text-ink-muted">Chargement des récurrences…</p>
  }

  return (
    <div>
      <PageHeader
        title="Récurrences"
        subtitle="Gère tes todos et leur rythme de répétition."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleExport()}
              aria-label="Exporter les données"
              title="Exporter les données"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={importModal.open}
              aria-label="Importer des données"
              title="Importer des données"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button onClick={createModal.open}>
              <Plus className="h-4 w-4" />
              Nouvelle récurrence
            </Button>
          </>
        }
      />

      {activeTodos.length === 0 ? (
        <EmptyState
          title="Aucune récurrence"
          description="Définis des tâches quotidiennes, hebdomadaires ou mensuelles pour planter ta routine."
          action={
            <Button onClick={createModal.open}>
              <Plus className="h-4 w-4" />
              Créer une todo
            </Button>
          }
        />
      ) : (
        <div>
          {activeTodos.map((todo) => (
            <TodoManageCard
              key={todo.id}
              todo={todo}
              onEdit={openEdit}
              onToggleEnabled={(item) => void toggleEnabled(item.id)}
              onArchive={(item) => void archiveTodo(item.id)}
            />
          ))}
        </div>
      )}

      <Modal open={createModal.isOpen} title="Nouvelle récurrence" onClose={createModal.close}>
        <TodoForm onSubmit={handleCreate} onCancel={createModal.close} submitLabel="Créer" />
      </Modal>

      <Modal open={editModal.isOpen && editing !== null} title="Modifier la todo" onClose={closeEdit}>
        {editing ? (
          <TodoForm
            key={editing.id}
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={closeEdit}
            submitLabel="Mettre à jour"
          />
        ) : null}
      </Modal>

      <ImportBackupDialog open={importModal.isOpen} onClose={importModal.close} />
    </div>
  )
}
