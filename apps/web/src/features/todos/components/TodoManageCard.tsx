import { useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { Archive, Leaf, Pencil, Power } from 'lucide-react'
import type { Todo } from '@/features/todos/types/todo.types'
import { PriorityBadge } from '@/features/todos/components/PriorityBadge'
import { RecurrenceBadge } from '@/features/todos/components/RecurrenceBadge'
import { DAY_LABELS, formatShortDate } from '@/shared/utils/dates'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/utils/cn'

interface TodoManageCardProps {
  todo: Todo
  onEdit: (todo: Todo) => void
  onToggleEnabled: (todo: Todo) => void
  onArchive: (todo: Todo) => void | Promise<void>
}

type CrumplePhase = 'idle' | 'crumpling' | 'collapsing'

interface CrumpleThrow {
  tx: string
  ty: string
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function TodoManageCard({
  todo,
  onEdit,
  onToggleEnabled,
  onArchive,
}: TodoManageCardProps) {
  const [phase, setPhase] = useState<CrumplePhase>('idle')
  const [crumpleThrow, setCrumpleThrow] = useState<CrumpleThrow>({
    tx: '0px',
    ty: '0px',
  })
  const cardRef = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)

  async function handleArchive(event: MouseEvent<HTMLButtonElement>) {
    if (busyRef.current || todo.archived) return
    busyRef.current = true

    const card = cardRef.current
    if (card) {
      const rect = card.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const clickY = event.clientY - rect.top
      setCrumpleThrow({
        tx: `${clickX - rect.width / 2}px`,
        ty: `${clickY - rect.height / 2}px`,
      })
    } else {
      setCrumpleThrow({ tx: '0px', ty: '0px' })
    }

    if (prefersReducedMotion()) {
      try {
        await onArchive(todo)
      } finally {
        busyRef.current = false
      }
      return
    }

    setPhase('crumpling')
    await wait(1200)
    setPhase('collapsing')
    await wait(450)

    try {
      await onArchive(todo)
    } finally {
      busyRef.current = false
    }
  }

  const crumpleStyle = {
    '--crumple-tx': crumpleThrow.tx,
    '--crumple-ty': crumpleThrow.ty,
  } as CSSProperties

  return (
    <div
      className={cn(
        'todo-crumple-slot',
        phase === 'crumpling' && 'is-crumpling',
        phase === 'collapsing' && 'is-collapsing',
      )}
    >
      <div className="todo-crumple-slot-inner">
        <Card
          ref={cardRef}
          padding="sm"
          style={crumpleStyle}
          className={cn(
            !todo.enabled && phase === 'idle' && 'opacity-70',
            todo.archived && 'opacity-50',
            phase !== 'idle' && 'animate-card-crumple-away select-none',
            phase === 'collapsing' && 'opacity-0',
          )}
        >
          <div
            className={cn(
              'flex items-start gap-3',
              phase !== 'idle' && 'pointer-events-none',
            )}
          >
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700"
              style={
                todo.color ? { backgroundColor: `${todo.color}22`, color: todo.color } : undefined
              }
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
                {todo.days && todo.days.length > 0 && todo.recurrence === 'WEEKLY' ? (
                  <Badge tone="forest">{todo.days.map((day) => DAY_LABELS[day]).join(', ')}</Badge>
                ) : null}
                {todo.recurrence === 'MONTHLY' && todo.dayOfMonth ? (
                  <Badge tone="forest">Le {todo.dayOfMonth}</Badge>
                ) : null}
                {todo.recurrence === 'ONDAY' && todo.deadline ? (
                  <Badge tone="missed">Échéance {formatShortDate(todo.deadline)}</Badge>
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
                disabled={phase !== 'idle'}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleEnabled(todo)}
                aria-label={todo.enabled ? 'Désactiver' : 'Activer'}
                disabled={phase !== 'idle'}
              >
                <Power
                  className={cn('h-4 w-4', todo.enabled ? 'text-done-600' : 'text-bark-500')}
                />
              </Button>
              {!todo.archived ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(event) => void handleArchive(event)}
                  aria-label="Archiver"
                  disabled={phase !== 'idle'}
                >
                  <Archive className="h-4 w-4 text-missed-600" />
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
