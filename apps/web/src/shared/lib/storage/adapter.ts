/**
 * Couche storage abstraite — interchangeable LocalStorage / API plus tard.
 */

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const localStorageAdapter: StorageAdapter = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Quota ou mode privé : on ignore silencieusement en V0
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
}

export function readJson<T>(adapter: StorageAdapter, key: string, fallback: T): T {
  const raw = adapter.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson<T>(adapter: StorageAdapter, key: string, value: T): void {
  adapter.setItem(key, JSON.stringify(value))
}
