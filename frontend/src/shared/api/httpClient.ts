import { getEnv } from "@/shared/lib/env";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpClientError extends Error {
  status: number;
  payload?: unknown;
}

interface HttpClientOptions extends Omit<RequestInit, "headers" | "method"> {
  headers?: HeadersInit;
  method?: HttpMethod;
  parseJson?: boolean;
}

const { apiBaseUrl } = getEnv();

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
};

const raiseError = async (response: Response): Promise<never> => {
  let payload: unknown;

  try {
    payload = await response.clone().json();
  } catch {
    // JSONパースに失敗した場合はテキストとして取得
    payload = await response.text().catch(() => {
      // テキスト取得も失敗した場合は空を返す
      return "";
    });
  }

  const httpError = new Error(response.statusText) as HttpClientError;
  httpError.status = response.status;
  httpError.payload = payload;
  throw httpError;
};

const getCsrfToken = () => {
  if (typeof document === "undefined") {
    return;
  }
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="));
  if (!token) {
    return;
  }
  return decodeURIComponent(token.split("=")[1] ?? "");
};

const buildHeaders = (
  headers: HeadersInit | undefined,
  body: BodyInit | null | undefined
) => {
  const merged = new Headers(headers);

  const shouldSetJsonContentType =
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams);

  if (shouldSetJsonContentType && !merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json");
  }

  if (!merged.has("X-XSRF-TOKEN")) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      merged.set("X-XSRF-TOKEN", csrfToken);
    }
  }

  return merged;
};

export const httpClient = async <T>(
  path: string,
  options: HttpClientOptions = {}
) => {
  const {
    parseJson = true,
    method,
    headers,
    credentials,
    body,
    ...requestInit
  } = options;

  const normalizedMethod = (method ?? "GET").toUpperCase() as HttpMethod;

  try {
    const response = await fetch(buildUrl(path), {
      ...requestInit,
      method: normalizedMethod,
      headers: buildHeaders(headers, body),
      credentials: credentials ?? "include",
      ...(body !== undefined ? { body } : {}),
    });

    if (!response.ok) {
      await raiseError(response);
    }

    if (!parseJson) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Handle network errors (fetch failures)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      const networkError = new Error("Network error") as HttpClientError;
      networkError.status = 0;
      networkError.payload = null;
      throw networkError;
    }
    // Re-throw other errors (including HttpClientError from raiseError)
    throw error;
  }
};
