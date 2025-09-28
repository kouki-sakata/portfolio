import { httpClient } from '@/shared/api/httpClient'
import type { IHttpClient, HttpRequestOptions, RepositoryError } from './types'

/**
 * HttpClientAdapter
 * 既存のhttpClientをIHttpClientインターフェースに適合させるアダプター
 * Adapter Patternの実装
 */
export const createHttpClientAdapter = (): IHttpClient => {
  const handleError = (error: unknown): never => {
    const repoError = new Error() as RepositoryError

    if (error instanceof Error && 'status' in error) {
      const httpError = error as any
      repoError.message = httpError.message
      repoError.status = httpError.status
      repoError.details = httpError.payload

      switch (httpError.status) {
        case 404:
          repoError.code = 'NOT_FOUND'
          break
        case 401:
        case 403:
          repoError.code = 'UNAUTHORIZED'
          break
        default:
          repoError.code = httpError.status >= 500 ? 'NETWORK_ERROR' : 'VALIDATION_ERROR'
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