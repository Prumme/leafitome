import type { BadgeProgress } from '@/features/badges/types/badge.types'
import { EMPTY_BADGE_PROGRESS } from '@/features/badges/types/badge.types'
import { apiFetch } from '@/shared/lib/api/client'

export class ApiBadgeRepository {
  async get(): Promise<BadgeProgress> {
    const data = await apiFetch<{ progress: BadgeProgress }>('/badges')
    return {
      unlocked: data.progress.unlocked ?? {},
      hasTraveled: Boolean(data.progress.hasTraveled),
    }
  }

  async save(progress: BadgeProgress): Promise<void> {
    await apiFetch('/badges', {
      method: 'PUT',
      body: JSON.stringify({
        unlocked: progress.unlocked ?? {},
        hasTraveled: Boolean(progress.hasTraveled),
      }),
    })
  }
}

export const badgeRepository = new ApiBadgeRepository()

export { EMPTY_BADGE_PROGRESS }
