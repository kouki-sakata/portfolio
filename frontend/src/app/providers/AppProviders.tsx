import '@/styles/global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'

import { queryClient } from '@/app/config/queryClient'
import { AppLayout } from '@/app/layouts/AppLayout'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SessionTimeoutNotification } from '@/features/auth/components/SessionTimeoutNotification'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { SignInRoute } from '@/features/auth/routes/SignInRoute'
import { EmployeeAdminRoute } from '@/features/employees/routes/EmployeeAdminRoute'
import { HomeRoute } from '@/features/home/routes/HomeRoute'
import { StampHistoryRoute } from '@/features/stampHistory/routes/StampHistoryRoute'
import { ComingSoon } from '@/shared/components/layout/ComingSoon'
import { NotFoundRoute } from '@/shared/components/layout/NotFoundRoute'

// Root component that provides auth context to all routes
const RootWithAuth = () => (
  <AuthProvider>
    <Outlet />
    <SessionTimeoutNotification />
    <Toaster />
  </AuthProvider>
)

// Define the router with auth provider at the root
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootWithAuth />,
    children: [
      {
        path: 'signin',
        element: <SignInRoute />,
      },
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRoute /> },
          { path: 'attendance', element: <HomeRoute /> },
          { path: 'stamp-history', element: <StampHistoryRoute /> },
          {
            path: 'news',
            element: <ComingSoon title="お知らせ" description="フロントエンドの刷新に向けて準備中です。" />,
          },
          {
            path: 'admin/employees',
            element: <EmployeeAdminRoute />,
          },
          {
            path: 'admin/news',
            element: <ComingSoon title="お知らせ管理" description="管理画面を順次公開予定です。" />,
          },
          {
            path: 'admin/logs',
            element: <ComingSoon title="操作ログ" description="ログ管理機能のReact移行を進行中です。" />,
          },
        ],
      },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
])

export const AppProviders = () => (
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)
