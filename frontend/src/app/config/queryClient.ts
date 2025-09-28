import { QueryClient } from '@tanstack/react-query'

import { createGlobalErrorHandler } from '@/app/config/error-interceptor'

/**
 * QueryClient設定を作成
 * エラーインターセプターは後から設定される
 */
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export const queryClient = createQueryClient()

/**
 * エラーインターセプターを設定
 * AuthProviderから呼び出される
 */
export const configureQueryClientErrorHandler = (
  logout: () => Promise<void>,
  redirect: (path: string) => void
): void => {
  const errorHandler = createGlobalErrorHandler({
    onLogout: logout,
    onRedirect: redirect,
    loginPath: '/auth/signin',
  })

  // グローバルエラーハンドラーを設定
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      onError: errorHandler,
    },
    mutations: {
      ...queryClient.getDefaultOptions().mutations,
      onError: errorHandler,
    },
  })
}
