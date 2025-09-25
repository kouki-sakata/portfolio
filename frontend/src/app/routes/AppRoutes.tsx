import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AppLayout } from '@/app/layouts/AppLayout'
import { SignInRoute } from '@/features/auth/routes/SignInRoute'
import { EmployeeAdminRoute } from '@/features/employees/routes/EmployeeAdminRoute'
import { HomeRoute } from '@/features/home/routes/HomeRoute'
import { StampHistoryRoute } from '@/features/stampHistory/routes/StampHistoryRoute'
import { ComingSoon } from '@/shared/components/layout/ComingSoon'
import { NotFoundRoute } from '@/shared/components/layout/NotFoundRoute'

const router = createBrowserRouter([
  {
    path: '/signin',
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
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
  { path: '*', element: <NotFoundRoute /> },
])

export const AppRoutes = () => <RouterProvider router={router} />
