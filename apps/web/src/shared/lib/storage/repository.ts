import type { Identifiable } from '@/shared/types/common.types'

/**
 * Contrat repository générique — même surface pour LocalStorage et future API HTTP.
 */
export interface Repository<T extends Identifiable, TCreate, TUpdate> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  create(input: TCreate): Promise<T>
  update(id: string, input: TUpdate): Promise<T>
  delete(id: string): Promise<void>
  replaceAll(items: T[]): Promise<void>
}
