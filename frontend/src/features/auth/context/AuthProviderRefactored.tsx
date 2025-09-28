import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useEffect, useMemo } from 'react'
import { AuthContext, type AuthContextValue } from '@/features/auth/context/internal/AuthContext'
import { createAuthService, type IAuthService } from '@/features/auth/services/AuthService'
import { getSessionManager, type ISessionManager } from '@/features/auth/services/SessionManager'
import type { LoginRequest } from '@/features/auth/types'

/**
 * 改善されたAuthProviderのProps
 * Dependency Injection Principleに準拠
 */
interface AuthProviderProps {
  children: ReactNode
  authService?: IAuthService
  sessionManager?: ISessionManager
}

const AUTH_SESSION_KEY = ['auth', 'session'] as const

/**
 * 改善されたAuthProvider
 * Single Responsibility: 認証コンテキストの提供のみを担当
 * Dependency Inversion: インターフェースに依存
 */
export const AuthProviderRefactored = ({
  children,
  authService = createAuthService(),
  sessionManager = getSessionManager(),
}: AuthProviderProps) => {
  const queryClient = useQueryClient()

  // セッション検証クエリ
  const sessionQuery = useQuery({
    queryKey: AUTH_SESSION_KEY,
    queryFn: () => authService.validateSession(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000, // 15分ごとに自動更新
  })

  // ログインミューテーション
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (employee) => {
      sessionManager.setSession(employee)
      queryClient.invalidateQueries({ queryKey: AUTH_SESSION_KEY })
    },
  })

  // ログアウトミューテーション
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      sessionManager.clearSession()
      queryClient.setQueryData(AUTH_SESSION_KEY, {
        authenticated: false,
        employee: null,
      })
    },
  })

  // セッション同期
  useEffect(() => {
    if (sessionQuery.data?.authenticated && sessionQuery.data.employee) {
      sessionManager.setSession(sessionQuery.data.employee)
    } else {
      sessionManager.clearSession()
    }
  }, [sessionQuery.data, sessionManager])

  // コンテキスト値の作成
  const contextValue: AuthContextValue = useMemo(() => ({
    user: sessionQuery.data?.employee ?? null,
    authenticated: sessionQuery.data?.authenticated ?? false,
    loading: sessionQuery.isLoading || loginMutation.isPending || logoutMutation.isPending,
    login: (credentials: LoginRequest) => loginMutation.mutateAsync(credentials),
    logout: () => logoutMutation.mutateAsync(),
  }), [
    sessionQuery.data,
    sessionQuery.isLoading,
    loginMutation,
    logoutMutation,
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}