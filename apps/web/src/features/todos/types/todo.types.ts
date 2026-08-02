import type { Day } from '@/shared/types/common.types'

export const RECURRENCE_VALUES = ['DAILY', 'WEEKLY', 'MONTHLY', 'ONDAY'] as const
export type Recurrence = (typeof RECURRENCE_VALUES)[number]

export const PRIORITY_VALUES = ['VHIGH', 'HIGH', 'MEDIUM', 'LOW', 'VLOW'] as const
export type Priority = (typeof PRIORITY_VALUES)[number]

export interface Todo {
  id: string
  name: string
  description?: string
  recurrence: Recurrence
  /** Jours de la semaine concernés (WEEKLY) */
  days?: Day[]
  /** Jour du mois (1–31) pour MONTHLY */
  dayOfMonth?: number
  /**
   * WEEKLY / MONTHLY : la tâche peut être complétée avant son jour prévu
   * (dans la même semaine / le même mois).
   */
  earlyCompletable?: boolean
  /** ONDAY : date d’échéance (YYYY-MM-DD), faisable jusqu’à ce jour inclus */
  deadline?: string | null
  /** Début du cycle d’échéance courant (ISO) — mis à jour quand la deadline change */
  deadlineUpdatedAt?: string | null
  priority: Priority
  createdAt: string
  updatedAt: string
  enabled: boolean
  color?: string
  archived: boolean
  /** Todo collaborative — hors streak / heatmap */
  shared?: boolean
  /** Présent uniquement pour le créateur quand shared */
  shareToken?: string
  ownerId?: string
  membershipRole?: 'OWNER' | 'MEMBER'
  isOwner?: boolean
}

export type CreateTodoInput = Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'archived'> & {
  archived?: boolean
}

export type UpdateTodoInput = Partial<Omit<Todo, 'id' | 'createdAt'>>

/** Palette de couleurs proposée dans le formulaire */
export const TODO_COLOR_PALETTE = [
  '#2f573e',
  '#3a6d4c',
  '#4d8861',
  '#63a644',
  '#84c065',
  '#1d4e89',
  '#3b82c4',
  '#0ea5a4',
  '#14b8a6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#c2410c',
  '#ea580c',
  '#f59e0b',
  '#eab308',
  '#be123c',
  '#e11d48',
  '#78716c',
  '#44403c',
] as const

export type TodoColor = (typeof TODO_COLOR_PALETTE)[number]
