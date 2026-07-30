import { useMemo, useState } from 'react'
import { CheckCircle2, CircleDashed, Leaf, AlertTriangle } from 'lucide-react'
import { CompletionOverview } from '@/features/dashboard/components/CompletionOverview'
import { StatsCard } from '@/features/dashboard/components/StatsCard'
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats'
import { OccurrenceCard } from '@/features/todos/components/OccurrenceCard'
import { EmptyState } from '@/shared/components/EmptyState'
import { PageHeader } from '@/shared/components/PageHeader'
import { Tabs } from '@/shared/components/Tabs'
import type { PeriodFilter } from '@/shared/types/common.types'
import { formatDisplayDate } from '@/shared/utils/dates'

const periodOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
]

export function DashboardPage() {
  const [period, setPeriod] = useState<PeriodFilter>('week')
  const { stats, remaining, loaded } = useDashboardStats(period)

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

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CompletionOverview stats={stats} />
        </div>

        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold text-forest-950">Reste à faire aujourd'hui</h2>
          {remaining.length === 0 ? (
            <EmptyState
              title="Tout est clair"
              description="Aucune tâche restante pour aujourd'hui. Belle forêt intérieure."
            />
          ) : (
            <div className="space-y-2">
              {remaining.map((occurrence) => (
                <OccurrenceCard
                  key={`${occurrence.todo.id}-${occurrence.date}`}
                  occurrence={occurrence}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
