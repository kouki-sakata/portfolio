import type { EmployeeSummary } from "@/features/auth/types";
import type {
  EmployeeListResponse,
  EmployeeUpsertInput,
} from "@/features/employees/types";
import { api } from "@/shared/api/axiosClient";
import { ApiError } from "@/shared/api/errors/ApiError";
import type { ErrorResponse } from "@/types";

export type EmployeeApiErrorResponse = ErrorResponse & {
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

export type EmployeeListQuery = {
  adminOnly?: boolean;
  page?: number;
  size?: number;
  search?: string;
};

const RETRYABLE_STATUS_CODES = new Set([0, 408, 425, 429, 500, 502, 503, 504]);
const DEFAULT_MAX_RETRIES = 3;

const buildListParams = (query?: EmployeeListQuery) => {
  if (!query) {
    return;
  }

  const params: Record<string, string | number | boolean> = {};

  if (typeof query.adminOnly === "boolean") {
    params.adminOnly = query.adminOnly;
  }
  if (typeof query.page === "number") {
    params.page = query.page;
  }
  if (typeof query.size === "number") {
    params.size = query.size;
  }
  if (typeof query.search === "string") {
    const trimmed = query.search.trim();
    if (trimmed.length > 0) {
      params.search = trimmed;
    }
  }

  return Object.keys(params).length > 0 ? params : undefined;
};

const isRetryableError = (error: unknown): error is ApiError =>
  error instanceof ApiError && RETRYABLE_STATUS_CODES.has(error.status);

const normalizeFieldErrors = (
  details?: Record<string, unknown>
): Record<string, string[]> | undefined => {
  if (!details) {
    return;
  }

  const aggregate: Record<string, string[]> = {};

  const addEntries = (source: Record<string, unknown>) => {
    for (const [field, value] of Object.entries(source)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        aggregate[field] = value.map((item) => String(item));
        continue;
      }

      if (typeof value === "string" && value.trim().length > 0) {
        aggregate[field] = [value];
      }
    }
  };

  addEntries(details);

  const nestedErrors = details.errors;
  if (nestedErrors && typeof nestedErrors === "object") {
    addEntries(nestedErrors as Record<string, unknown>);
  }

  const fieldErrors = details.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    addEntries(fieldErrors as Record<string, unknown>);
  }

  return Object.keys(aggregate).length > 0 ? aggregate : undefined;
};

const withRetry = async <T>(
  operation: () => Promise<T>,
  { maxAttempts = DEFAULT_MAX_RETRIES }: { maxAttempts?: number } = {}
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isRetryableError(error)) {
        throw error;
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Retry attempts exhausted");
};

const buildUpsertPayload = (
  payload: EmployeeUpsertInput & { password?: string }
): EmployeeUpsertInput & { password?: string } => {
  const normalized: EmployeeUpsertInput & { password?: string } = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    admin: payload.admin,
  };

  if (payload.password !== undefined && payload.password !== null) {
    normalized.password = payload.password;
  }

  return normalized;
};

export const toEmployeeApiErrorResponse = (
  error: ApiError
): EmployeeApiErrorResponse => ({
  message: error.message,
  details: error.details,
  code: error.code,
  fieldErrors: normalizeFieldErrors(error.details),
});

export const fetchEmployees = async (
  query?: EmployeeListQuery
): Promise<EmployeeListResponse> => {
  const params = buildListParams(query);

  return withRetry(() =>
    api.get<EmployeeListResponse>(
      "/api/employees",
      params ? { params } : undefined
    )
  );
};

export const createEmployee = async (
  payload: EmployeeUpsertInput & { password: string }
): Promise<EmployeeSummary> => {
  const data = buildUpsertPayload(payload);

  return api.post<EmployeeSummary>("/api/employees", { data });
};

export const updateEmployee = async (
  employeeId: number,
  payload: EmployeeUpsertInput & { password?: string }
): Promise<EmployeeSummary> => {
  const data = buildUpsertPayload(payload);

  return api.put<EmployeeSummary>(`/api/employees/${employeeId}`, { data });
};

export const deleteEmployee = async (ids: number | number[]): Promise<void> => {
  const normalizedIds = (Array.isArray(ids) ? ids : [ids]).map((id) => id);

  if (normalizedIds.length === 0) {
    return;
  }

  await withRetry(() =>
    api.delete<void>("/api/employees", {
      data: { ids: normalizedIds },
    })
  );
};
