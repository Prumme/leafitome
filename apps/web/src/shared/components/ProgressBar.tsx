import { cn } from '@/shared/utils/cn'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  tone?: 'forest' | 'done' | 'missed'
  className?: string
  showValue?: boolean
}

const toneClasses = {
  forest: 'bg-forest-500',
  done: 'bg-done-500',
  missed: 'bg-missed-500',
} as const

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'forest',
  className,
  showValue = true,
}: ProgressBarProps) {
  const pct = max === 0 ? 0 : Math.min(100, Math.max(0, Math.round((value / max) * 100)))

  return (
    <div className={cn('min-w-0 w-full max-w-full space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
          {label ? (
            <span className="min-w-0 truncate font-medium text-forest-800">{label}</span>
          ) : (
            <span />
          )}
          {showValue ? (
            <span className="shrink-0 tabular-nums text-ink-muted">{pct}%</span>
          ) : null}
        </div>
      )}
      <div className="h-2.5 w-full min-w-0 overflow-hidden rounded-full bg-forest-100">
        <div
          className={cn('h-full max-w-full rounded-full transition-[width] duration-300', toneClasses[tone])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
