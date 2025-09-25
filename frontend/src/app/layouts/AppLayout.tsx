import { Outlet } from 'react-router-dom'

import { AppHeader } from '@/shared/components/layout/AppHeader'
import { AppShell } from '@/shared/components/layout/AppShell'

export const AppLayout = () => (
  <AppShell>
    <AppHeader />
    <main className="app-main" role="main">
      <Outlet />
    </main>
  </AppShell>
)
