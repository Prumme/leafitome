import { useMemo } from 'react'
import type { HeatmapCell } from '@/features/dashboard/utils/activity'
import { Card } from '@/shared/components/Card'
import { formatShortDate } from '@/shared/utils/dates'
import { cn } from '@/shared/utils/cn'

interface ActivityHeatmapProps {
  cells: HeatmapCell[]
}

const WEEKDAY_LABELS = ['Lun', '', 'Mer', '', 'Ven', '', 'Dim'] as const

function cellClass(cell: HeatmapCell): string {
  if (cell.kind === 'future' || cell.kind === 'empty') {
    return 'bg-bark-100/80'
  }
  if (cell.kind === 'broken') {
    return 'bg-missed-200'
  }
  if (cell.kind === 'open') {
    return cell.done > 0 ? 'bg-done-200' : 'bg-bark-100/80'
  }
  // success — intensity levels
  if (cell.intensity >= 0.85) return 'bg-done-600'
  if (cell.intensity >= 0.6) return 'bg-done-500'
  if (cell.intensity >= 0.35) return 'bg-done-300'
  return 'bg-done-200'
}

function cellTitle(cell: HeatmapCell): string {
  const label = formatShortDate(cell.date)
  if (cell.planned === 0) return `${label} · aucune todo`
  if (cell.kind === 'broken') return `${label} · ${cell.missed}/${cell.planned} manquée(s)`
  return `${label} · ${cell.done}/${cell.planned} faite(s)`
}

export function ActivityHeatmap({ cells }: ActivityHeatmapProps) {
  const weeks = useMemo(() => {
    const columns: HeatmapCell[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      columns.push(cells.slice(i, i + 7))
    }
    return columns
  }, [cells])

  return (
    <Card className="space-y-4" padding="md">
      <div>
        <h2 className="text-lg font-semibold text-forest-950">Activité</h2>
        <p className="text-sm text-ink-muted">12 dernières semaines · intensité = todos faites</p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-full gap-2 sm:min-w-0">
          <div className="flex flex-col justify-between py-0.5 pr-1 text-[10px] leading-none text-bark-500">
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={`${label}-${index}`} className="flex h-3 items-center">
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((cell) => (
                  <span
                    key={cell.date}
                    title={cellTitle(cell)}
                    className={cn(
                      'h-3 w-3 rounded-[3px] sm:h-3.5 sm:w-3.5',
                      cellClass(cell),
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <span>Moins</span>
        <span className="h-3 w-3 rounded-[3px] bg-bark-100/80" />
        <span className="h-3 w-3 rounded-[3px] bg-done-200" />
        <span className="h-3 w-3 rounded-[3px] bg-done-300" />
        <span className="h-3 w-3 rounded-[3px] bg-done-500" />
        <span className="h-3 w-3 rounded-[3px] bg-done-600" />
        <span>Plus</span>
        <span className="mx-1 text-bark-300">·</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-[3px] bg-missed-200" />
          Jour cassé
        </span>
      </div>
    </Card>
  )
}
