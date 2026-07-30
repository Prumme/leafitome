import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { RecurrencesPage } from '@/features/todos/pages/RecurrencesPage'
import { TodayPage } from '@/features/todos/pages/TodayPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="recurrences" element={<RecurrencesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
