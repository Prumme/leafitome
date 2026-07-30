import { NavLink } from 'react-router-dom'
import { CalendarCheck2, LayoutDashboard, Leaf, RefreshCw } from 'lucide-react'
import { SITE } from '@/shared/config/site'
import { cn } from '@/shared/utils/cn'

const links = [
  { to: '/', label: 'Tâches', icon: CalendarCheck2, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: false },
  { to: '/recurrences', label: 'Récurrences', icon: RefreshCw, end: false },
] as const

export function Navbar() {
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

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-forest-100 text-forest-900'
                      : 'text-forest-700 hover:bg-forest-50 hover:text-forest-900',
                  )
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-forest-200/80 bg-surface-elevated/95 backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-1 px-2 py-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium',
                  isActive ? 'bg-forest-100 text-forest-900' : 'text-forest-600',
                )
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
