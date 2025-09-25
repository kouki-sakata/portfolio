import '@/styles/global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'

import { queryClient } from '@/app/config/queryClient'
import { AppRoutes } from '@/app/routes/AppRoutes'

export const AppProviders = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  </StrictMode>
)
