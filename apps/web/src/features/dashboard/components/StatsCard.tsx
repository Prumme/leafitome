import type { ReactNode } from 'react'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/utils/cn'

interface StatsCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  tone?: 'forest' | 'done' | 'missed' | 'pending'
  className?: string
}

const toneStyles = {
  forest: 'bg-forest-50 text-forest-700',
  done: 'bg-done-50 text-done-700',
  missed: 'bg-missed-50 text-missed-700',
  pending: 'bg-bark-50 text-bark-700',
} as const

export function StatsCard({
  label,
  value,
  hint,
  icon,
  tone = 'forest',
  className,
}: StatsCardProps) {
  return (
    <Card className={cn('flex items-start gap-3', className)} padding="md">
      {icon ? (
        <div className={cn('rounded-xl p-2.5', toneStyles[tone])}>{icon}</div>
      ) : null}
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-forest-950">{value}</p>
        {hint ? <p className="text-xs text-bark-500">{hint}</p> : null}
      </div>
    </Card>
  )
}
