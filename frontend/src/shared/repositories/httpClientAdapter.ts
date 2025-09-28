import { httpClient } from '@/shared/api/httpClient'

import type { HttpRequestOptions, IHttpClient, RepositoryError } from './types'

/**
 * HTTPエラーの型定義
 */
interface HttpError extends Error {
  status: number
  message: string
  payload?: unknown
}

/**
 * Type guard for HttpError
 */
const isHttpError = (error: unknown): error is HttpError => {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof (error as HttpError).status === 'number'
  )
}

/**
 * HttpClientAdapter
 * 既存のhttpClientをIHttpClientインターフェースに適合させるアダプター
 * Adapter Patternの実装
 */
export const createHttpClientAdapter = (): IHttpClient => {
  const handleError = (error: unknown): never => {
    const repoError = new Error() as RepositoryError

    if (isHttpError(error)) {
      repoError.message = error.message
      repoError.status = error.status
      repoError.details = error.payload

      switch (error.status) {
        case 404:
          repoError.code = 'NOT_FOUND'
          break
        case 401:
        case 403:
          repoError.code = 'UNAUTHORIZED'
          break
        default:
          repoError.code = error.status >= 500 ? 'NETWORK_ERROR' : 'VALIDATION_ERROR'
      }
    } else {
      repoError.code = 'UNKNOWN'
      repoError.message = 'An unexpected error occurred'
      repoError.details = error
    }

    throw repoError
  }

  return {
    async get<T>(path: string, options?: HttpRequestOptions): Promise<T> {
      try {
        return await httpClient<T>(path, {
          method: 'GET',
          ...options,
        })
      } catch (error) {
        return handleError(error)
      }
    },

    async post<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
      try {
        return await httpClient<T>(path, {
          method: 'POST',
          body: body ? JSON.stringify(body) : undefined,
          ...options,
        })
      } catch (error) {
        return handleError(error)
      }
    },

    async put<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
      try {
        return await httpClient<T>(path, {
          method: 'PUT',
          body: body ? JSON.stringify(body) : undefined,
          ...options,
        })
      } catch (error) {
        return handleError(error)
      }
    },

    async patch<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
      try {
        return await httpClient<T>(path, {
          method: 'PATCH',
          body: body ? JSON.stringify(body) : undefined,
          ...options,
        })
      } catch (error) {
        return handleError(error)
      }
    },

    async delete<T>(path: string, options?: HttpRequestOptions): Promise<T> {
      try {
        return await httpClient<T>(path, {
          method: 'DELETE',
          ...options,
        })
      } catch (error) {
        return handleError(error)
      }
    },
  }
}

/**
 * デフォルトのHttpClientアダプターインスタンス
 */
export const defaultHttpClient = createHttpClientAdapter()