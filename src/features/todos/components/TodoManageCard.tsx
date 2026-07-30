import { Archive, Leaf, Pencil, Power } from 'lucide-react'
import type { Todo } from '@/features/todos/types/todo.types'
import { PriorityBadge } from '@/features/todos/components/PriorityBadge'
import { RecurrenceBadge } from '@/features/todos/components/RecurrenceBadge'
import { DAY_LABELS } from '@/shared/utils/dates'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/utils/cn'

interface TodoManageCardProps {
  todo: Todo
  onEdit: (todo: Todo) => void
  onToggleEnabled: (todo: Todo) => void
  onArchive: (todo: Todo) => void
}

export function TodoManageCard({
  todo,
  onEdit,
  onToggleEnabled,
  onArchive,
}: TodoManageCardProps) {
  return (
    <Card
      padding="sm"
      className={cn(!todo.enabled && 'opacity-70', todo.archived && 'opacity-50')}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700"
          style={todo.color ? { backgroundColor: `${todo.color}22`, color: todo.color } : undefined}
        >
          <Leaf className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-forest-950">{todo.name}</h3>
            {todo.description ? (
              <p className="line-clamp-2 text-sm text-ink-muted">{todo.description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={todo.priority} />
            <RecurrenceBadge recurrence={todo.recurrence} />
            {!todo.enabled ? <Badge tone="neutral">Désactivée</Badge> : null}
            {todo.archived ? <Badge tone="missed">Archivée</Badge> : null}
            {todo.days && todo.days.length > 0 ? (
              <Badge tone="forest">{todo.days.map((day) => DAY_LABELS[day]).join(', ')}</Badge>
            ) : null}
            {todo.recurrence === 'MONTHLY' && todo.dayOfMonth ? (
              <Badge tone="forest">Le {todo.dayOfMonth}</Badge>
            ) : null}
            {todo.earlyCompletable &&
            (todo.recurrence === 'WEEKLY' || todo.recurrence === 'MONTHLY') ? (
              <Badge tone="moss">En avance OK</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(todo)}
            aria-label="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleEnabled(todo)}
            aria-label={todo.enabled ? 'Désactiver' : 'Activer'}
          >
            <Power className={cn('h-4 w-4', todo.enabled ? 'text-done-600' : 'text-bark-500')} />
          </Button>
          {!todo.archived ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onArchive(todo)}
              aria-label="Archiver"
            >
              <Archive className="h-4 w-4 text-missed-600" />
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
