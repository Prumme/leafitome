import { create } from 'zustand'
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/features/todos/types/todo.types'
import { todoRepository } from '@/features/todos/store/todoRepository'

interface TodoState {
  todos: Todo[]
  loaded: boolean
  load: () => Promise<void>
  createTodo: (input: CreateTodoInput) => Promise<Todo>
  updateTodo: (id: string, input: UpdateTodoInput) => Promise<Todo>
  deleteTodo: (id: string) => Promise<void>
  archiveTodo: (id: string) => Promise<Todo>
  toggleEnabled: (id: string) => Promise<Todo>
  replaceAll: (todos: Todo[]) => Promise<void>
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loaded: false,

  load: async () => {
    const todos = await todoRepository.getAll()
    set({ todos, loaded: true })
  },

  createTodo: async (input) => {
    const todo = await todoRepository.create(input)
    set({ todos: [...get().todos, todo] })
    return todo
  },

  updateTodo: async (id, input) => {
    const updated = await todoRepository.update(id, input)
    set({
      todos: get().todos.map((todo) => (todo.id === id ? updated : todo)),
    })
    return updated
  },

  deleteTodo: async (id) => {
    await todoRepository.delete(id)
    set({ todos: get().todos.filter((todo) => todo.id !== id) })
  },

  archiveTodo: async (id) => {
    return get().updateTodo(id, { archived: true, enabled: false })
  },

  toggleEnabled: async (id) => {
    const current = get().todos.find((todo) => todo.id === id)
    if (!current) throw new Error(`Todo introuvable: ${id}`)
    return get().updateTodo(id, { enabled: !current.enabled })
  },

  replaceAll: async (todos) => {
    await todoRepository.replaceAll(todos)
    set({ todos, loaded: true })
  },
}))
