import type { LucideIcon } from 'lucide-react'

export type BadgeId =
  | 'streak-7'
  | 'streak-14'
  | 'streak-30'
  | 'streak-60'
  | 'streak-180'
  | 'streak-365'
  | 'todos-created-1'
  | 'todos-created-10'
  | 'todos-created-50'
  | 'todos-done-1'
  | 'todos-done-10'
  | 'todos-done-50'
  | 'todos-done-100'
  | 'perfect-day-1'
  | 'perfect-day-5'
  | 'perfect-day-20'
  | 'streak-comeback'
  | 'recurrence-weekly'
  | 'recurrence-monthly'
  | 'backup-traveler'

export type BadgeTone = 'forest' | 'moss' | 'done' | 'missed' | 'bark'

export interface BadgeDefinition {
  id: BadgeId
  name: string
  description: string
  icon: LucideIcon
  tone: BadgeTone
}

export interface BadgeUnlock {
  unlockedAt: string
}

export interface BadgeProgress {
  unlocked: Partial<Record<BadgeId, BadgeUnlock>>
  /** Flag pour le badge voyageur (export / import). */
  hasTraveled?: boolean
}

export const EMPTY_BADGE_PROGRESS: BadgeProgress = {
  unlocked: {},
  hasTraveled: false,
}
