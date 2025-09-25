import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { AppHeader } from '@/shared/components/layout/AppHeader'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageLoader } from '@/shared/components/layout/PageLoader'

export const AppLayout = () => {
  const location = useLocation()
  const { authenticated, loading } = useAuth()

  if (loading) {
    return (
      <AppShell>
        <main className="app-main" role="main">
          <PageLoader label="読み込み中" />
        </main>
      </AppShell>
    )
  }

  if (!authenticated) {
    return <Navigate to="/signin" replace state={{ redirectTo: location.pathname }} />
  }

  return (
    <AppShell>
      <AppHeader />
      <main className="app-main" role="main">
        <Outlet />
      </main>
    </AppShell>
  )
}
