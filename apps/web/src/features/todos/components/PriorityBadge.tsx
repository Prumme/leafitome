import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Minus,
} from 'lucide-react'
import type { Priority } from '@/features/todos/types/todo.types'
import { PRIORITY_LABELS } from '@/features/todos/utils/recurrence'
import { cn } from '@/shared/utils/cn'

const priorityStyles: Record<Priority, string> = {
  VHIGH: 'bg-[#ffe4e6] text-[#9f1239]',
  HIGH: 'bg-[#ffedd5] text-[#c2410c]',
  MEDIUM: 'bg-[#fef3c7] text-[#b45309]',
  LOW: 'bg-[#e0f2fe] text-[#0369a1]',
  VLOW: 'bg-[#f1f5f9] text-[#475569]',
}

const priorityIcons = {
  VHIGH: ArrowUpToLine,
  HIGH: ArrowUp,
  MEDIUM: Minus,
  LOW: ArrowDown,
  VLOW: ArrowDownToLine,
} as const

interface PriorityBadgeProps {
  priority: Priority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const Icon = priorityIcons[priority]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        priorityStyles[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
    </span>
  )
}
