import type { InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

export type CsrfInterceptorOptions = {
  cookieName?: string;
  headerName?: string;
  skipGET?: boolean;
};

export type CsrfInterceptor = {
  request: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  requestError: (error: Error) => never;
};

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

      // Get CSRF token from cookie
      const token = Cookies.get(cookieName);

      // Add token to headers if it exists
      if (token) {
        config.headers[headerName] = token;
      }

      return config;
    },

    requestError: (error: Error): never => {
      // Simply re-throw the error
      throw error;
    },
  };
}

// Create default interceptor instance
export const defaultCsrfInterceptor = createCsrfInterceptor();
