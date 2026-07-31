import { useMemo } from 'react'
import { useTodoStore } from '@/features/todos/store/todoStore'
import type { Todo } from '@/features/todos/types/todo.types'
import { sortTodosByPriority } from '@/features/todos/utils/recurrence'

export function useTodos(options?: { includeArchived?: boolean }): {
  todos: Todo[]
  activeTodos: Todo[]
  archivedTodos: Todo[]
  loaded: boolean
} {
  const todos = useTodoStore((state) => state.todos)
  const loaded = useTodoStore((state) => state.loaded)
  const includeArchived = options?.includeArchived ?? false

  const activeTodos = useMemo(
    () => sortTodosByPriority(todos.filter((todo) => !todo.archived)),
    [todos],
  )

  const archivedTodos = useMemo(
    () => sortTodosByPriority(todos.filter((todo) => todo.archived)),
    [todos],
  )

  const visible = includeArchived ? sortTodosByPriority(todos) : activeTodos

  return { todos: visible, activeTodos, archivedTodos, loaded }
}
