import { Leaf } from 'lucide-react'
import type { TodoOccurrence } from '@/features/history/utils/completion'
import { useHistoryActions } from '@/features/history/hooks/useHistoryActions'
import { PriorityBadge } from '@/features/todos/components/PriorityBadge'
import { RecurrenceBadge } from '@/features/todos/components/RecurrenceBadge'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { formatShortDate } from '@/shared/utils/dates'
import { cn } from '@/shared/utils/cn'

interface OccurrenceCardProps {
  occurrence: TodoOccurrence
  showDate?: boolean
}

export function OccurrenceCard({ occurrence, showDate = false }: OccurrenceCardProps) {
  const { toggleDone } = useHistoryActions()
  const { todo, date, status, early } = occurrence
  const isDone = status === 'DONE'
  const isMissed = status === 'MISSED'
  const canToggle = status === 'PENDING' || status === 'DONE' || status === 'MISSED' || status === 'UPCOMING'

  return (
    <Card
      padding="sm"
      className={cn(
        'transition-colors',
        isDone && 'border-done-200 bg-done-50/40',
        isMissed && 'border-missed-200 bg-missed-50/50',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            isDone
              ? 'bg-bark-100 text-bark-400'
              : isMissed
                ? 'bg-missed-100 text-missed-700'
                : 'bg-forest-100 text-forest-700',
          )}
          style={
            todo.color && !isDone && !isMissed
              ? { backgroundColor: `${todo.color}22`, color: todo.color }
              : undefined
          }
        >
          <Leaf className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="min-w-0 space-y-0.5">
            <h3
              className={cn(
                'truncate font-semibold text-forest-950',
                isDone && 'text-bark-400 line-through decoration-bark-300',
              )}
            >
              {todo.name}
            </h3>
            {todo.description ? (
              <p
                className={cn(
                  'line-clamp-2 text-sm text-ink-muted',
                  isDone && 'text-bark-300',
                )}
              >
                {todo.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={todo.priority} />
            <RecurrenceBadge recurrence={todo.recurrence} />
            {early ? <Badge tone="moss">En avance</Badge> : null}
            {showDate || early ? (
              <Badge tone="neutral">Échéance {formatShortDate(date)}</Badge>
            ) : null}
          </div>
        </div>

        {canToggle ? (
          <label className="mt-1 flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isDone}
              onChange={() => void toggleDone(todo.id, date, isDone)}
              aria-label={isDone ? 'Marquer comme non fait' : 'Marquer comme fait'}
              className={cn(
                'h-5 w-5 cursor-pointer rounded border-2 border-forest-300 text-done-600',
                'accent-done-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500',
              )}
            />
          </label>
        ) : null}
      </div>
    </Card>
  )
}
