import type { StreakStats } from '@/features/dashboard/utils/activity'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/utils/cn'

interface StreakCardProps {
  streak: StreakStats
}

type TreeStage = 0 | 1 | 2 | 3 | 4

function stageFromStreak(current: number): TreeStage {
  if (current <= 0) return 0
  if (current < 3) return 1
  if (current < 7) return 2
  if (current < 14) return 3
  return 4
}

function stageLabel(stage: TreeStage): string {
  switch (stage) {
    case 0:
      return 'En attente de la première pousse'
    case 1:
      return 'Une graine germe'
    case 2:
      return 'Jeune pousse'
    case 3:
      return 'Jeune arbre'
    case 4:
      return 'Arbre bien enraciné'
  }
}

function GrowingTree({ stage }: { stage: TreeStage }) {
  return (
    <svg
      viewBox="0 0 120 140"
      className="h-28 w-24 shrink-0"
      aria-hidden
    >
      {/* sol */}
      <ellipse cx="60" cy="128" rx="38" ry="8" className="fill-bark-200" />

      {/* pot / terre */}
      <path
        d="M38 118h44l-4 12H42z"
        className="fill-bark-400"
      />
      <ellipse cx="60" cy="118" rx="22" ry="5" className="fill-bark-300" />

      {/* graine */}
      {stage === 0 ? (
        <ellipse cx="60" cy="112" rx="6" ry="4" className="fill-bark-600" />
      ) : null}

      {/* tige */}
      {stage >= 1 ? (
        <path
          d="M60 112v-28"
          className="stroke-forest-700"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      ) : null}

      {/* petite feuille */}
      {stage === 1 ? (
        <path
          d="M60 92c8-2 14-8 14-14-8 2-14 8-14 14z"
          className="fill-moss-400"
        />
      ) : null}

      {/* pousse avec 2 feuilles */}
      {stage === 2 ? (
        <>
          <path
            d="M60 88c-12-4-18-12-16-20 10 4 16 12 16 20z"
            className="fill-moss-400"
          />
          <path
            d="M60 84c12-4 18-12 16-20-10 4-16 12-16 20z"
            className="fill-moss-500"
          />
        </>
      ) : null}

      {/* jeune arbre */}
      {stage === 3 ? (
        <>
          <path
            d="M60 112v-40"
            className="stroke-bark-700"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="60" cy="58" r="22" className="fill-forest-500" />
          <circle cx="48" cy="64" r="14" className="fill-moss-500" />
          <circle cx="72" cy="62" r="15" className="fill-forest-400" />
        </>
      ) : null}

      {/* arbre mature */}
      {stage === 4 ? (
        <>
          <path
            d="M60 112v-46"
            className="stroke-bark-800"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="60" cy="48" r="28" className="fill-forest-600" />
          <circle cx="42" cy="58" r="18" className="fill-moss-500" />
          <circle cx="78" cy="56" r="19" className="fill-forest-500" />
          <circle cx="60" cy="38" r="16" className="fill-moss-400" />
        </>
      ) : null}
    </svg>
  )
}

export function StreakCard({ streak }: StreakCardProps) {
  const stage = stageFromStreak(streak.current)

  return (
    <Card className="flex h-full flex-col gap-4" padding="md">
      <div>
        <h2 className="text-lg font-semibold text-forest-950">Série</h2>
        <p className="text-sm text-ink-muted">
          ≥1 todo faite garde la flamme · journée vide = neutre
        </p>
      </div>

      <div className="flex flex-1 items-center gap-4">
        <GrowingTree stage={stage} />
        <div className="min-w-0 space-y-1">
          <p className="text-3xl font-bold tabular-nums text-forest-950">
            {streak.current}
            <span className="ml-1 text-base font-semibold text-forest-700">
              {streak.current === 1 ? 'jour' : 'jours'}
            </span>
          </p>
          <p className={cn('text-sm font-medium text-moss-700')}>{stageLabel(stage)}</p>
          <p className="text-xs text-bark-500">
            Record : {streak.best} {streak.best === 1 ? 'jour' : 'jours'}
          </p>
        </div>
      </div>
    </Card>
  )
}
