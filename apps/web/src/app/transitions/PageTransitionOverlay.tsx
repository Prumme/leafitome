import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { usePageTransition } from '@/app/transitions/PageTransitionContext'
import { cn } from '@/shared/utils/cn'

export function PageTransitionOverlay() {
  const { phase, origin } = usePageTransition()
  const rootRef = useRef<HTMLDivElement>(null)
  const [localOrigin, setLocalOrigin] = useState({ x: '50%', y: '40%' })
  const [coordsReady, setCoordsReady] = useState(false)

  useEffect(() => {
    if (phase === 'idle') setCoordsReady(false)
  }, [phase])

  useLayoutEffect(() => {
    if (phase === 'idle' || !origin || !rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()
    const x = Math.min(Math.max(origin.x - rect.left, 0), Math.max(rect.width, 1))
    const y = Math.min(Math.max(origin.y - rect.top, 0), Math.max(rect.height, 1))
    setLocalOrigin({ x: `${x}px`, y: `${y}px` })
    setCoordsReady(true)
  }, [origin, phase])

  if (phase === 'idle') return null

  const style = {
    '--page-tx': localOrigin.x,
    '--page-ty': localOrigin.y,
  } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={cn(
        'page-transition-root pointer-events-none absolute inset-0 z-30 overflow-hidden',
        phase === 'covering' && coordsReady && 'is-covering',
        phase === 'melting' && 'is-melting',
      )}
      style={style}
      aria-hidden
    >
      <div className="page-transition-veil" />
      <span className="page-transition-ripple" />
      <span className="page-transition-ripple page-transition-ripple-delay" />
    </div>
  )
}
