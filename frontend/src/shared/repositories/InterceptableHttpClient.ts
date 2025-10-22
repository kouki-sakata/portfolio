import type {
  HttpRequestOptions,
  IHttpClient,
  JsonHttpRequestOptions,
  NoParseHttpRequestOptions,
} from "./types";

const isNoParseOptions = (
  options: HttpRequestOptions
): options is NoParseHttpRequestOptions => options.parseJson === false;

/**
 * インターセプター型定義
 */
export type RequestInterceptor = {
  onRequest?: (
    path: string,
    options: HttpRequestOptions
  ) => Promise<HttpRequestOptions> | HttpRequestOptions;
};

export type ResponseInterceptor = {
  onResponse?: <T>(response: T) => Promise<T> | T;
  onError?: (error: unknown) => Promise<never> | never;
};

/**
 * インターセプター対応HTTPクライアント
 * Open/Closed Principle: 拡張に対して開かれている
 */
export class InterceptableHttpClient implements IHttpClient {
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly baseClient: IHttpClient;

  constructor(baseClient: IHttpClient) {
    this.baseClient = baseClient;
  }

  /**
   * リクエストインターセプターを追加
   */
  useRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index >= 0) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * レスポンスインターセプターを追加
   */
  useResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index >= 0) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * リクエスト前処理
   */
  private async processRequest(
    path: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpRequestOptions> {
    let processedOptions = { ...options };

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        processedOptions = await interceptor.onRequest(path, processedOptions);
      }
    }

    return processedOptions;
  }

  /**
   * レスポンス後処理
   */
  private async processResponse<T>(response: Promise<T>): Promise<T> {
    try {
      let result = await response;

      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onResponse) {
          result = await interceptor.onResponse(result);
        }
      }

      return result;
    } catch (error) {
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onError) {
          await interceptor.onError(error);
        }
      }
      throw error;
    }
  }

  async get<T>(path: string, options?: JsonHttpRequestOptions): Promise<T>;
  async get(path: string, options: NoParseHttpRequestOptions): Promise<void>;
  async get<T>(
    path: string,
    options?: HttpRequestOptions
  ): Promise<T | undefined> {
    const processedOptions = await this.processRequest(path, options);
    if (isNoParseOptions(processedOptions)) {
      await this.processResponse(this.baseClient.get(path, processedOptions));
      return;
    }

    return this.processResponse(
      this.baseClient.get(path, processedOptions as JsonHttpRequestOptions)
    );
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: JsonHttpRequestOptions
  ): Promise<T>;
  async post(
    path: string,
    body: unknown,
    options: NoParseHttpRequestOptions
  ): Promise<void>;
  async post<T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T | undefined> {
    const processedOptions = await this.processRequest(path, options);
    if (isNoParseOptions(processedOptions)) {
      await this.processResponse(
        this.baseClient.post(path, body, processedOptions)
      );
      return;
    }

    return this.processResponse(
      this.baseClient.post(
        path,
        body,
        processedOptions as JsonHttpRequestOptions
      )
    );
  }

  async put<T>(
    path: string,
    body?: unknown,
    options?: JsonHttpRequestOptions
  ): Promise<T>;
  async put(
    path: string,
    body: unknown,
    options: NoParseHttpRequestOptions
  ): Promise<void>;
  async put<T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T | undefined> {
    const processedOptions = await this.processRequest(path, options);
    if (isNoParseOptions(processedOptions)) {
      await this.processResponse(
        this.baseClient.put(path, body, processedOptions)
      );
      return;
    }

    return this.processResponse(
      this.baseClient.put(
        path,
        body,
        processedOptions as JsonHttpRequestOptions
      )
    );
  }

  async patch<T>(
    path: string,
    body?: unknown,
    options?: JsonHttpRequestOptions
  ): Promise<T>;
  async patch(
    path: string,
    body: unknown,
    options: NoParseHttpRequestOptions
  ): Promise<void>;
  async patch<T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T | undefined> {
    const processedOptions = await this.processRequest(path, options);
    if (isNoParseOptions(processedOptions)) {
      await this.processResponse(
        this.baseClient.patch(path, body, processedOptions)
      );
      return;
    }

    return this.processResponse(
      this.baseClient.patch(
        path,
        body,
        processedOptions as JsonHttpRequestOptions
      )
    );
  }

  async delete<T>(path: string, options?: JsonHttpRequestOptions): Promise<T>;
  async delete(path: string, options: NoParseHttpRequestOptions): Promise<void>;
  async delete<T>(
    path: string,
    options?: HttpRequestOptions
  ): Promise<T | undefined> {
    const processedOptions = await this.processRequest(path, options);
    if (isNoParseOptions(processedOptions)) {
      await this.processResponse(
        this.baseClient.delete(path, processedOptions)
      );
      return;
    }

    return this.processResponse(
      this.baseClient.delete(path, processedOptions as JsonHttpRequestOptions)
    );
  }
}

/**
 * ロギングインターセプターの例
 */
export const createLoggingInterceptor = (): RequestInterceptor &
  ResponseInterceptor => ({
  onRequest: (_path, options) => options,
  onResponse: (response) => response,
  onError: (error) => {
    throw error;
  },
});

/**
 * 認証インターセプターの例
 */
export const createAuthInterceptor = (
  getToken: () => string | null
): RequestInterceptor => ({
  onRequest: (path, options) => {
    const token = getToken();
    if (token && !path.includes("/auth/login")) {
      // Handle different HeadersInit types
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${token}`);

      return {
        ...options,
        headers,
      };
    }
    return options;
  },
});
