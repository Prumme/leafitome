import { BrowserRouter } from 'react-router-dom'
import { useAuthBootstrap } from '@/app/auth/AuthGuards'
import { AppRouter } from '@/app/router'

export function App() {
  useAuthBootstrap()

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRouter />
    </BrowserRouter>
  )
}
