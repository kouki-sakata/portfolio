import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AppLayout } from '@/app/layouts/AppLayout'
import { HomeRoute } from '@/features/home/routes/HomeRoute'
import { NotFoundRoute } from '@/shared/components/layout/NotFoundRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomeRoute /> },
      {
        path: 'news',
        lazy: async () => ({
          Component: (await import('@/features/home/routes/HomeRoute')).HomeRoute,
        }),
      },
      {
        path: 'attendance',
        lazy: async () => ({
          Component: (await import('@/features/home/routes/HomeRoute')).HomeRoute,
        }),
      },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
])

export const AppRoutes = () => <RouterProvider router={router} />
