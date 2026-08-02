import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '@/app/auth/AuthGuards'
import { AppLayout } from '@/app/layout/AppLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { HomeEntry } from '@/features/landing/pages/HomeEntry'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { InvitePage } from '@/features/share/pages/InvitePage'
import { RecurrencesPage } from '@/features/todos/pages/RecurrencesPage'
import { TodayPage } from '@/features/todos/pages/TodayPage'

export function AppRouter() {
  return (
    <Routes>
      <Route index element={<HomeEntry />} />

      <Route element={<GuestRoute />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route path="invite/:token" element={<InvitePage />} />

      <Route path="app" element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<TodayPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="recurrences" element={<RecurrencesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
