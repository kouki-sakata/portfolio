import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { login } from '@/features/auth/api/login'
import { logout } from '@/features/auth/api/logout'
import { fetchSession } from '@/features/auth/api/session'
import { AuthContext, type AuthContextValue } from '@/features/auth/context/internal/AuthContext'
import type { LoginRequest, LoginResponse, SessionResponse } from '@/features/auth/types'

const AUTH_SESSION_KEY = ['auth', 'session'] as const

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()

  const sessionQuery = useQuery({
    queryKey: AUTH_SESSION_KEY,
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response: LoginResponse) => {
      queryClient.setQueryData<SessionResponse>(AUTH_SESSION_KEY, {
        authenticated: true,
        employee: response.employee,
      })
    },
    onError: () => {
      queryClient.setQueryData<SessionResponse>(AUTH_SESSION_KEY, {
        authenticated: false,
        employee: null,
      })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData<SessionResponse>(AUTH_SESSION_KEY, {
        authenticated: false,
        employee: null,
      })
    },
  })

  const handleLogin = async (payload: LoginRequest) => {
    const response = await loginMutation.mutateAsync(payload)
    return response.employee
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
  }

  const authenticated = sessionQuery.data?.authenticated ?? false

  const contextValue: AuthContextValue = {
    user: sessionQuery.data?.employee ?? null,
    authenticated,
    loading: sessionQuery.isLoading || loginMutation.isPending || logoutMutation.isPending,
    login: handleLogin,
    logout: handleLogout,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
