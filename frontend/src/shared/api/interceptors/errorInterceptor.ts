import type { AxiosError, AxiosResponse } from "axios";
import { ApiError } from "../errors/ApiError";
import { authEvents } from "../events/authEvents";

export type ErrorInterceptorOptions = {
  skipUnauthorizedEvent?: boolean;
  extractMessage?: (payload: unknown) => string | undefined;
  extractCode?: (payload: unknown) => string | undefined;
};

export type ErrorInterceptor = {
  response: (response: AxiosResponse) => AxiosResponse;
  responseError: (error: unknown) => Promise<never>;
};

function isAxiosError(error: unknown): error is AxiosError {
  return !!(
    error &&
    typeof error === "object" &&
    "isAxiosError" in error &&
    error.isAxiosError
  );
}

function extractErrorMessage(
  data: unknown,
  statusText: string,
  extractor?: (payload: unknown) => string | undefined
): string {
  if (extractor) {
    const extracted = extractor(data);
    if (extracted) {
      return extracted;
    }
  }

  // Try common error message patterns
  if (data && typeof data === "object") {
    if ("message" in data && typeof data.message === "string") {
      return data.message;
    }
    if ("error" in data && typeof data.error === "string") {
      return data.error;
    }
    if (
      "error_description" in data &&
      typeof data.error_description === "string"
    ) {
      return data.error_description;
    }
  }

  return statusText || "An error occurred";
}

function extractErrorCode(
  data: unknown,
  extractor?: (payload: unknown) => string | undefined
): string | undefined {
  if (extractor) {
    return extractor(data);
  }

  // Try common error code patterns
  if (data && typeof data === "object") {
    if ("code" in data && typeof data.code === "string") {
      return data.code;
    }
    if ("error_code" in data && typeof data.error_code === "string") {
      return data.error_code;
    }
  }

  return;
}

function extractErrorDetails(
  data: unknown
): Record<string, unknown> | undefined {
  if (data && typeof data === "object") {
    // Remove common top-level fields to get the details
    // biome-ignore lint/correctness/noUnusedVariables: extracting known fields
    const { message, error, error_description, code, error_code, ...details } =
      data as Record<string, unknown>;

    if (Object.keys(details).length > 0) {
      return details;
    }
  }

  return;
}

function handleTimeoutError(_error: AxiosError): never {
  throw new ApiError("Request timeout", 0, "TIMEOUT");
}

function handleNetworkError(error: AxiosError): never {
  if (error.message === "Network Error" || error.request) {
    throw new ApiError(
      error.message || "Network error occurred",
      0,
      "NETWORK_ERROR"
    );
  }
  throw new ApiError(
    error.message || "An unexpected error occurred",
    0,
    "UNKNOWN_ERROR"
  );
}

function handleResponseError(
  error: AxiosError,
  options: {
    skipUnauthorizedEvent: boolean;
    extractMessage?: (data: unknown) => string | undefined;
    extractCode?: (data: unknown) => string | undefined;
  }
): never {
  const { status, statusText, data } = error.response!;
  const { skipUnauthorizedEvent, extractMessage, extractCode } = options;

  const message = extractErrorMessage(data, statusText, extractMessage);
  const code = extractErrorCode(data, extractCode);
  const details = extractErrorDetails(data);

  // Emit unauthorized event for 401 errors
  if (status === 401 && !skipUnauthorizedEvent) {
    authEvents.emitUnauthorized(message);
  }

  // Emit forbidden event for 403 errors
  if (status === 403 && !skipUnauthorizedEvent) {
    authEvents.emitForbidden(message);
  }

  throw new ApiError(message, status, code, details);
}

export function createErrorInterceptor(
  options: ErrorInterceptorOptions = {}
): ErrorInterceptor {
  const {
    skipUnauthorizedEvent = false,
    extractMessage,
    extractCode,
  } = options;

  return {
    response: (response: AxiosResponse): AxiosResponse => {
      // Simply pass through successful responses
      return response;
    },

    responseError: async (error: unknown): Promise<never> => {
      // If it's not an Axios error, re-throw it
      if (!isAxiosError(error)) {
        throw error;
      }

      // Handle timeout errors
      if (error.code === "ECONNABORTED") {
        handleTimeoutError(error);
      }

      // Handle response errors
      if (error.response) {
        handleResponseError(error, {
          skipUnauthorizedEvent,
          extractMessage,
          extractCode,
        });
      }

      // Handle network errors (no response)
      handleNetworkError(error);
    },
  };
}

// Create default interceptor instance
export const defaultErrorInterceptor = createErrorInterceptor();
