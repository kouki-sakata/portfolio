import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CreateAxiosDefaults,
} from "axios";
import { getEnv } from "@/shared/lib/env";
import { createCsrfInterceptor } from "./interceptors/csrfInterceptor";
import { createErrorInterceptor } from "./interceptors/errorInterceptor";

// Custom configuration options for interceptors
export type CustomApiOptions = {
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
};

// Options for creating an API client instance
export interface ApiClientOptions
  extends CreateAxiosDefaults,
    CustomApiOptions {}

// Options for API request methods (convenience methods)
export interface ApiRequestOptions
  extends AxiosRequestConfig,
    CustomApiOptions {}

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
    // Register response interceptor to extract CSRF token from headers
    if (csrfInterceptor.responseError) {
      instance.interceptors.response.use(
        csrfInterceptor.response,
        csrfInterceptor.responseError
      );
    } else {
      instance.interceptors.response.use(
        csrfInterceptor.response,
        undefined
      );
    }
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

// Helper function to extract custom options from request config
function extractCustomOptions(config?: ApiRequestOptions): {
  customOptions: CustomApiOptions;
  axiosConfig?: AxiosRequestConfig;
} {
  if (!config) {
    return { customOptions: {} };
  }

  const {
    skipCsrfToken,
    skipErrorInterceptor,
    csrfOptions,
    errorOptions,
    ...axiosConfig
  } = config;

  return {
    customOptions: {
      skipCsrfToken,
      skipErrorInterceptor,
      csrfOptions,
      errorOptions,
    },
    axiosConfig,
  };
}

// Create and export a default instance
export const apiClient = createApiClient();

// Export convenience methods that return data directly
export const api = {
  get: async <T = unknown>(url: string, config?: ApiRequestOptions) => {
    const { axiosConfig } = extractCustomOptions(config);
    const response = await apiClient.get<T>(url, axiosConfig);
    return response.data;
  },

  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: ApiRequestOptions
  ) => {
    const { axiosConfig } = extractCustomOptions(config);
    const response = await apiClient.post<T>(url, data, axiosConfig);
    return response.data;
  },

  put: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: ApiRequestOptions
  ) => {
    const { axiosConfig } = extractCustomOptions(config);
    const response = await apiClient.put<T>(url, data, axiosConfig);
    return response.data;
  },

  patch: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: ApiRequestOptions
  ) => {
    const { axiosConfig } = extractCustomOptions(config);
    const response = await apiClient.patch<T>(url, data, axiosConfig);
    return response.data;
  },

  delete: async <T = unknown>(url: string, config?: ApiRequestOptions) => {
    const { axiosConfig } = extractCustomOptions(config);
    const response = await apiClient.delete<T>(url, axiosConfig);
    return response.data;
  },
};
