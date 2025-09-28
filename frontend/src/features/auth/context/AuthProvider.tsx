import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode,useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { configureQueryClientErrorHandler } from '@/app/config/queryClient'
import { login } from '@/features/auth/api/login'
import { logout } from '@/features/auth/api/logout'
import { fetchSession } from '@/features/auth/api/session'
import { AuthContext } from '@/features/auth/context/internal/AuthContext'
import { getSessionManager } from '@/features/auth/services/SessionManager'
import type { LoginRequest, LoginResponse, SessionResponse } from '@/features/auth/types'
import type {
  AuthProviderConfig,
  EnhancedAuthContextValue,
  SessionInfo,
} from '@/features/auth/types/auth-context.types'

const AUTH_SESSION_KEY = ['auth', 'session'] as const
const WARNING_THRESHOLD_MINUTES = 15 // セッション期限の15分前に警告
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8時間

interface AuthProviderProps {
  children: ReactNode
  config?: Partial<AuthProviderConfig>
}

const defaultConfig: AuthProviderConfig = {
  sessionConfig: {
    sessionDuration: SESSION_DURATION_MS,
    warningBeforeExpiry: WARNING_THRESHOLD_MINUTES,
    autoExtendSession: false,
  },
  loginPath: '/auth/signin',
  defaultRedirectPath: '/',
}

/**
 * CSRFトークンをcookieから取得
 */
const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null

  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))

  if (!token) return null
  return decodeURIComponent(token.split('=')[1] ?? '')
}

export const AuthProvider = ({ children, config }: AuthProviderProps) => {
  const mergedConfig = { ...defaultConfig, ...config }
  const queryClient = useQueryClient()
  const sessionManager = getSessionManager()
  const navigate = useNavigate()
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // State for enhanced features
  const [csrfToken, setCsrfToken] = useState<string | null>(getCsrfToken())
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null)

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

    // SessionManagerに保存
    sessionManager.setSession(response.employee)

    // セッション情報を更新
    const now = new Date()
    setSessionInfo({
      createdAt: now,
      expiresAt: new Date(now.getTime() + mergedConfig.sessionConfig.sessionDuration),
      lastActivity: now,
      warningThreshold: mergedConfig.sessionConfig.warningBeforeExpiry,
    })

    // CSRFトークンを更新
    setCsrfToken(getCsrfToken())

    return response.employee
  }

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch (error) {
      // ログアウトAPIが失敗してもローカルセッションはクリア
      console.error('Logout API failed:', error)
    } finally {
      // SessionManagerをクリア
      sessionManager.clearSession()

      // セッション情報をリセット
      setSessionInfo(null)
      setSessionTimeoutWarning(false)
      setTimeUntilExpiry(null)
    }
  }, [logoutMutation, sessionManager])

  const refreshCsrfToken = useCallback(() => {
    setCsrfToken(getCsrfToken())
  }, [])

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_KEY })

    // セッション情報を更新
    const sessionData = sessionManager.getSession()
    if (sessionData) {
      setSessionInfo({
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        lastActivity: new Date(),
        warningThreshold: mergedConfig.sessionConfig.warningBeforeExpiry,
      })
    }
  }, [queryClient, sessionManager, mergedConfig.sessionConfig.warningBeforeExpiry])

  // セッション期限チェック
  const isSessionExpiring = useMemo(() => {
    if (!sessionInfo) return false

    const now = new Date()
    const timeRemaining = sessionInfo.expiresAt.getTime() - now.getTime()
    const warningThresholdMs = mergedConfig.sessionConfig.warningBeforeExpiry * 60 * 1000

    return timeRemaining <= warningThresholdMs && timeRemaining > 0
  }, [sessionInfo, mergedConfig.sessionConfig.warningBeforeExpiry])

  // グローバル401エラーハンドラーの設定
  useEffect(() => {
    // ESLintのno-misused-promisesルールを回避
    // handleLogoutは非同期関数だが、エラーハンドラー内で適切に処理される
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    configureQueryClientErrorHandler(handleLogout, navigate)
  }, [navigate, handleLogout])

  // セッション変更の監視
  useEffect(() => {
    const unsubscribe = sessionManager.onSessionChange((sessionData) => {
      if (sessionData) {
        setSessionInfo({
          createdAt: sessionData.createdAt,
          expiresAt: sessionData.expiresAt,
          lastActivity: new Date(),
          warningThreshold: mergedConfig.sessionConfig.warningBeforeExpiry,
        })
      } else {
        setSessionInfo(null)
      }
    })

    return unsubscribe
  }, [sessionManager, mergedConfig.sessionConfig.warningBeforeExpiry])

  // セッションデータの初期化
  useEffect(() => {
    if (sessionQuery.data?.authenticated && sessionQuery.data.employee) {
      sessionManager.setSession(sessionQuery.data.employee)

      const sessionData = sessionManager.getSession()
      if (sessionData) {
        setSessionInfo({
          createdAt: sessionData.createdAt,
          expiresAt: sessionData.expiresAt,
          lastActivity: new Date(),
          warningThreshold: mergedConfig.sessionConfig.warningBeforeExpiry,
        })
      }
    }
  }, [
    sessionQuery.data?.authenticated,
    sessionQuery.data?.employee,
    sessionManager,
    mergedConfig.sessionConfig.warningBeforeExpiry,
  ])

  // セッション期限の定期チェック
  useEffect(() => {
    if (!sessionInfo) return

    const checkSessionExpiry = () => {
      const now = new Date()
      const remaining = sessionInfo.expiresAt.getTime() - now.getTime()

      setTimeUntilExpiry(remaining > 0 ? remaining : null)

      const warningThresholdMs = mergedConfig.sessionConfig.warningBeforeExpiry * 60 * 1000

      if (remaining <= warningThresholdMs && remaining > 0) {
        setSessionTimeoutWarning(true)
      } else if (remaining <= 0) {
        // セッション期限切れ
        void handleLogout()
      } else {
        setSessionTimeoutWarning(false)
      }
    }

    checkSessionExpiry()
    sessionCheckInterval.current = setInterval(checkSessionExpiry, 10000) // 10秒ごとにチェック

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
    }
  }, [sessionInfo, mergedConfig.sessionConfig.warningBeforeExpiry, handleLogout])

  const authenticated = sessionQuery.data?.authenticated ?? false

  const contextValue: EnhancedAuthContextValue = {
    // 基本認証状態
    user: sessionQuery.data?.employee ?? null,
    authenticated,
    loading: sessionQuery.isLoading || loginMutation.isPending || logoutMutation.isPending,

    // 認証アクション
    login: handleLogin,
    logout: handleLogout,

    // セッション管理
    sessionInfo,
    refreshSession,
    isSessionExpiring,
    timeUntilExpiry,
    sessionTimeoutWarning,

    // CSRF保護
    csrfToken,
    refreshCsrfToken,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
