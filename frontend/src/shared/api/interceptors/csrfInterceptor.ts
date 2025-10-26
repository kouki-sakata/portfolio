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

      if (shouldSkipRequest(config, skipGET)) {
        return config;
      }

      const headers = ensureMutableHeaders(config);

      if (forceOverride) {
        clearCsrfHeaders(headers, headerName, headerNameLowerCase);
      } else if (hasExistingCsrfHeader(headers, headerName)) {
        return config;
      }

      const token = resolveCsrfToken(cookieName);
      if (!token) {
        return config;
      }

      applyCsrfHeader(headers, headerName, headerNameLowerCase, token);
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
      if (responseConfig?.[CSRF_RETRY_FLAG]) {
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
        if (retryConfig?.[CSRF_RETRY_FLAG]) {
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

const shouldSkipRequest = (
  config: InternalAxiosRequestConfig,
  skipGET: boolean
) => skipGET && config.method?.toUpperCase() === "GET";

const ensureMutableHeaders = (config: InternalAxiosRequestConfig) => {
  if (!config.headers) {
    config.headers = new (require("axios").AxiosHeaders)();
  }
  return config.headers as Record<string, unknown> & {
    set?: (name: string, value: string) => void;
    delete?: (name: string) => void;
  };
};

const clearCsrfHeaders = (
  headers: Record<string, unknown> & {
    delete?: (name: string) => void;
  },
  headerName: string,
  headerNameLowerCase: string
) => {
  if (typeof headers.delete === "function") {
    headers.delete(headerName);
  }
  delete headers[headerName];
  delete headers[headerNameLowerCase];
};

const hasExistingCsrfHeader = (
  headers: Record<string, unknown>,
  headerName: string
) => Boolean(headers[headerName]);

const resolveCsrfToken = (cookieName: string): string | null => {
  const cookieToken = Cookies.get(cookieName) ?? null;

  if (cookieToken && cookieToken !== csrfToken) {
    csrfToken = cookieToken;
  }

  if (!(cookieToken || csrfToken)) {
    return null;
  }

  return csrfToken ?? cookieToken;
};

const applyCsrfHeader = (
  headers: Record<string, unknown> & {
    set?: (name: string, value: string) => void;
  },
  headerName: string,
  headerNameLowerCase: string,
  token: string
) => {
  headers[headerName] = token;
  headers[headerNameLowerCase] = token;
  if (typeof headers.set === "function") {
    headers.set(headerName, token);
  }
};

// Create default interceptor instance
export const defaultCsrfInterceptor = createCsrfInterceptor();

export const getStoredCsrfToken = (): string | null => csrfToken;

export const __resetCsrfTokenForTests = (): void => {
  csrfToken = null;
};
