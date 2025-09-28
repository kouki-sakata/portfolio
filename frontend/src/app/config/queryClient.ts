import { QueryCache,QueryClient } from '@tanstack/react-query'

import { createGlobalErrorHandler } from '@/app/config/error-interceptor'

/**
 * QueryClient設定を作成
 * エラーインターセプターは後から設定される
 */
let globalErrorHandler: ((error: unknown) => void) | undefined

const createQueryClient = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (globalErrorHandler) {
          globalErrorHandler(error)
        }
      },
    }),
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
  globalErrorHandler = createGlobalErrorHandler({
    onLogout: logout,
    onRedirect: redirect,
    loginPath: '/auth/signin',
  })
}
