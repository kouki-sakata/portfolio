import axios, { type AxiosInstance, type CreateAxiosDefaults } from "axios";
import { getEnv } from "@/shared/lib/env";
import { createCsrfInterceptor } from "./interceptors/csrfInterceptor";
import { createErrorInterceptor } from "./interceptors/errorInterceptor";

export interface ApiClientOptions extends CreateAxiosDefaults {
  skipCsrfToken?: boolean;
  skipErrorInterceptor?: boolean;
  csrfOptions?: {
    cookieName?: string;
    headerName?: string;
    skipGET?: boolean;
  };
  errorOptions?: {
    skipUnauthorizedEvent?: boolean;
    extractMessage?: (data: unknown) => string | undefined;
    extractCode?: (data: unknown) => string | undefined;
  };
}

export function createApiClient(options: ApiClientOptions = {}): AxiosInstance {
  const { apiBaseUrl } = getEnv();

  const {
    skipCsrfToken = false,
    skipErrorInterceptor = false,
    csrfOptions,
    errorOptions,
    ...axiosConfig
  } = options;

  const defaultConfig: CreateAxiosDefaults = {
    baseURL: apiBaseUrl,
    timeout: 30_000,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      // biome-ignore lint/style/useNamingConvention: HTTP header name
      Accept: "application/json",
    },
    ...axiosConfig,
  };

  // Merge headers properly
  if (axiosConfig?.headers) {
    defaultConfig.headers = {
      ...defaultConfig.headers,
      ...axiosConfig.headers,
    };
  }

  const instance = axios.create(defaultConfig);

  // Add CSRF token interceptor
  if (!skipCsrfToken) {
    const csrfInterceptor = createCsrfInterceptor(csrfOptions);
    instance.interceptors.request.use(
      csrfInterceptor.request,
      csrfInterceptor.requestError
    );
  }

  // Add error handling interceptor
  if (!skipErrorInterceptor) {
    const errorInterceptor = createErrorInterceptor(errorOptions);
    instance.interceptors.response.use(
      errorInterceptor.response,
      errorInterceptor.responseError
    );
  }

  return instance;
}

// Create and export a default instance
export const apiClient = createApiClient();

// Export convenience methods that return data directly
export const api = {
  get: async <T = unknown>(url: string, config?: ApiClientOptions) => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: ApiClientOptions
  ) => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  put: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: ApiClientOptions
  ) => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: ApiClientOptions
  ) => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T = unknown>(url: string, config?: ApiClientOptions) => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
};
