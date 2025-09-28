import '@/styles/global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'

import { queryClient } from '@/app/config/queryClient'
import { AppRoutes } from '@/app/routes/AppRoutes'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SessionTimeoutNotification } from '@/features/auth/components/SessionTimeoutNotification'
import { AuthProvider } from '@/features/auth/context/AuthProvider'

export const AppProviders = () => (
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
          <SessionTimeoutNotification />
          <Toaster />
        </AuthProvider>
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)
