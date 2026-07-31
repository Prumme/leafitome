import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/features/todos/types/todo.types'
import { apiFetch } from '@/shared/lib/api/client'
import type { Repository } from '@/shared/lib/storage/repository'

export class ApiTodoRepository
  implements Repository<Todo, CreateTodoInput, UpdateTodoInput>
{
  async getAll(): Promise<Todo[]> {
    const data = await apiFetch<{ todos: Todo[] }>('/todos')
    return data.todos
  }

  async getById(id: string): Promise<Todo | null> {
    const todos = await this.getAll()
    return todos.find((todo) => todo.id === id) ?? null
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const data = await apiFetch<{ todo: Todo }>('/todos', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return data.todo
  }

  async update(id: string, input: UpdateTodoInput): Promise<Todo> {
    const data = await apiFetch<{ todo: Todo }>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
    return data.todo
  }

  async delete(id: string): Promise<void> {
    await apiFetch(`/todos/${id}`, { method: 'DELETE' })
  }

  async replaceAll(items: Todo[]): Promise<void> {
    await apiFetch('/todos/replace', {
      method: 'PUT',
      body: JSON.stringify({ todos: items }),
    })
  }
}

export const todoRepository = new ApiTodoRepository()
