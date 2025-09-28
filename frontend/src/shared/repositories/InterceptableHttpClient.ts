import type { IHttpClient, HttpRequestOptions } from './types'

/**
 * インターセプター型定義
 */
export interface RequestInterceptor {
  onRequest?: (path: string, options: HttpRequestOptions) => Promise<HttpRequestOptions> | HttpRequestOptions
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: T) => Promise<T> | T
  onError?: (error: unknown) => Promise<never> | never
}

/**
 * インターセプター対応HTTPクライアント
 * Open/Closed Principle: 拡張に対して開かれている
 */
export class InterceptableHttpClient implements IHttpClient {
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []

  constructor(private readonly baseClient: IHttpClient) {}

  /**
   * リクエストインターセプターを追加
   */
  useRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor)
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor)
      if (index >= 0) {
        this.requestInterceptors.splice(index, 1)
      }
    }
  }

  /**
   * レスポンスインターセプターを追加
   */
  useResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor)
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor)
      if (index >= 0) {
        this.responseInterceptors.splice(index, 1)
      }
    }
  }

  /**
   * リクエスト前処理
   */
  private async processRequest(
    path: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpRequestOptions> {
    let processedOptions = { ...options }

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        processedOptions = await interceptor.onRequest(path, processedOptions)
      }
    }

    return processedOptions
  }

  /**
   * レスポンス後処理
   */
  private async processResponse<T>(response: Promise<T>): Promise<T> {
    try {
      let result = await response

      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onResponse) {
          result = await interceptor.onResponse(result)
        }
      }

      return result
    } catch (error) {
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onError) {
          try {
            await interceptor.onError(error)
          } catch (handledError) {
            throw handledError
          }
        }
      }
      throw error
    }
  }

  async get<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    const processedOptions = await this.processRequest(path, options)
    return this.processResponse(this.baseClient.get<T>(path, processedOptions))
  }

  async post<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    const processedOptions = await this.processRequest(path, options)
    return this.processResponse(this.baseClient.post<T>(path, body, processedOptions))
  }

  async put<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    const processedOptions = await this.processRequest(path, options)
    return this.processResponse(this.baseClient.put<T>(path, body, processedOptions))
  }

  async patch<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    const processedOptions = await this.processRequest(path, options)
    return this.processResponse(this.baseClient.patch<T>(path, body, processedOptions))
  }

  async delete<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    const processedOptions = await this.processRequest(path, options)
    return this.processResponse(this.baseClient.delete<T>(path, processedOptions))
  }
}

/**
 * ロギングインターセプターの例
 */
export const createLoggingInterceptor = (): RequestInterceptor & ResponseInterceptor => ({
  onRequest: (path, options) => {
    console.log(`[HTTP Request] ${options.headers ? 'with headers' : ''} ${path}`)
    return options
  },
  onResponse: (response) => {
    console.log('[HTTP Response]', response)
    return response
  },
  onError: (error) => {
    console.error('[HTTP Error]', error)
    throw error
  },
})

/**
 * 認証インターセプターの例
 */
export const createAuthInterceptor = (getToken: () => string | null): RequestInterceptor => ({
  onRequest: (path, options) => {
    const token = getToken()
    if (token && !path.includes('/auth/login')) {
      return {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      }
    }
    return options
  },
})