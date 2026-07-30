import type {
  CreateHistoryInput,
  HistoryEntry,
  UpdateHistoryInput,
} from '@/features/history/types/history.types'
import {
  localStorageAdapter,
  readJson,
  writeJson,
  type StorageAdapter,
} from '@/shared/lib/storage/adapter'
import type { Repository } from '@/shared/lib/storage/repository'
import { createId } from '@/shared/utils/id'

const STORAGE_KEY = 'todo-prumme:history'

export class LocalHistoryRepository
  implements Repository<HistoryEntry, CreateHistoryInput, UpdateHistoryInput>
{
  private readonly adapter: StorageAdapter

  constructor(adapter: StorageAdapter = localStorageAdapter) {
    this.adapter = adapter
  }

  async getAll(): Promise<HistoryEntry[]> {
    return readJson<HistoryEntry[]>(this.adapter, STORAGE_KEY, [])
  }

  async getById(id: string): Promise<HistoryEntry | null> {
    const entries = await this.getAll()
    return entries.find((entry) => entry.id === id) ?? null
  }

  async create(input: CreateHistoryInput): Promise<HistoryEntry> {
    const entry: HistoryEntry = {
      ...input,
      id: createId('hist'),
      createdAt: new Date().toISOString(),
    }
    const entries = await this.getAll()
    writeJson(this.adapter, STORAGE_KEY, [...entries, entry])
    return entry
  }

  async update(id: string, input: UpdateHistoryInput): Promise<HistoryEntry> {
    const entries = await this.getAll()
    const index = entries.findIndex((entry) => entry.id === id)
    const current = entries[index]
    if (index === -1 || !current) {
      throw new Error(`History introuvable: ${id}`)
    }
    const updated: HistoryEntry = {
      id: current.id,
      todoId: current.todoId,
      date: current.date,
      status: input.status ?? current.status,
      createdAt: current.createdAt,
    }
    const next = [...entries]
    next[index] = updated
    writeJson(this.adapter, STORAGE_KEY, next)
    return updated
  }

  async delete(id: string): Promise<void> {
    const entries = await this.getAll()
    writeJson(
      this.adapter,
      STORAGE_KEY,
      entries.filter((entry) => entry.id !== id),
    )
  }

  async replaceAll(items: HistoryEntry[]): Promise<void> {
    writeJson(this.adapter, STORAGE_KEY, items)
  }

  async findByTodoAndDate(todoId: string, date: string): Promise<HistoryEntry | null> {
    const entries = await this.getAll()
    return entries.find((entry) => entry.todoId === todoId && entry.date === date) ?? null
  }
}

export const historyRepository = new LocalHistoryRepository()
