import { useRef, useState, type CSSProperties, type MouseEvent } from 'react'
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
  /**
   * La card quitte la liste une fois faite (ex: early, "reste à faire").
   * Pin parent → persistance immédiate → anim → unpin.
   */
  disappearWhenDone?: boolean
  onWillLeave?: (occurrence: TodoOccurrence) => void
  onDidLeave?: (occurrence: TodoOccurrence) => void
}

type AnimPhase = 'idle' | 'validating' | 'unchecking' | 'exiting'

interface RippleOrigin {
  x: number
  y: number
}

interface RippleBurst {
  origin: RippleOrigin
  firstScale: number
  secondScale: number
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

/** Écart final 2ᵉ onde vs 1ʳᵉ (rayon). À ajuster selon le rendu. */
const SECOND_RIPPLE_GAP_PX = 20

/** Doit matcher `.lake-ripple` : min(160vw, 72rem). */
function getRippleBaseSizePx(): number {
  if (typeof window === 'undefined') return 72 * 16
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return Math.min(window.innerWidth * 1.6, 72 * rem)
}

/** Portée aléatoire entre 1 et 1.5. */
function randomRippleScale(): number {
  return 1 + Math.random() * 0.5
}

/** Deuxième onde : s'arrête toujours SECOND_RIPPLE_GAP_PX avant la première. */
function secondRippleScaleFromFirst(firstScale: number): number {
  const baseSize = getRippleBaseSizePx()
  const scaleGap = (2 * SECOND_RIPPLE_GAP_PX) / baseSize
  return Math.max(0.05, firstScale - scaleGap)
}

export function OccurrenceCard({
  occurrence,
  showDate = false,
  disappearWhenDone = false,
  onWillLeave,
  onDidLeave,
}: OccurrenceCardProps) {
  const { toggleDone } = useHistoryActions()
  const { todo, date, status, early } = occurrence
  const isDone = status === 'DONE'
  const isMissed = status === 'MISSED'
  const canToggle =
    status === 'PENDING' || status === 'DONE' || status === 'MISSED' || status === 'UPCOMING'
  const leavesWhenDone = disappearWhenDone || Boolean(early)

  const cardRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<AnimPhase>('idle')
  /** null = suivre le store ; true/false = override optimiste */
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null)
  const [rippleBurst, setRippleBurst] = useState<RippleBurst | null>(null)
  const busyRef = useRef(false)

  const visuallyDone = optimisticDone ?? isDone
  const isErasingStrike = phase === 'unchecking'

  function createRippleBurst(origin: RippleOrigin): RippleBurst {
    const firstScale = randomRippleScale()
    return {
      origin,
      firstScale,
      secondScale: secondRippleScaleFromFirst(firstScale),
    }
  }

  function captureRippleOrigin(event: MouseEvent<HTMLElement>) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    setRippleBurst(
      createRippleBurst({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }),
    )
  }

  async function handleToggle() {
    if (busyRef.current || !canToggle) return

    if (visuallyDone) {
      busyRef.current = true
      const reduced = prefersReducedMotion()
      setRippleBurst(null)
      setPhase('unchecking')
      setOptimisticDone(false)

      const persist = toggleDone(todo.id, date, true)

      if (!reduced) await wait(520)

      try {
        await persist
      } finally {
        busyRef.current = false
        setOptimisticDone(null)
        setPhase('idle')
      }
      return
    }

    busyRef.current = true
    const reduced = prefersReducedMotion()

    setRippleBurst((current) => {
      if (current) return current
      const card = cardRef.current
      if (!card) {
        return createRippleBurst({ x: 0, y: 0 })
      }
      return createRippleBurst({
        x: card.clientWidth - 28,
        y: card.clientHeight / 2,
      })
    })

    setPhase('validating')
    setOptimisticDone(true)

    if (leavesWhenDone) {
      onWillLeave?.(occurrence)
    }

    const persist = toggleDone(todo.id, date, false)

    if (!reduced) {
      // 2.3s + délai 2e onde 50ms + marge de fondu
      await wait(leavesWhenDone ? 2500 : 2450)
    }

    if (leavesWhenDone) {
      setPhase('exiting')
      if (!reduced) await wait(420)
      try {
        await persist
      } catch {
        setOptimisticDone(null)
        setPhase('idle')
      } finally {
        busyRef.current = false
        setRippleBurst(null)
        onDidLeave?.(occurrence)
      }
      return
    }

    try {
      await persist
    } finally {
      busyRef.current = false
      setPhase('idle')
      setOptimisticDone(null)
      setRippleBurst(null)
    }
  }

  const cardRippleStyle =
    rippleBurst !== null
      ? ({
          '--ripple-x': `${rippleBurst.origin.x}px`,
          '--ripple-y': `${rippleBurst.origin.y}px`,
        } as CSSProperties)
      : undefined

  return (
    <Card
      ref={cardRef}
      padding="sm"
      className={cn(
        'relative overflow-hidden transition-colors',
        visuallyDone && 'border-done-200 bg-done-50/40',
        isMissed && !visuallyDone && 'border-missed-200 bg-missed-50/50',
        phase === 'validating' && 'animate-card-validate',
        phase === 'exiting' && 'animate-fade-exit',
      )}
      style={cardRippleStyle}
    >
      {phase === 'validating' || phase === 'exiting' ? (
        <>
          <span
            className="lake-ripple"
            aria-hidden
            style={
              {
                '--ripple-end-scale': String(rippleBurst?.firstScale ?? 1),
              } as CSSProperties
            }
          />
          <span
            className="lake-ripple lake-ripple-delay"
            aria-hidden
            style={
              {
                '--ripple-end-scale': String(rippleBurst?.secondScale ?? 1.2),
              } as CSSProperties
            }
          />
        </>
      ) : null}

      <div className="relative z-10 flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
            visuallyDone
              ? 'bg-bark-100 text-bark-400'
              : isMissed
                ? 'bg-missed-100 text-missed-700'
                : 'bg-forest-100 text-forest-700',
            isErasingStrike && 'animate-leaf-flash',
          )}
          style={
            todo.color && !isMissed
              ? ({
                  '--leaf-rest-bg': `${todo.color}22`,
                  '--leaf-rest-fg': todo.color,
                  ...(!visuallyDone
                    ? { backgroundColor: `${todo.color}22`, color: todo.color }
                    : {}),
                } as CSSProperties)
              : undefined
          }
        >
          <Leaf className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="min-w-0 space-y-0.5">
            <h3
              className={cn(
                'truncate font-semibold leading-snug text-forest-950 opacity-100',
                isErasingStrike
                  ? 'transition-[color,opacity] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
                  : 'transition-[color,opacity] duration-[2300ms] ease-[cubic-bezier(0.08,0.55,0.2,1)]',
                visuallyDone && 'text-bark-400 opacity-[0.4]',
              )}
            >
              <span
                className={cn(
                  'todo-title-strike',
                  visuallyDone && 'is-struck',
                  phase === 'validating' && 'is-striking',
                  isErasingStrike && 'is-erasing',
                )}
              >
                {todo.name}
              </span>
            </h3>
            {todo.description ? (
              <p
                className={cn(
                  'line-clamp-2 text-sm leading-snug text-ink-muted transition-colors duration-300',
                  visuallyDone && 'text-bark-300',
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
          <label
            className={cn(
              'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center',
              isErasingStrike && 'animate-checkbox-uncheck',
            )}
            onMouseDown={captureRippleOrigin}
          >
            <input
              type="checkbox"
              checked={visuallyDone}
              onChange={() => void handleToggle()}
              aria-label={visuallyDone ? 'Marquer comme non fait' : 'Marquer comme fait'}
              className={cn(
                'h-6 w-6 cursor-pointer rounded border-2 border-forest-300 text-done-600',
                'accent-done-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500',
              )}
            />
          </label>
        ) : null}
      </div>
    </Card>
  )
}
