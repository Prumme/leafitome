import type { ReactNode } from 'react'
import { Leaf } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  icon?: ReactNode
}

export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-forest-200',
        'bg-forest-50/60 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-moss-100 text-moss-700">
        {icon ?? <Leaf className="h-6 w-6" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-forest-900">{title}</h3>
        {description ? <p className="max-w-sm text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
