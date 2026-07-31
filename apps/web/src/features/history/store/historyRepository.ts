import type {
  CreateHistoryInput,
  HistoryEntry,
  UpdateHistoryInput,
} from '@/features/history/types/history.types'
import { apiFetch } from '@/shared/lib/api/client'
import type { Repository } from '@/shared/lib/storage/repository'

export class ApiHistoryRepository
  implements Repository<HistoryEntry, CreateHistoryInput, UpdateHistoryInput>
{
  async getAll(): Promise<HistoryEntry[]> {
    const data = await apiFetch<{ entries: HistoryEntry[] }>('/history')
    return data.entries
  }

  async getById(id: string): Promise<HistoryEntry | null> {
    const entries = await this.getAll()
    return entries.find((entry) => entry.id === id) ?? null
  }

  async create(input: CreateHistoryInput): Promise<HistoryEntry> {
    const data = await apiFetch<{ entry: HistoryEntry }>('/history', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return data.entry
  }

  async update(id: string, input: UpdateHistoryInput): Promise<HistoryEntry> {
    const data = await apiFetch<{ entry: HistoryEntry }>(`/history/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
    return data.entry
  }

  async delete(id: string): Promise<void> {
    await apiFetch(`/history/${id}`, { method: 'DELETE' })
  }

  async replaceAll(items: HistoryEntry[]): Promise<void> {
    await apiFetch('/history/replace', {
      method: 'PUT',
      body: JSON.stringify({ entries: items }),
    })
  }

  async findByTodoAndDate(todoId: string, date: string): Promise<HistoryEntry | null> {
    const entries = await this.getAll()
    return entries.find((entry) => entry.todoId === todoId && entry.date === date) ?? null
  }
}

export const historyRepository = new ApiHistoryRepository()
