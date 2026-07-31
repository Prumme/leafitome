import { Leaf } from 'lucide-react'
import { DAY_COMPLETE_PHRASE } from '@/features/celebration/useDayCompleteCelebration'

interface DayCompleteOverlayProps {
  active: boolean
}

export function DayCompleteOverlay({ active }: DayCompleteOverlayProps) {
  if (!active) return null

  return (
    <div
      className="day-complete-root pointer-events-none absolute inset-0 z-30 overflow-hidden"
      aria-live="polite"
    >
      <span className="day-complete-ripple" aria-hidden />
      <span className="day-complete-ripple day-complete-ripple-delay" aria-hidden />
      <p className="day-complete-phrase font-celebrate">
        <Leaf className="day-complete-leaf" aria-hidden />
        <span>{DAY_COMPLETE_PHRASE}</span>
      </p>
    </div>
  )
}
