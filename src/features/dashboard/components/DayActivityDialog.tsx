import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Leaf, Percent } from 'lucide-react'
import { getDayEncouragement } from '@/features/dashboard/utils/dayEncouragement'
import type { HeatmapCell } from '@/features/dashboard/utils/activity'
import {
  computeCompletionStats,
  getOccurrencesForRange,
} from '@/features/history/utils/completion'
import { OccurrenceCard } from '@/features/todos/components/OccurrenceCard'
import { occurrenceKey } from '@/features/todos/hooks/usePinnedOccurrences'
import { useHistoryStore } from '@/features/history/store/historyStore'
import { useTodoStore } from '@/features/todos/store/todoStore'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { EmptyState } from '@/shared/components/EmptyState'
import { Modal } from '@/shared/components/Modal'
import { formatDisplayDate, parseDateString } from '@/shared/utils/dates'
import { cn } from '@/shared/utils/cn'

interface DayActivityDialogProps {
  open: boolean
  date: string | null
  cells: HeatmapCell[]
  onClose: () => void
  onDateChange: (date: string) => void
}

function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function DayActivityDialog({
  open,
  date,
  cells,
  onClose,
  onDateChange,
}: DayActivityDialogProps) {
  const todos = useTodoStore((state) => state.todos)
  const entries = useHistoryStore((state) => state.entries)

  const activityDates = useMemo(
    () => cells.filter((cell) => cell.planned > 0).map((cell) => cell.date),
    [cells],
  )

  const dateIndex = date ? activityDates.indexOf(date) : -1
  const prevDate = dateIndex > 0 ? activityDates[dateIndex - 1] : undefined
  const nextDate =
    dateIndex >= 0 && dateIndex < activityDates.length - 1
      ? activityDates[dateIndex + 1]
      : undefined

  const occurrences = useMemo(() => {
    if (!date) return []
    const active = todos.filter((todo) => !todo.archived)
    const day = parseDateString(date)
    const list = getOccurrencesForRange(active, entries, day, day)
    return [...list].sort((a, b) => {
      const rank = (status: string) => (status === 'DONE' ? 0 : 1)
      const byStatus = rank(a.status) - rank(b.status)
      if (byStatus !== 0) return byStatus
      return a.todo.name.localeCompare(b.todo.name, 'fr')
    })
  }, [date, todos, entries])

  const stats = useMemo(() => computeCompletionStats(occurrences), [occurrences])
  const encouragement = useMemo(
    () => getDayEncouragement(stats.completionRate, stats.total),
    [stats.completionRate, stats.total],
  )

  const title = date ? capitalize(formatDisplayDate(date)) : 'Journée'

  return (
    <Modal open={open} title={title} onClose={onClose} className="sm:max-w-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!prevDate}
            onClick={() => prevDate && onDateChange(prevDate)}
            aria-label="Jour précédent avec activité"
          >
            <ChevronLeft className="h-4 w-4" />
            Veille
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!nextDate}
            onClick={() => nextDate && onDateChange(nextDate)}
            aria-label="Jour suivant avec activité"
          >
            Lendemain
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card padding="sm" className="flex items-start gap-3 shadow-none">
            <div className="rounded-xl bg-done-50 p-2.5 text-done-700">
              <Percent className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-ink-muted">Complétion</p>
              <p className="text-2xl font-bold tabular-nums text-forest-950">
                {stats.completionRate}%
              </p>
              <p className="text-xs text-bark-500">
                {stats.done}/{stats.total} faite{stats.done === 1 ? '' : 's'}
              </p>
            </div>
          </Card>

          <Card
            padding="sm"
            className={cn(
              'flex items-start gap-3 shadow-none',
              stats.completionRate >= 100
                ? 'border-moss-200 bg-moss-50/60'
                : 'border-forest-200',
            )}
          >
            <div className="rounded-xl bg-forest-50 p-2.5 text-forest-700">
              <Leaf className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-forest-950">{encouragement.title}</p>
              <p className="text-xs text-ink-muted">{encouragement.subtitle}</p>
            </div>
          </Card>
        </div>

        {occurrences.length === 0 ? (
          <EmptyState
            title="Aucune todo prévue"
            description="Ce jour n’avait pas de tâches planifiées."
          />
        ) : (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-forest-800">Todos du jour</h3>
            <div className="space-y-2">
              {occurrences.map((occurrence) => (
                <OccurrenceCard
                  key={occurrenceKey(occurrence)}
                  occurrence={occurrence}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
