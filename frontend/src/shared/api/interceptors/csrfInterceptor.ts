import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
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
  responseError?: (error: AxiosError) => Promise<AxiosResponse>;
};

// Store CSRF token in memory for cross-origin scenarios
let csrfToken: string | null = null;

const CSRF_RETRY_FLAG = Symbol("csrfRetryAttempted");

export function createCsrfInterceptor(
  options: CsrfInterceptorOptions = {}
): CsrfInterceptor {
  const {
    cookieName = "XSRF-TOKEN",
    headerName = "X-XSRF-TOKEN",
    skipGET = false,
  } = options;

  const headerNameLowerCase = headerName.toLowerCase();

  const resolveRefreshUrl = (baseURL?: string): string => {
    if (!baseURL) {
      return "/api/auth/session";
    }

    const normalizedBase = baseURL.endsWith("/")
      ? baseURL.slice(0, -1)
      : baseURL;
    return `${normalizedBase}/auth/session`;
  };

  return {
    request: (
      config: InternalAxiosRequestConfig
    ): InternalAxiosRequestConfig => {
      const typedConfig = config as InternalAxiosRequestConfig & {
        [CSRF_RETRY_FLAG]?: boolean;
      };
      const forceOverride = Boolean(typedConfig[CSRF_RETRY_FLAG]);

      // Skip CSRF token for GET requests if configured
      if (skipGET && config.method?.toUpperCase() === "GET") {
        return config;
      }

      if (forceOverride && config.headers) {
        const headers = config.headers as Record<string, unknown> & {
          delete?: (name: string) => void;
        };
        if (typeof headers.delete === "function") {
          headers.delete(headerName);
        }
        delete headers[headerName];
        delete headers[headerNameLowerCase];
      }

      // Don't override existing header unless forced (retry case)
      if (!forceOverride && config.headers && config.headers[headerName]) {
        return config;
      }

      const cookieToken = Cookies.get(cookieName);

      // Keep in-memory token in sync with latest cookie value
      if (!csrfToken && cookieToken) {
        csrfToken = cookieToken;
      }

      // Prefer in-memory token (latest from server header), fall back to cookie
      const token = csrfToken ?? cookieToken;

      // Add token to headers if it exists
      if (token) {
        if (!config.headers) {
          config.headers = {};
        }

        const headers = config.headers as Record<string, unknown> & {
          set?: (name: string, value: string) => void;
        };
        headers[headerName] = token;
        headers[headerNameLowerCase] = token;
        if (typeof headers.set === "function") {
          headers.set(headerName, token);
        }
      }

      return config;
    },

    response: (response: AxiosResponse): AxiosResponse => {
      // Extract CSRF token from response header for cross-origin scenarios
      const tokenFromHeader = response.headers[headerNameLowerCase];
      if (tokenFromHeader && typeof tokenFromHeader === "string") {
        csrfToken = tokenFromHeader;
      }

      const responseConfig = response.config as InternalAxiosRequestConfig & {
        [CSRF_RETRY_FLAG]?: boolean;
      };
      if (responseConfig && responseConfig[CSRF_RETRY_FLAG]) {
        delete responseConfig[CSRF_RETRY_FLAG];
      }
      return response;
    },

    responseError: async (error) => {
      const { response, config } = error;

      if (!(response && config)) {
        throw error;
      }

      if (response.status !== 403) {
        throw error;
      }

      const messageCandidate = (() => {
        if (typeof response.data === "string") {
          return response.data;
        }
        if (response.data && typeof response.data === "object") {
          const maybeMessage = (response.data as { message?: unknown }).message;
          return typeof maybeMessage === "string" ? maybeMessage : undefined;
        }
        return;
      })();

      if (!messageCandidate?.toLowerCase().includes("csrf")) {
        throw error;
      }

      const typedConfig = config as InternalAxiosRequestConfig & {
        [CSRF_RETRY_FLAG]?: boolean;
      };

      if (typedConfig[CSRF_RETRY_FLAG]) {
        throw error;
      }

      typedConfig[CSRF_RETRY_FLAG] = true;

      try {
        const refreshResponse = await axios.get(
          resolveRefreshUrl(config.baseURL),
          {
            withCredentials: true,
          }
        );

        const refreshedToken = refreshResponse.headers?.[headerNameLowerCase];
        if (typeof refreshedToken === "string") {
          csrfToken = refreshedToken;
        }
      } catch (_refreshError) {
        throw error;
      }

      return axios.request(config).then((result) => {
        const retryConfig = result.config as InternalAxiosRequestConfig & {
          [CSRF_RETRY_FLAG]?: boolean;
        };
        if (retryConfig && retryConfig[CSRF_RETRY_FLAG]) {
          delete retryConfig[CSRF_RETRY_FLAG];
        }
        return result;
      });
    },

    requestError: (error: Error): never => {
      // Simply re-throw the error
      throw error;
    },
  };
}

// Create default interceptor instance
export const defaultCsrfInterceptor = createCsrfInterceptor();

export const getStoredCsrfToken = (): string | null => csrfToken;

export const __resetCsrfTokenForTests = (): void => {
  csrfToken = null;
};
