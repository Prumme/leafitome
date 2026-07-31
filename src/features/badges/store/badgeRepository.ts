import type { BadgeProgress } from '@/features/badges/types/badge.types'
import { EMPTY_BADGE_PROGRESS } from '@/features/badges/types/badge.types'
import {
  localStorageAdapter,
  readJson,
  writeJson,
  type StorageAdapter,
} from '@/shared/lib/storage/adapter'

const STORAGE_KEY = 'todo-prumme:badges'

export class LocalBadgeRepository {
  private readonly adapter: StorageAdapter

  constructor(adapter: StorageAdapter = localStorageAdapter) {
    this.adapter = adapter
  }

  async get(): Promise<BadgeProgress> {
    const data = readJson<BadgeProgress>(this.adapter, STORAGE_KEY, EMPTY_BADGE_PROGRESS)
    return {
      unlocked: data.unlocked ?? {},
      hasTraveled: Boolean(data.hasTraveled),
    }
  }

  async save(progress: BadgeProgress): Promise<void> {
    writeJson(this.adapter, STORAGE_KEY, progress)
  }
}

export const badgeRepository = new LocalBadgeRepository()
