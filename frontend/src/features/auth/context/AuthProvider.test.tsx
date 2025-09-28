import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, type MockedFunction,vi } from 'vitest'

import * as loginApi from '@/features/auth/api/login'
import * as logoutApi from '@/features/auth/api/logout'
import * as sessionApi from '@/features/auth/api/session'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getSessionManager, type ISessionManager } from '@/features/auth/services/SessionManager'
import type { EmployeeSummary,LoginRequest, LoginResponse, SessionResponse } from '@/features/auth/types'

// Mock the API modules
vi.mock('@/features/auth/api/login')
vi.mock('@/features/auth/api/logout')
vi.mock('@/features/auth/api/session')
vi.mock('@/features/auth/services/SessionManager')
vi.mock('@/app/config/queryClient', () => ({
  configureQueryClientErrorHandler: vi.fn(),
}))

describe('AuthProvider', () => {
  let queryClient: QueryClient
  let mockSessionManager: ISessionManager

  const mockEmployee: EmployeeSummary = {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    admin: false,
  }

  const mockLoginRequest: LoginRequest = {
    email: 'test@example.com',
    password: 'password123',
  }

  const mockLoginResponse: LoginResponse = {
    employee: mockEmployee,
  }

  const mockSessionResponse: SessionResponse = {
    authenticated: true,
    employee: mockEmployee,
  }

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Mock SessionManager
    mockSessionManager = {
      getSession: vi.fn(),
      setSession: vi.fn(),
      clearSession: vi.fn(),
      hasValidSession: vi.fn(),
      onSessionChange: vi.fn(),
    }

    ;(getSessionManager as MockedFunction<typeof getSessionManager>).mockReturnValue(mockSessionManager)

    // Reset all mocks
    vi.clearAllMocks()

    // Mock document.cookie for CSRF token
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'XSRF-TOKEN=test-csrf-token',
    })
  })

  describe('初期化', () => {
    it('初回レンダリング時にセッション情報を取得する', async () => {
      const fetchSessionSpy = vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(fetchSessionSpy).toHaveBeenCalledTimes(1)
      })

      expect(result.current.authenticated).toBe(true)
      expect(result.current.user).toEqual(mockEmployee)
    })

    it('セッション取得失敗時は未認証状態になる', async () => {
      vi.spyOn(sessionApi, 'fetchSession').mockRejectedValue(new Error('Session fetch failed'))

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.authenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  describe('ログイン機能', () => {
    it('ログイン成功時にユーザー情報とセッションを設定する', async () => {
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue({ authenticated: false, employee: null })
      vi.spyOn(loginApi, 'login').mockResolvedValue(mockLoginResponse)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await act(async () => {
        const user = await result.current.login(mockLoginRequest)
        expect(user).toEqual(mockEmployee)
      })

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true)
        expect(result.current.user).toEqual(mockEmployee)
      })

      // SessionManagerが呼ばれることを確認
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockSessionManager.setSession).toHaveBeenCalledWith(mockEmployee)
    })

    it('ログイン失敗時にエラーをスローする', async () => {
      const error = new Error('Invalid credentials')
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue({ authenticated: false, employee: null })
      vi.spyOn(loginApi, 'login').mockRejectedValue(error)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await expect(result.current.login(mockLoginRequest)).rejects.toThrow('Invalid credentials')

      expect(result.current.authenticated).toBe(false)
      expect(result.current.user).toBeNull()
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockSessionManager.setSession).not.toHaveBeenCalled()
    })
  })

  describe('ログアウト機能', () => {
    it('ログアウト時にセッションをクリアする', async () => {
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)
      vi.spyOn(logoutApi, 'logout').mockResolvedValue()

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      await waitFor(() => {
        expect(result.current.authenticated).toBe(false)
        expect(result.current.user).toBeNull()
      })

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockSessionManager.clearSession).toHaveBeenCalled()
    })

    it('ログアウトAPIエラー時でもローカルセッションをクリアする', async () => {
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)
      vi.spyOn(logoutApi, 'logout').mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      await waitFor(() => {
        expect(result.current.authenticated).toBe(false)
        expect(result.current.user).toBeNull()
      })

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockSessionManager.clearSession).toHaveBeenCalled()
    })
  })

  describe('CSRFトークン管理', () => {
    it('CSRFトークンを取得できる', async () => {
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.csrfToken).toBe('test-csrf-token')
    })

    it('CSRFトークンが存在しない場合はnullを返す', async () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      })

      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.csrfToken).toBeNull()
    })

    it('CSRFトークンを更新できる', async () => {
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // トークンを変更
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'XSRF-TOKEN=new-csrf-token',
      })

      act(() => {
        result.current.refreshCsrfToken()
      })

      expect(result.current.csrfToken).toBe('new-csrf-token')
    })
  })

  describe('セッションタイムアウト管理', () => {
    it('セッション情報を取得できる', async () => {
      const mockSessionData = {
        user: mockEmployee,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8時間後
      }

      mockSessionManager.getSession = vi.fn().mockReturnValue(mockSessionData)
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.sessionInfo).toBeDefined()
      expect(result.current.sessionInfo?.createdAt).toEqual(mockSessionData.createdAt)
      expect(result.current.sessionInfo?.expiresAt).toEqual(mockSessionData.expiresAt)
    })

    it('セッション期限が近い場合に警告フラグを設定する', async () => {
      const mockSessionData = {
        user: mockEmployee,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分後
      }

      mockSessionManager.getSession = vi.fn().mockReturnValue(mockSessionData)
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isSessionExpiring).toBe(true)
      expect(result.current.sessionTimeoutWarning).toBe(true)
    })

    it('セッションをリフレッシュできる', async () => {
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const fetchSpy = vi.spyOn(sessionApi, 'fetchSession')
      fetchSpy.mockClear()

      await act(async () => {
        await result.current.refreshSession()
      })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('有効期限までの残り時間を計算できる', async () => {
      const futureTime = Date.now() + 30 * 60 * 1000 // 30分後
      const mockSessionData = {
        user: mockEmployee,
        createdAt: new Date(),
        expiresAt: new Date(futureTime),
      }

      mockSessionManager.getSession = vi.fn().mockReturnValue(mockSessionData)
      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const timeRemaining = result.current.timeUntilExpiry
      expect(timeRemaining).toBeDefined()
      expect(timeRemaining).toBeGreaterThan(29 * 60 * 1000)
      expect(timeRemaining).toBeLessThanOrEqual(30 * 60 * 1000)
    })
  })

  describe('セッション変更リスナー', () => {
    it('SessionManagerのセッション変更を検知する', async () => {
      const mockCallback = vi.fn()
      mockSessionManager.onSessionChange = vi.fn((callback: (sessionData: EmployeeSummary | null) => void) => {
        mockCallback.mockImplementation(callback)
        return () => {
          // cleanup
        }
      })

      vi.spyOn(sessionApi, 'fetchSession').mockResolvedValue(mockSessionResponse)

      renderHook(() => useAuth(), { wrapper: createWrapper })

      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockSessionManager.onSessionChange).toHaveBeenCalled()
      })

      // セッション変更をシミュレート
      const newSessionData = {
        user: mockEmployee,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      }

      act(() => {
        mockCallback(newSessionData)
      })

      // コンテキストが更新されることを確認
      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(newSessionData)
      })
    })
  })
})