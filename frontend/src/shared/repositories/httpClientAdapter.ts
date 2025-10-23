import type { AxiosRequestConfig, RawAxiosRequestHeaders } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { ApiError } from "@/shared/api/errors/ApiError";
import type {
  HttpRequestOptions,
  IHttpClient,
  JsonHttpRequestOptions,
  NoParseHttpRequestOptions,
  RepositoryError,
} from "./types";

const REPOSITORY_ERROR_CODES = [
  "NETWORK_ERROR",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "UNAUTHORIZED",
  "UNKNOWN",
] as const;

type RepositoryErrorCode = (typeof REPOSITORY_ERROR_CODES)[number];

const isRepositoryErrorCode = (value: unknown): value is RepositoryErrorCode =>
  typeof value === "string" &&
  REPOSITORY_ERROR_CODES.includes(value as RepositoryErrorCode);

/**
 * HTTPエラーの型定義
 */
const normalizeHeaders = (
  headers?: HeadersInit
): RawAxiosRequestHeaders | undefined => {
  if (!headers) {
    return;
  }

  if (headers instanceof Headers) {
    const normalized: Record<string, string> = {};
    for (const [key, value] of headers.entries()) {
      normalized[key] = value;
    }
    return normalized as RawAxiosRequestHeaders;
  }

  if (Array.isArray(headers)) {
    const normalized: Record<string, string> = {};
    for (const [key, value] of headers) {
      normalized[key] = value;
    }
    return normalized as RawAxiosRequestHeaders;
  }

  // Record<string, string> などはそのまま流用
  return headers as RawAxiosRequestHeaders;
};

const mapHttpOptionsToAxiosConfig = (
  options?: HttpRequestOptions
): AxiosRequestConfig => {
  if (!options) {
    return {};
  }

  const config: AxiosRequestConfig = {
    headers: normalizeHeaders(options.headers),
    signal: options.signal,
  };

  if (options.credentials !== undefined) {
    config.withCredentials = options.credentials === "include";
  }

  return config;
};

/**
 * HttpClientAdapter
 * 既存のhttpClientをIHttpClientインターフェースに適合させるアダプター
 * Adapter Patternの実装
 */
export const createHttpClientAdapter = (): IHttpClient => {
  const buildRepositoryError = (error: ApiError): RepositoryError => {
    const repoError = Object.assign(new Error(error.message), {
      code: isRepositoryErrorCode(error.code) ? error.code : "UNKNOWN",
      status: error.status,
      details: error.details,
    }) as RepositoryError;

    if (error.status === 0) {
      return { ...repoError, code: "NETWORK_ERROR" } as RepositoryError;
    }

    if (error.status === 401 || error.status === 403) {
      return { ...repoError, code: "UNAUTHORIZED" } as RepositoryError;
    }

    if (error.status === 404) {
      return { ...repoError, code: "NOT_FOUND" } as RepositoryError;
    }

    if (error.status === 422) {
      return { ...repoError, code: "VALIDATION_ERROR" } as RepositoryError;
    }

    if (error.status >= 500) {
      return { ...repoError, code: "NETWORK_ERROR" } as RepositoryError;
    }

    return repoError;
  };

  const handleUnexpectedError = (error: unknown): RepositoryError =>
    Object.assign(new Error("An unexpected error occurred"), {
      code: "UNKNOWN" as RepositoryErrorCode,
      details: error,
    }) as RepositoryError;

  const handleError = (error: unknown): never => {
    if (error instanceof ApiError) {
      throw buildRepositoryError(error);
    }

    throw handleUnexpectedError(error);
  };

  /**
   * GET リクエストを実行し、レスポンスを返す
   *
   * @remarks
   * parseJson オプションで戻り値の型が変わる:
   * - parseJson: true (デフォルト): T を返す
   * - parseJson: false: void を返す (レスポンスボディを解析しない)
   *
   * @note
   * 将来的には satisfies または Overload条件付き型でキャストの削減を検討。
   * 現在はアサーションで型安全性を保証しており、テストで parseJson: false
   * の動作を検証することが重要。
   */
  const get = (async <T>(
    path: string,
    options?: HttpRequestOptions
  ): Promise<T | undefined> => {
    try {
      const config = mapHttpOptionsToAxiosConfig(options);
      const response = await apiClient.get<T>(path, config);
      const shouldParse = options?.parseJson !== false;
      if (!shouldParse) {
        return;
      }
      return response.data as T;
    } catch (error) {
      return handleError(error);
    }
  }) as {
    <T>(path: string, options?: JsonHttpRequestOptions): Promise<T>;
    (path: string, options: NoParseHttpRequestOptions): Promise<void>;
  };

  /**
   * POST リクエストを実行し、レスポンスを返す
   *
   * @remarks
   * parseJson オプションで戻り値の型が変わる:
   * - parseJson: true (デフォルト): T を返す
   * - parseJson: false: void を返す (レスポンスボディを解析しない)
   *
   * @note
   * 将来的には satisfies または Overload条件付き型でキャストの削減を検討。
   * 現在はアサーションで型安全性を保証しており、テストで parseJson: false
   * の動作を検証することが重要。
   */
  const post = (async <T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T | undefined> => {
    try {
      const config = mapHttpOptionsToAxiosConfig(options);
      const response = await apiClient.post<T>(path, body, config);
      const shouldParse = options?.parseJson !== false;
      if (!shouldParse) {
        return;
      }
      return response.data as T;
    } catch (error) {
      return handleError(error);
    }
  }) as {
    <T>(
      path: string,
      body?: unknown,
      options?: JsonHttpRequestOptions
    ): Promise<T>;
    (
      path: string,
      body: unknown,
      options: NoParseHttpRequestOptions
    ): Promise<void>;
  };

  /**
   * PUT リクエストを実行し、レスポンスを返す
   *
   * @remarks
   * parseJson オプションで戻り値の型が変わる:
   * - parseJson: true (デフォルト): T を返す
   * - parseJson: false: void を返す (レスポンスボディを解析しない)
   *
   * @note
   * 将来的には satisfies または Overload条件付き型でキャストの削減を検討。
   * 現在はアサーションで型安全性を保証しており、テストで parseJson: false
   * の動作を検証することが重要。
   */
  const put = (async <T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T | undefined> => {
    try {
      const config = mapHttpOptionsToAxiosConfig(options);
      const response = await apiClient.put<T>(path, body, config);
      const shouldParse = options?.parseJson !== false;
      if (!shouldParse) {
        return;
      }
      return response.data as T;
    } catch (error) {
      return handleError(error);
    }
  }) as {
    <T>(
      path: string,
      body?: unknown,
      options?: JsonHttpRequestOptions
    ): Promise<T>;
    (
      path: string,
      body: unknown,
      options: NoParseHttpRequestOptions
    ): Promise<void>;
  };

  const patch = (async <T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T | undefined> => {
    try {
      const config = mapHttpOptionsToAxiosConfig(options);
      const response = await apiClient.patch<T>(path, body, config);
      const shouldParse = options?.parseJson !== false;
      if (!shouldParse) {
        return;
      }
      return response.data as T;
    } catch (error) {
      return handleError(error);
    }
  }) as {
    <T>(
      path: string,
      body?: unknown,
      options?: JsonHttpRequestOptions
    ): Promise<T>;
    (
      path: string,
      body: unknown,
      options: NoParseHttpRequestOptions
    ): Promise<void>;
  };

  const deleteMethod = (async <T>(
    path: string,
    options?: HttpRequestOptions
  ): Promise<T | undefined> => {
    try {
      const config = mapHttpOptionsToAxiosConfig(options);
      const response = await apiClient.delete<T>(path, config);
      const shouldParse = options?.parseJson !== false;
      if (!shouldParse) {
        return;
      }
      return response.data as T;
    } catch (error) {
      return handleError(error);
    }
  }) as {
    <T>(path: string, options?: JsonHttpRequestOptions): Promise<T>;
    (path: string, options: NoParseHttpRequestOptions): Promise<void>;
  };

  return {
    get,
    post,
    put,
    patch,
    delete: deleteMethod,
  };
};

/**
 * デフォルトのHttpClientアダプターインスタンス
 */
export const defaultHttpClient = createHttpClientAdapter();
