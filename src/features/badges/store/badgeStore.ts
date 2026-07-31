import { create } from 'zustand'
import { badgeRepository } from '@/features/badges/store/badgeRepository'
import type { BadgeId, BadgeProgress, BadgeUnlock } from '@/features/badges/types/badge.types'
import { EMPTY_BADGE_PROGRESS } from '@/features/badges/types/badge.types'

interface BadgeState {
  progress: BadgeProgress
  loaded: boolean
  pendingToasts: BadgeId[]
  load: () => Promise<void>
  unlockMany: (ids: BadgeId[], options?: { silent?: boolean }) => Promise<BadgeId[]>
  markTraveled: () => Promise<void>
  consumeToast: (id: BadgeId) => void
  replaceAll: (progress: BadgeProgress) => Promise<void>
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  progress: EMPTY_BADGE_PROGRESS,
  loaded: false,
  pendingToasts: [],

  load: async () => {
    const progress = await badgeRepository.get()
    set({ progress, loaded: true })
  },

  unlockMany: async (ids, options) => {
    if (ids.length === 0) return []
    const current = get().progress
    const newly: BadgeId[] = []
    const unlocked = { ...current.unlocked }
    const now = new Date().toISOString()

    for (const id of ids) {
      if (unlocked[id]) continue
      const unlock: BadgeUnlock = { unlockedAt: now }
      unlocked[id] = unlock
      newly.push(id)
    }

    if (newly.length === 0) return []

    const progress: BadgeProgress = {
      ...current,
      unlocked,
    }
    await badgeRepository.save(progress)
    set((state) => ({
      progress,
      pendingToasts: options?.silent
        ? state.pendingToasts
        : [...state.pendingToasts, ...newly],
    }))
    return newly
  },

  markTraveled: async () => {
    const current = get().progress
    if (current.hasTraveled) return
    const progress: BadgeProgress = { ...current, hasTraveled: true }
    await badgeRepository.save(progress)
    set({ progress })
  },

  consumeToast: (id) => {
    set((state) => ({
      pendingToasts: state.pendingToasts.filter((item) => item !== id),
    }))
  },

  replaceAll: async (progress) => {
    const next: BadgeProgress = {
      unlocked: progress.unlocked ?? {},
      hasTraveled: Boolean(progress.hasTraveled),
    }
    await badgeRepository.save(next)
    set({ progress: next, loaded: true, pendingToasts: [] })
  },
}))
