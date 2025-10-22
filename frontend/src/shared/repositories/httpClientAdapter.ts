import type { AxiosRequestConfig } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { ApiError } from "@/shared/api/errors/ApiError";
import type { HttpRequestOptions, IHttpClient, RepositoryError } from "./types";

/**
 * HTTPエラーの型定義
 */
const mapHttpOptionsToAxiosConfig = (
  options?: HttpRequestOptions
): AxiosRequestConfig => {
  if (!options) {
    return {};
  }

  const config: AxiosRequestConfig = {
    headers: options.headers,
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
  const handleError = (error: unknown): never => {
    const repoError = new Error("HTTP request failed") as RepositoryError;

    if (error instanceof ApiError) {
      repoError.message = error.message;
      repoError.status = error.status;
      repoError.details = error.details;

      switch (error.status) {
        case 0:
          repoError.code = "NETWORK_ERROR";
          break;
        case 401:
        case 403:
          repoError.code = "UNAUTHORIZED";
          break;
        case 404:
          repoError.code = "NOT_FOUND";
          break;
        case 422:
          repoError.code = "VALIDATION_ERROR";
          break;
        default:
          repoError.code =
            error.status >= 500 ? "NETWORK_ERROR" : "VALIDATION_ERROR";
      }
    } else {
      repoError.code = "UNKNOWN";
      repoError.message = "An unexpected error occurred";
      repoError.details = error;
    }

    throw repoError;
  };

  return {
    async get<T>(path: string, options?: HttpRequestOptions): Promise<T> {
      try {
        const config = mapHttpOptionsToAxiosConfig(options);
        const response = await apiClient.get<T>(path, config);
        return options?.parseJson === false
          ? (undefined as T)
          : (response.data as T);
      } catch (error) {
        return handleError(error);
      }
    },

    async post<T>(
      path: string,
      body?: unknown,
      options?: HttpRequestOptions
    ): Promise<T> {
      try {
        const config = mapHttpOptionsToAxiosConfig(options);
        const response = await apiClient.post<T>(path, body, config);
        return options?.parseJson === false
          ? (undefined as T)
          : (response.data as T);
      } catch (error) {
        return handleError(error);
      }
    },

    async put<T>(
      path: string,
      body?: unknown,
      options?: HttpRequestOptions
    ): Promise<T> {
      try {
        const config = mapHttpOptionsToAxiosConfig(options);
        const response = await apiClient.put<T>(path, body, config);
        return options?.parseJson === false
          ? (undefined as T)
          : (response.data as T);
      } catch (error) {
        return handleError(error);
      }
    },

    async patch<T>(
      path: string,
      body?: unknown,
      options?: HttpRequestOptions
    ): Promise<T> {
      try {
        const config = mapHttpOptionsToAxiosConfig(options);
        const response = await apiClient.patch<T>(path, body, config);
        return options?.parseJson === false
          ? (undefined as T)
          : (response.data as T);
      } catch (error) {
        return handleError(error);
      }
    },

    async delete<T>(path: string, options?: HttpRequestOptions): Promise<T> {
      try {
        const config = mapHttpOptionsToAxiosConfig(options);
        const response = await apiClient.delete<T>(path, config);
        return options?.parseJson === false
          ? (undefined as T)
          : (response.data as T);
      } catch (error) {
        return handleError(error);
      }
    },
  };
};

/**
 * デフォルトのHttpClientアダプターインスタンス
 */
export const defaultHttpClient = createHttpClientAdapter();
