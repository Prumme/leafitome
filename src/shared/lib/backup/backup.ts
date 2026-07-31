import {
  HISTORY_STATUS_VALUES,
  type HistoryEntry,
} from '@/features/history/types/history.types'
import {
  PRIORITY_VALUES,
  RECURRENCE_VALUES,
  type Todo,
} from '@/features/todos/types/todo.types'

export const BACKUP_VERSION = 1 as const

export interface LeafitomeBackup {
  version: typeof BACKUP_VERSION
  app: 'leafitome'
  exportedAt: string
  todos: Todo[]
  history: HistoryEntry[]
}

export function buildBackup(todos: Todo[], history: HistoryEntry[]): LeafitomeBackup {
  return {
    version: BACKUP_VERSION,
    app: 'leafitome',
    exportedAt: new Date().toISOString(),
    todos,
    history,
  }
}

export function downloadBackup(backup: LeafitomeBackup): void {
  const stamp = backup.exportedAt.slice(0, 10)
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `leafitome-backup-${stamp}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTodo(value: unknown): value is Todo {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.recurrence === 'string' &&
    (RECURRENCE_VALUES as readonly string[]).includes(value.recurrence) &&
    typeof value.priority === 'string' &&
    (PRIORITY_VALUES as readonly string[]).includes(value.priority) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.enabled === 'boolean' &&
    typeof value.archived === 'boolean'
  )
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.todoId === 'string' &&
    typeof value.date === 'string' &&
    typeof value.status === 'string' &&
    (HISTORY_STATUS_VALUES as readonly string[]).includes(value.status) &&
    typeof value.createdAt === 'string'
  )
}

export function parseBackup(raw: unknown): LeafitomeBackup {
  if (!isRecord(raw)) {
    throw new Error('Fichier invalide : JSON attendu.')
  }
  if (raw.app !== 'leafitome') {
    throw new Error('Ce fichier ne semble pas être une sauvegarde Leafitome.')
  }
  if (raw.version !== BACKUP_VERSION) {
    throw new Error(`Version de sauvegarde non supportée (${String(raw.version)}).`)
  }
  if (!Array.isArray(raw.todos) || !Array.isArray(raw.history)) {
    throw new Error('Sauvegarde incomplète : todos / history manquants.')
  }
  if (!raw.todos.every(isTodo)) {
    throw new Error('Certaines todos de la sauvegarde sont invalides.')
  }
  if (!raw.history.every(isHistoryEntry)) {
    throw new Error('Certaines entrées d’historique sont invalides.')
  }

  return {
    version: BACKUP_VERSION,
    app: 'leafitome',
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    todos: raw.todos,
    history: raw.history,
  }
}

export async function readBackupFile(file: File): Promise<LeafitomeBackup> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    throw new Error('Impossible de lire le JSON.')
  }
  return parseBackup(parsed)
}
