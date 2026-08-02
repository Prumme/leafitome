import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '@/app/auth/AuthGuards'
import { AppLayout } from '@/app/layout/AppLayout'
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { AdminGate } from '@/features/admin/pages/AdminGate'
import { AdminLoginPage } from '@/features/admin/pages/AdminLoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage'
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
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="verify-email" element={<VerifyEmailPage />} />
      <Route path="invite/:token" element={<InvitePage />} />

      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route path="admin" element={<AdminGate />}>
        <Route index element={<AdminDashboardPage />} />
      </Route>

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
