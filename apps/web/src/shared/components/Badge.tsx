import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

type BadgeTone = 'neutral' | 'done' | 'missed' | 'pending' | 'forest' | 'moss'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-bark-100 text-bark-800',
  done: 'bg-done-100 text-done-800',
  missed: 'bg-missed-100 text-missed-800',
  pending: 'bg-forest-100 text-forest-800',
  forest: 'bg-forest-100 text-forest-700',
  moss: 'bg-moss-100 text-moss-800',
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
