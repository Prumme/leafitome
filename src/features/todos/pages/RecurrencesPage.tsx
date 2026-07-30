import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TodoForm } from '@/features/todos/components/TodoForm'
import { TodoManageCard } from '@/features/todos/components/TodoManageCard'
import { useTodos } from '@/features/todos/hooks/useTodos'
import { useTodoStore } from '@/features/todos/store/todoStore'
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/features/todos/types/todo.types'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { Modal } from '@/shared/components/Modal'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDisclosure } from '@/shared/hooks/useDisclosure'

export function RecurrencesPage() {
  const { activeTodos, loaded } = useTodos()
  const createTodo = useTodoStore((state) => state.createTodo)
  const updateTodo = useTodoStore((state) => state.updateTodo)
  const archiveTodo = useTodoStore((state) => state.archiveTodo)
  const toggleEnabled = useTodoStore((state) => state.toggleEnabled)

  const createModal = useDisclosure()
  const editModal = useDisclosure()
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

  if (!loaded) {
    return <p className="text-ink-muted">Chargement des récurrences…</p>
  }

  return (
    <div>
      <PageHeader
        title="Récurrences"
        subtitle="Gère tes todos et leur rythme de répétition."
        actions={
          <Button onClick={createModal.open}>
            <Plus className="h-4 w-4" />
            Nouvelle récurrence
          </Button>
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
        <div className="space-y-2">
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
    </div>
  )
}
