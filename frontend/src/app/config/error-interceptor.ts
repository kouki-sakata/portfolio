import type { QueryCache } from '@tanstack/react-query'

import type { HttpClientError } from '@/shared/api/httpClient'

/**
 * エラーインターセプター設定
 */
export interface ErrorInterceptorConfig {
  /** ログアウト処理 */
  onLogout: () => Promise<void>
  /** リダイレクト処理 */
  onRedirect: (path: string) => void
  /** ログインページのパス */
  loginPath?: string
}

/**
 * HTTPエラーかどうか判定
 */
const isHttpError = (error: unknown): error is HttpClientError => {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof (error as HttpClientError).status === 'number'
  )
}

/**
 * 401エラーハンドリング
 * 未認証エラー時に自動ログアウト・リダイレクトを実行
 */
export const handle401Error = async (
  error: unknown,
  config: ErrorInterceptorConfig
): Promise<void> => {
  if (!isHttpError(error)) return

  if (error.status === 401) {
    // 401エラーの場合、自動ログアウト
    console.warn('Unauthorized access detected. Logging out...')

    try {
      // ログアウト処理を実行
      await config.onLogout()
    } catch (logoutError) {
      console.error('Logout failed during 401 handling:', logoutError)
    }

    // ログインページへリダイレクト
    const loginPath = config.loginPath ?? '/auth/signin'
    config.onRedirect(loginPath)
  }
}

/**
 * グローバルエラーハンドラー作成
 * QueryClientのonErrorに設定する関数を生成
 */
export const createGlobalErrorHandler = (
  config: ErrorInterceptorConfig
): ((error: unknown) => void) => {
  return (error: unknown) => {
    // 401エラーの処理
    void handle401Error(error, config)

    // その他のエラー処理
    if (isHttpError(error)) {
      switch (error.status) {
        case 403:
          console.error('Access forbidden:', error.message)
          break
        case 404:
          console.error('Resource not found:', error.message)
          break
        case 500:
        case 502:
        case 503:
        case 504:
          console.error('Server error:', error.message)
          break
        default:
          console.error(`HTTP Error ${error.status.toString()}:`, error.message)
      }
    } else {
      console.error('Unexpected error:', error)
    }
  }
}

/**
 * QueryCacheエラーハンドラー設定
 * React Queryのキャッシュレベルでエラーを捕捉
 */
export const createQueryCacheErrorHandler = (
  config: ErrorInterceptorConfig
): QueryCache => {
  return {
    onError: (error: unknown) => {
      void handle401Error(error, config)
    },
  } as QueryCache
}