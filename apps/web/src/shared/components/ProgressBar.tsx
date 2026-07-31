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
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label ? <span className="font-medium text-forest-800">{label}</span> : <span />}
          {showValue ? <span className="tabular-nums text-ink-muted">{pct}%</span> : null}
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-forest-100">
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', toneClasses[tone])}
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
