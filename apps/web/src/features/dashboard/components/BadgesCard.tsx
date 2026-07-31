import { BADGE_CATALOG } from '@/features/badges/catalog/badgeCatalog'
import { useBadgeStore } from '@/features/badges/store/badgeStore'
import type { BadgeTone } from '@/features/badges/types/badge.types'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/utils/cn'

const unlockedIcon: Record<BadgeTone, string> = {
  forest: 'text-forest-600',
  moss: 'text-moss-600',
  done: 'text-done-600',
  missed: 'text-missed-600',
  bark: 'text-bark-600',
}

const unlockedText: Record<BadgeTone, string> = {
  forest: 'text-forest-900',
  moss: 'text-moss-900',
  done: 'text-done-900',
  missed: 'text-missed-900',
  bark: 'text-bark-900',
}

export function BadgesCard() {
  const unlocked = useBadgeStore((state) => state.progress.unlocked)

  const badges = [...BADGE_CATALOG].sort((a, b) => {
    const aUnlocked = Boolean(unlocked?.[a.id])
    const bUnlocked = Boolean(unlocked?.[b.id])
    if (aUnlocked === bUnlocked) return 0
    return aUnlocked ? -1 : 1
  })

  return (
    <Card className="flex h-full min-w-0 flex-col gap-3" padding="md">
      <div>
        <h2 className="text-lg font-semibold text-forest-950">Badges</h2>
        <p className="text-sm text-ink-muted">
          {Object.keys(unlocked ?? {}).length}/{BADGE_CATALOG.length} débloqués
        </p>
      </div>

      <div className="-mx-1 flex-1 overflow-x-auto px-1 pb-1">
        <ul className="flex h-full min-h-32 items-stretch gap-4">
          {badges.map((badge) => {
            const isUnlocked = Boolean(unlocked?.[badge.id])
            const Icon = badge.icon
            return (
              <li
                key={badge.id}
                title={badge.description}
                className={cn(
                  'flex w-24 shrink-0 flex-col items-center justify-center gap-2 text-center',
                  isUnlocked
                    ? unlockedText[badge.tone]
                    : 'text-bark-500 grayscale opacity-60',
                )}
              >
                <Icon
                  className={cn(
                    'h-12 w-12 shrink-0',
                    isUnlocked ? unlockedIcon[badge.tone] : 'text-bark-400',
                  )}
                  aria-hidden
                />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold leading-tight">{badge.name}</p>
                  <p className="text-[10px] leading-snug opacity-80">{badge.description}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}
