import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export type TransitionOrigin = { x: number; y: number }

type TransitionPhase = 'idle' | 'covering' | 'melting'

interface PageTransitionContextValue {
  phase: TransitionPhase
  origin: TransitionOrigin | null
  busy: boolean
  /** Chemin cible pendant la transition (pour l’UI nav immédiate). */
  pendingPath: string | null
  navigateWithTransition: (to: string, origin: TransitionOrigin) => void
  onCoverComplete: () => void
  onMeltComplete: () => void
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null)

const COVER_MS = 1750
const MELT_MS = 1300

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function pathsMatch(current: string, target: string): boolean {
  const normalize = (path: string) => {
    if (path === '/') return '/'
    return path.replace(/\/+$/, '') || '/'
  }
  return normalize(current) === normalize(target)
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [phase, setPhase] = useState<TransitionPhase>('idle')
  const [origin, setOrigin] = useState<TransitionOrigin | null>(null)
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const pendingPathRef = useRef<string | null>(null)
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }, [])

  const onMeltComplete = useCallback(() => {
    clearTimers()
    setPhase('idle')
    setOrigin(null)
    setPendingPath(null)
    pendingPathRef.current = null
  }, [clearTimers])

  const onCoverComplete = useCallback(() => {
    const next = pendingPathRef.current
    if (next) {
      navigate(next)
    }
    setPhase('melting')
    const meltTimer = window.setTimeout(() => {
      onMeltComplete()
    }, MELT_MS)
    timersRef.current.push(meltTimer)
  }, [navigate, onMeltComplete])

  const navigateWithTransition = useCallback(
    (to: string, clickOrigin: TransitionOrigin) => {
      if (phase !== 'idle') return
      if (pathsMatch(location.pathname, to)) return

      if (prefersReducedMotion()) {
        navigate(to)
        return
      }

      clearTimers()
      pendingPathRef.current = to
      setPendingPath(to)
      setOrigin(clickOrigin)
      setPhase('covering')

      const coverTimer = window.setTimeout(() => {
        onCoverComplete()
      }, COVER_MS)
      timersRef.current.push(coverTimer)
    },
    [phase, location.pathname, navigate, clearTimers, onCoverComplete],
  )

  const value = useMemo(
    () => ({
      phase,
      origin,
      busy: phase !== 'idle',
      pendingPath,
      navigateWithTransition,
      onCoverComplete,
      onMeltComplete,
    }),
    [phase, origin, pendingPath, navigateWithTransition, onCoverComplete, onMeltComplete],
  )

  return (
    <PageTransitionContext.Provider value={value}>{children}</PageTransitionContext.Provider>
  )
}

export function usePageTransition(): PageTransitionContextValue {
  const ctx = useContext(PageTransitionContext)
  if (!ctx) {
    throw new Error('usePageTransition must be used within PageTransitionProvider')
  }
  return ctx
}

export const PAGE_TRANSITION_COVER_MS = COVER_MS
export const PAGE_TRANSITION_MELT_MS = MELT_MS
