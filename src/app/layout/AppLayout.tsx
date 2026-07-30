import { Outlet } from 'react-router-dom'
import { Footer } from '@/app/layout/Footer'
import { Navbar } from '@/app/layout/Navbar'
import { useBootstrapData } from '@/shared/hooks/useBootstrapData'
import { Leaf } from 'lucide-react'

export function AppLayout() {
  const { ready } = useBootstrapData()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
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
    </div>
  )
}
