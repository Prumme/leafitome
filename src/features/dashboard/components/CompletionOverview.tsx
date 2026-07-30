import type { CompletionStats } from '@/features/history/utils/completion'
import { Card } from '@/shared/components/Card'
import { ProgressBar } from '@/shared/components/ProgressBar'

interface CompletionOverviewProps {
  stats: CompletionStats
}

export function CompletionOverview({ stats }: CompletionOverviewProps) {
  const evaluated = stats.done + stats.missed

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-forest-950">Taux de complétion</h2>
        <p className="text-sm text-ink-muted">
          Basé sur les tâches évaluées (faites ou manquées) sur la période.
        </p>
      </div>

      <ProgressBar
        value={stats.completionRate}
        label="Complétion"
        tone={stats.completionRate >= 70 ? 'done' : stats.completionRate >= 40 ? 'forest' : 'missed'}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Faites" value={stats.done} className="text-done-700" />
        <MiniStat label="Manquées" value={stats.missed} className="text-missed-700" />
        <MiniStat label="Évaluées" value={evaluated} />
      </div>
    </Card>
  )
}

function MiniStat({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className="rounded-xl bg-forest-50 px-3 py-2">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`text-lg font-bold tabular-nums text-forest-900 ${className ?? ''}`}>{value}</p>
    </div>
  )
}
