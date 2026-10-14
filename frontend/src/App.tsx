import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HealthProvider } from '@/context/HealthProvider'
import { RefreshProvider } from '@/context/RefreshProvider'
import { ToastProvider } from '@/context/ToastProvider'
import { NotFoundPage } from '@/pages/NotFoundPage'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const IncidentsPage = lazy(() => import('@/pages/IncidentsPage').then((m) => ({ default: m.IncidentsPage })))
const WebsiteDetailPage = lazy(() => import('@/pages/WebsiteDetailPage').then((m) => ({ default: m.WebsiteDetailPage })))
const WebsitesPage = lazy(() => import('@/pages/WebsitesPage').then((m) => ({ default: m.WebsitesPage })))

export function App() {
  return (
    <ToastProvider>
      <RefreshProvider>
        <HealthProvider>
          <Suspense fallback={<div className="p-8 text-sm text-muted" role="status">Loading…</div>}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="websites" element={<WebsitesPage />} />
              <Route path="websites/:id" element={<WebsiteDetailPage />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          </Suspense>
        </HealthProvider>
      </RefreshProvider>
    </ToastProvider>
  )
}
