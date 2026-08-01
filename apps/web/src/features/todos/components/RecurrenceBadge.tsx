import type { Recurrence } from '@/features/todos/types/todo.types'
import { RECURRENCE_LABELS } from '@/features/todos/utils/recurrence'
import { Badge } from '@/shared/components/Badge'
import { CalendarClock, CalendarDays, CalendarRange, Sun } from 'lucide-react'

const icons = {
  DAILY: Sun,
  WEEKLY: CalendarDays,
  MONTHLY: CalendarRange,
  ONDAY: CalendarClock,
} as const

interface RecurrenceBadgeProps {
  recurrence: Recurrence
}

export function RecurrenceBadge({ recurrence }: RecurrenceBadgeProps) {
  const Icon = icons[recurrence]
  return (
    <Badge tone="moss">
      <Icon className="h-3 w-3" />
      {RECURRENCE_LABELS[recurrence]}
    </Badge>
  )
}
