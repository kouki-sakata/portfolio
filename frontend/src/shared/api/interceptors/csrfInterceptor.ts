import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

export type CsrfInterceptorOptions = {
  cookieName?: string;
  headerName?: string;
  skipGET?: boolean;
};

export type CsrfInterceptor = {
  request: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  requestError: (error: Error) => never;
  response: (response: AxiosResponse) => AxiosResponse;
};

// Store CSRF token in memory for cross-origin scenarios
let csrfToken: string | null = null;

export function createCsrfInterceptor(
  options: CsrfInterceptorOptions = {}
): CsrfInterceptor {
  const {
    cookieName = "XSRF-TOKEN",
    headerName = "X-XSRF-TOKEN",
    skipGET = false,
  } = options;

  return {
    request: (
      config: InternalAxiosRequestConfig
    ): InternalAxiosRequestConfig => {
      // Skip CSRF token for GET requests if configured
      if (skipGET && config.method?.toUpperCase() === "GET") {
        return config;
      }

      // Don't override existing header
      if (config.headers[headerName]) {
        return config;
      }

      // Try to get CSRF token from cookie (same-origin) or memory (cross-origin)
      const token = Cookies.get(cookieName) || csrfToken;

      // Add token to headers if it exists
      if (token) {
        config.headers[headerName] = token;
      }

      return config;
    },

    response: (response: AxiosResponse): AxiosResponse => {
      // Extract CSRF token from response header for cross-origin scenarios
      const tokenFromHeader = response.headers[headerName.toLowerCase()];
      if (tokenFromHeader && typeof tokenFromHeader === "string") {
        csrfToken = tokenFromHeader;
      }
      return response;
    },

    requestError: (error: Error): never => {
      // Simply re-throw the error
      throw error;
    },
  };
}

// Create default interceptor instance
export const defaultCsrfInterceptor = createCsrfInterceptor();
