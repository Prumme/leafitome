import { useEffect, useRef, useState } from 'react'
import { BADGE_BY_ID } from '@/features/badges/catalog/badgeCatalog'
import { useBadgeStore } from '@/features/badges/store/badgeStore'
import type { BadgeId } from '@/features/badges/types/badge.types'
import { playBadgeChime } from '@/features/badges/utils/badgeSound'
import { cn } from '@/shared/utils/cn'

const DISMISS_MS = 4000

const toneStyles = {
  forest: 'bg-forest-50 text-forest-800 border-forest-200',
  moss: 'bg-moss-50 text-moss-800 border-moss-200',
  done: 'bg-done-50 text-done-800 border-done-200',
  missed: 'bg-missed-50 text-missed-800 border-missed-200',
  bark: 'bg-bark-50 text-bark-800 border-bark-200',
} as const

const iconTone = {
  forest: 'bg-forest-600 text-white',
  moss: 'bg-moss-600 text-white',
  done: 'bg-done-600 text-white',
  missed: 'bg-missed-600 text-white',
  bark: 'bg-bark-600 text-white',
} as const

interface ToastItem {
  id: BadgeId
  key: string
}

export function BadgeToast() {
  const pendingToasts = useBadgeStore((state) => state.pendingToasts)
  const consumeToast = useBadgeStore((state) => state.consumeToast)
  const [visible, setVisible] = useState<ToastItem[]>([])
  const timersRef = useRef<number[]>([])
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (pendingToasts.length === 0) return

    const ids = [...pendingToasts]
    for (const id of ids) {
      consumeToast(id)
      playBadgeChime()
      const key = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setVisible((prev) => [...prev, { id, key }])
      const timer = window.setTimeout(() => {
        setVisible((prev) => prev.filter((item) => item.key !== key))
      }, DISMISS_MS)
      timersRef.current.push(timer)
    }
  }, [pendingToasts, consumeToast])

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current) window.clearTimeout(timer)
    }
  }, [])

  if (visible.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[min(100%-2rem,20rem)] flex-col gap-2 md:bottom-6"
      aria-live="polite"
    >
      {visible.map((item) => {
        const badge = BADGE_BY_ID[item.id]
        if (!badge) return null
        const Icon = badge.icon
        return (
          <div
            key={item.key}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-2xl border px-3 py-3 shadow-soft',
              toneStyles[badge.tone],
              reducedMotion ? 'opacity-100' : 'animate-badge-toast-in',
            )}
            role="status"
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                iconTone[badge.tone],
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                Badge débloqué
              </p>
              <p className="truncate font-semibold">{badge.name}</p>
              <p className="truncate text-xs opacity-80">{badge.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
