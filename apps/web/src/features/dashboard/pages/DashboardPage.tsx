import { useMemo } from 'react'
import { CheckCircle2, CircleDashed, Leaf, AlertTriangle } from 'lucide-react'
import { ActivityHeatmap } from '@/features/dashboard/components/ActivityHeatmap'
import { BadgesCard } from '@/features/dashboard/components/BadgesCard'
import { CompletionOverview } from '@/features/dashboard/components/CompletionOverview'
import { StatsCard } from '@/features/dashboard/components/StatsCard'
import { StreakCard } from '@/features/dashboard/components/StreakCard'
import { useActivityInsights } from '@/features/dashboard/hooks/useActivityInsights'
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats'
import { OccurrenceCard } from '@/features/todos/components/OccurrenceCard'
import { occurrenceKey, usePinnedOccurrences } from '@/features/todos/hooks/usePinnedOccurrences'
import { EmptyState } from '@/shared/components/EmptyState'
import { PageHeader } from '@/shared/components/PageHeader'
import { Tabs } from '@/shared/components/Tabs'
import { usePeriodStore } from '@/shared/store/periodStore'
import type { PeriodFilter } from '@/shared/types/common.types'
import { formatDisplayDate } from '@/shared/utils/dates'

const periodOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
]

export function DashboardPage() {
  const period = usePeriodStore((state) => state.period)
  const setPeriod = usePeriodStore((state) => state.setPeriod)
  const { stats, remaining, loaded } = useDashboardStats(period)
  const { heatmap, streak } = useActivityInsights()
  const { displayed, pin, unpin } = usePinnedOccurrences(remaining)

  const subtitle = useMemo(() => formatDisplayDate(new Date()), [])

  if (!loaded) {
    return <p className="text-ink-muted">Chargement du tableau de bord…</p>
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Récapitulatif · ${subtitle}`}
        actions={<Tabs options={periodOptions} value={period} onChange={setPeriod} />}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Complétion"
          value={`${stats.completionRate}%`}
          tone="done"
          icon={<CheckCircle2 className="h-5 w-5" />}
          hint="Sur la période sélectionnée"
        />
        <StatsCard
          label="Faites"
          value={stats.done}
          tone="done"
          icon={<Leaf className="h-5 w-5" />}
        />
        <StatsCard
          label="Manquées"
          value={stats.missed}
          tone="missed"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatsCard
          label="Restantes aujourd'hui"
          value={remaining.length}
          tone="pending"
          icon={<CircleDashed className="h-5 w-5" />}
        />
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-3">
        <ActivityHeatmap cells={heatmap} />
        <BadgesCard />
        <StreakCard streak={streak} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CompletionOverview stats={stats} />
        </div>

        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold text-forest-950">Reste à faire aujourd'hui</h2>
          {displayed.length === 0 ? (
            <EmptyState
              title="Tout est clair"
              description="Aucune tâche restante pour aujourd'hui. Belle forêt intérieure."
            />
          ) : (
            <div className="space-y-2">
              {displayed.map((occurrence) => (
                <OccurrenceCard
                  key={occurrenceKey(occurrence)}
                  occurrence={occurrence}
                  disappearWhenDone
                  onWillLeave={pin}
                  onDidLeave={unpin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
