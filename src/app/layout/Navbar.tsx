import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { CalendarCheck2, LayoutDashboard, Leaf, RefreshCw } from 'lucide-react'
import { usePageTransition } from '@/app/transitions/PageTransitionContext'
import { SITE } from '@/shared/config/site'
import { cn } from '@/shared/utils/cn'

const links = [
  { to: '/', label: 'Tâches', icon: CalendarCheck2, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: false },
  { to: '/recurrences', label: 'Récurrences', icon: RefreshCw, end: false },
] as const

type NavLinkItem = (typeof links)[number]

function normalizePath(path: string): string {
  if (path === '/') return '/'
  return path.replace(/\/+$/, '') || '/'
}

function isLinkActive(link: NavLinkItem, activePath: string): boolean {
  const current = normalizePath(activePath)
  const target = normalizePath(link.to)
  if (link.end) return current === target
  return current === target || current.startsWith(`${target}/`)
}

interface IndicatorBox {
  left: number
  top: number
  width: number
  height: number
  ready: boolean
}

function useSlidingIndicator<T extends HTMLElement = HTMLElement>(activePath: string) {
  const navRef = useRef<T | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement>())
  const [indicator, setIndicator] = useState<IndicatorBox>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  })

  const setItemRef = useCallback((to: string, node: HTMLElement | null) => {
    if (node) itemRefs.current.set(to, node)
    else itemRefs.current.delete(to)
  }, [])

  const updateIndicator = useCallback(() => {
    const nav = navRef.current
    const active = links.find((link) => isLinkActive(link, activePath))
    if (!nav || !active) return

    const item = itemRefs.current.get(active.to)
    if (!item) return

    const navRect = nav.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()

    setIndicator({
      left: itemRect.left - navRect.left,
      top: itemRect.top - navRect.top,
      width: itemRect.width,
      height: itemRect.height,
      ready: true,
    })
  }, [activePath])

  useLayoutEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  useEffect(() => {
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [updateIndicator])

  return { navRef, setItemRef, indicator }
}

export function Navbar() {
  const location = useLocation()
  const { navigateWithTransition, busy, pendingPath } = usePageTransition()
  const activePath = pendingPath ?? location.pathname

  const desktop = useSlidingIndicator<HTMLElement>(activePath)
  const mobile = useSlidingIndicator<HTMLDivElement>(activePath)

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, to: string) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return
    }

    event.preventDefault()
    if (busy) return

    navigateWithTransition(to, {
      x: event.clientX,
      y: event.clientY,
    })
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-forest-200/80 bg-surface-elevated/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-600 text-white shadow-soft">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold tracking-tight text-forest-950">{SITE.name}</p>
              <p className="hidden text-xs text-ink-muted sm:block">{SITE.tagline}</p>
            </div>
          </div>

          <nav
            ref={desktop.navRef}
            className="relative hidden items-center gap-1 md:flex"
          >
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute top-0 left-0 rounded-lg bg-forest-100',
                'transition-[transform,width,height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                desktop.indicator.ready ? 'opacity-100' : 'opacity-0',
              )}
              style={{
                width: desktop.indicator.width,
                height: desktop.indicator.height,
                transform: `translate(${desktop.indicator.left}px, ${desktop.indicator.top}px)`,
              }}
            />
            {links.map((link) => {
              const active = isLinkActive(link, activePath)
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  ref={(node) => setItemRefCompat(desktop.setItemRef, link.to, node)}
                  onClick={(event) => handleNavClick(event, link.to)}
                  className={cn(
                    'relative z-10 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300',
                    active
                      ? 'text-forest-900'
                      : 'text-forest-700 hover:text-forest-900',
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-forest-200/80 bg-surface-elevated/95 backdrop-blur-md md:hidden">
        <div
          ref={mobile.navRef}
          className="relative mx-auto grid max-w-5xl grid-cols-3 gap-1 px-2 py-2"
        >
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-0 left-0 rounded-xl bg-forest-100',
              'transition-[transform,width,height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
              mobile.indicator.ready ? 'opacity-100' : 'opacity-0',
            )}
            style={{
              width: mobile.indicator.width,
              height: mobile.indicator.height,
              transform: `translate(${mobile.indicator.left}px, ${mobile.indicator.top}px)`,
            }}
          />
          {links.map((link) => {
            const active = isLinkActive(link, activePath)
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                ref={(node) => setItemRefCompat(mobile.setItemRef, link.to, node)}
                onClick={(event) => handleNavClick(event, link.to)}
                className={cn(
                  'relative z-10 flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors duration-300',
                  active ? 'text-forest-900' : 'text-forest-600',
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}

function setItemRefCompat(
  setItemRef: (to: string, node: HTMLElement | null) => void,
  to: string,
  node: HTMLAnchorElement | null,
) {
  setItemRef(to, node)
}
