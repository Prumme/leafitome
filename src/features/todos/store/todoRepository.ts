import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/features/todos/types/todo.types'
import {
  localStorageAdapter,
  readJson,
  writeJson,
  type StorageAdapter,
} from '@/shared/lib/storage/adapter'
import type { Repository } from '@/shared/lib/storage/repository'
import { createId } from '@/shared/utils/id'

const STORAGE_KEY = 'todo-prumme:todos'

export class LocalTodoRepository
  implements Repository<Todo, CreateTodoInput, UpdateTodoInput>
{
  private readonly adapter: StorageAdapter

  constructor(adapter: StorageAdapter = localStorageAdapter) {
    this.adapter = adapter
  }

  async getAll(): Promise<Todo[]> {
    return readJson<Todo[]>(this.adapter, STORAGE_KEY, [])
  }

  async getById(id: string): Promise<Todo | null> {
    const todos = await this.getAll()
    return todos.find((todo) => todo.id === id) ?? null
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const now = new Date().toISOString()
    const todo: Todo = {
      ...input,
      id: createId('todo'),
      archived: input.archived ?? false,
      createdAt: now,
      updatedAt: now,
    }
    const todos = await this.getAll()
    writeJson(this.adapter, STORAGE_KEY, [...todos, todo])
    return todo
  }

  async update(id: string, input: UpdateTodoInput): Promise<Todo> {
    const todos = await this.getAll()
    const index = todos.findIndex((todo) => todo.id === id)
    const current = todos[index]
    if (index === -1 || !current) {
      throw new Error(`Todo introuvable: ${id}`)
    }
    const updated: Todo = {
      id: current.id,
      name: input.name ?? current.name,
      description: input.description !== undefined ? input.description : current.description,
      recurrence: input.recurrence ?? current.recurrence,
      days: input.days !== undefined ? input.days : current.days,
      dayOfMonth: input.dayOfMonth !== undefined ? input.dayOfMonth : current.dayOfMonth,
      earlyCompletable:
        input.earlyCompletable !== undefined
          ? input.earlyCompletable
          : current.earlyCompletable,
      priority: input.priority ?? current.priority,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      enabled: input.enabled ?? current.enabled,
      color: input.color !== undefined ? input.color : current.color,
      archived: input.archived ?? current.archived,
    }
    const next = [...todos]
    next[index] = updated
    writeJson(this.adapter, STORAGE_KEY, next)
    return updated
  }

  async delete(id: string): Promise<void> {
    const todos = await this.getAll()
    writeJson(
      this.adapter,
      STORAGE_KEY,
      todos.filter((todo) => todo.id !== id),
    )
  }

  async replaceAll(items: Todo[]): Promise<void> {
    writeJson(this.adapter, STORAGE_KEY, items)
  }
}

export const todoRepository = new LocalTodoRepository()
