import { api } from "@/shared/api/axiosClient";
import { ApiError } from "@/shared/api/errors/ApiError";
import { getEnv } from "@/shared/lib/env";

import type {
  LogExportFilters,
  LogExportFormat,
  LogSearchFilters,
  LogSearchResponse,
} from "../types";

const DEFAULT_PAGE_SIZE = 50;

const joinValues = (
  values?: readonly (string | number)[]
): string | undefined => {
  if (!values || values.length === 0) {
    return;
  }

  const normalized = values
    .map((value) => (typeof value === "string" ? value.trim() : String(value)))
    .filter((value) => value.length > 0);

  return normalized.length > 0 ? normalized.join(",") : undefined;
};

const buildSearchParams = (
  filters?: LogSearchFilters | LogExportFilters
): Record<string, string | number | boolean> | undefined => {
  if (!filters) {
    return;
  }

  const params: Record<string, string | number | boolean> = {};

  if (filters.keyword?.trim()) {
    params.keyword = filters.keyword.trim();
  }

  const levels = joinValues(filters.levels);
  if (levels) {
    params.levels = levels;
  }

  const employeeIds = joinValues(filters.employeeIds);
  if (employeeIds) {
    params.employeeIds = employeeIds;
  }

  const operations = joinValues(filters.operationTypes);
  if (operations) {
    params.operations = operations;
  }

  if (filters.dateRange?.from) {
    params.from = filters.dateRange.from;
  }

  if (filters.dateRange?.to) {
    params.to = filters.dateRange.to;
  }

  if (typeof filters.hasErrors === "boolean") {
    params.hasErrors = filters.hasErrors;
  }

  const ipAddresses = joinValues(filters.ipAddresses);
  if (ipAddresses) {
    params.ipAddresses = ipAddresses;
  }

  if (typeof filters.page === "number") {
    params.page = filters.page;
  }

  if (typeof filters.pageSize === "number") {
    params.size = filters.pageSize;
  }

  if (filters.sort?.trim()) {
    params.sort = filters.sort;
  }

  if ((filters as LogExportFilters).format) {
    params.format = (filters as LogExportFilters).format as LogExportFormat;
  }

  return Object.keys(params).length > 0 ? params : undefined;
};

const resolveApiUrl = (path: string): string => {
  const { apiBaseUrl } = getEnv();
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  if (/^https?:/i.test(apiBaseUrl)) {
    const base = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
    return new URL(normalizedPath, base).toString();
  }

  const origin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "http://localhost";

  const base = apiBaseUrl.startsWith("/")
    ? apiBaseUrl.slice(1)
    : apiBaseUrl;
  const baseWithSlash = base.length > 0 ? `${base}/` : "";

  return new URL(`${baseWithSlash}${normalizedPath}`, origin).toString();
};

const buildQueryString = (
  params?: Record<string, string | number | boolean>
): string => {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  return searchParams.toString();
};

const resolveAcceptHeader = (format: LogExportFormat | undefined): string => {
  if (format === "json") {
    return "application/json";
  }
  return "text/csv";
};

export const searchLogs = async (
  filters?: LogSearchFilters
): Promise<LogSearchResponse> => {
  const effectiveFilters: LogSearchFilters = {
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? DEFAULT_PAGE_SIZE,
    ...filters,
  };

  const params = buildSearchParams(effectiveFilters) ?? {
    page: 1,
    size: DEFAULT_PAGE_SIZE,
  };

  return api.get<LogSearchResponse>("/api/logs", { params });
};

export const exportLogs = async (
  filters?: LogExportFilters
): Promise<Blob> => {
  const params = buildSearchParams(filters);

  return api.get<Blob>("/api/logs/export", {
    params,
    responseType: "blob",
  });
};

export const streamLogExport = async (
  filters?: LogExportFilters
): Promise<ReadableStream<Uint8Array>> => {
  const params = buildSearchParams(filters);
  const query = buildQueryString(params);
  const url = resolveApiUrl("logs/export");
  const requestUrl = query ? `${url}?${query}` : url;
  const accept = resolveAcceptHeader(filters?.format);

  const response = await fetch(requestUrl, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: accept,
    },
  });

  if (!response.ok) {
    const message = response.statusText || "Failed to export logs";
    throw new ApiError(message, response.status);
  }

  if (!response.body) {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
  }

  return response.body as ReadableStream<Uint8Array>;
};
