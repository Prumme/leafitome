import { Outlet } from 'react-router-dom'
import { Footer } from '@/app/layout/Footer'
import { Navbar } from '@/app/layout/Navbar'
import { PageTransitionProvider } from '@/app/transitions/PageTransitionContext'
import { PageTransitionOverlay } from '@/app/transitions/PageTransitionOverlay'
import { VerifyEmailDialog } from '@/features/auth/components/VerifyEmailDialog'
import { BadgeToast } from '@/features/badges/components/BadgeToast'
import { useBadgeUnlockWatcher } from '@/features/badges/hooks/useBadgeUnlockWatcher'
import { DayCompleteOverlay } from '@/features/celebration/DayCompleteOverlay'
import { useDayCompleteCelebration } from '@/features/celebration/useDayCompleteCelebration'
import { useNotificationScheduler } from '@/features/notifications/hooks/useNotificationScheduler'
import { useBootstrapData } from '@/shared/hooks/useBootstrapData'
import { useRealtimeSync } from '@/shared/hooks/useRealtimeSync'
import { Leaf } from 'lucide-react'

export function AppLayout() {
  const { ready } = useBootstrapData()
  const celebrating = useDayCompleteCelebration(ready)
  useBadgeUnlockWatcher(ready)
  useNotificationScheduler(ready)
  useRealtimeSync(ready)

  return (
    <PageTransitionProvider>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
            {ready ? (
              <Outlet />
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-ink-muted">
                <Leaf className="h-8 w-8 animate-pulse text-forest-500" />
                <p>Préparation de la clairière…</p>
              </div>
            )}
          </main>
          <Footer />
          <PageTransitionOverlay />
          <DayCompleteOverlay active={celebrating} />
          <BadgeToast />
          {ready ? <VerifyEmailDialog /> : null}
        </div>
      </div>
    </PageTransitionProvider>
  )
}
