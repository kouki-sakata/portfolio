import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import { AuthContext } from "@/features/auth/context/internal/AuthContext";
import type { EmployeeSummary } from "@/features/auth/types";
import type { EnhancedAuthContextValue } from "@/features/auth/types/auth-context.types";

// デフォルトのモックユーザー
const mockEmployee: EmployeeSummary = {
  id: 1,
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  admin: false,
};

// デフォルトのAuthContext値
const defaultAuthContextValue: EnhancedAuthContextValue = {
  // 基本認証状態
  user: mockEmployee,
  authenticated: true,
  loading: false,

  // 認証アクション
  login: vi.fn(),
  logout: vi.fn(),

  // セッション管理
  sessionInfo: {
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8時間後
    lastActivity: new Date(),
    warningThreshold: 15,
  },
  refreshSession: vi.fn(),
  isSessionExpiring: false,
  timeUntilExpiry: 8 * 60 * 60 * 1000, // 8時間
  sessionTimeoutWarning: false,

  // CSRF保護
  csrfToken: "test-csrf-token",
  refreshCsrfToken: vi.fn(),
};

export type TestAuthProviderProps = {
  children: ReactNode;
  authValue?: Partial<EnhancedAuthContextValue>;
  useMemoryRouter?: boolean;
};

/**
 * テスト用のAuthProvider
 * コンポーネントテストで使用するための最小限のAuthContextを提供
 */
export const TestAuthProvider = ({
  children,
  authValue = {},
  useMemoryRouter = false,
}: TestAuthProviderProps) => {
  const mergedAuthValue = {
    ...defaultAuthContextValue,
    ...authValue,
  };

  const Router = useMemoryRouter ? MemoryRouter : BrowserRouter;

  return (
    <Router>
      <AuthContext.Provider value={mergedAuthValue}>
        {children}
      </AuthContext.Provider>
    </Router>
  );
};

/**
 * React Query用のテストラッパー
 * より包括的なテストで使用
 */
export const TestQueryClientProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/**
 * 完全なテストラッパー（AuthProvider + QueryClient + Router）
 */
export type FullTestWrapperProps = {
  children: ReactNode;
  authValue?: Partial<EnhancedAuthContextValue>;
  useMemoryRouter?: boolean;
};

export const FullTestWrapper = ({
  children,
  authValue = {},
  useMemoryRouter = false,
}: FullTestWrapperProps) => (
  <TestQueryClientProvider>
    <TestAuthProvider authValue={authValue} useMemoryRouter={useMemoryRouter}>
      {children}
    </TestAuthProvider>
  </TestQueryClientProvider>
);

/**
 * 未認証状態のユーザー用テストヘルパー
 */
export const createUnauthenticatedAuthValue =
  (): Partial<EnhancedAuthContextValue> => ({
    user: null,
    authenticated: false,
    sessionInfo: null,
    isSessionExpiring: false,
    timeUntilExpiry: null,
    sessionTimeoutWarning: false,
  });

/**
 * 管理者ユーザー用テストヘルパー
 */
export const createAdminAuthValue = (): Partial<EnhancedAuthContextValue> => ({
  user: {
    ...mockEmployee,
    admin: true,
  },
});

/**
 * ローディング状態用テストヘルパー
 */
export const createLoadingAuthValue =
  (): Partial<EnhancedAuthContextValue> => ({
    loading: true,
    user: null,
    authenticated: false,
  });

/**
 * セッション期限警告状態用テストヘルパー
 */
export const createExpiringSessionAuthValue =
  (): Partial<EnhancedAuthContextValue> => ({
    isSessionExpiring: true,
    sessionTimeoutWarning: true,
    timeUntilExpiry: 10 * 60 * 1000, // 10分
    sessionInfo: {
      createdAt: new Date(Date.now() - 7.5 * 60 * 60 * 1000), // 7.5時間前に作成
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分後に期限切れ
      lastActivity: new Date(),
      warningThreshold: 15,
    },
  });
