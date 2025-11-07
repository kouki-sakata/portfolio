import { calculateMonthlySummary } from "@/features/stampHistory/lib/summary";
import type {
  DeleteStampRequest,
  StampHistoryEntry,
  StampHistoryResponse,
  UpdateStampRequest,
} from "@/features/stampHistory/types";
import { api } from "@/shared/api/axiosClient";
import { ApiError } from "@/shared/api/errors/ApiError";
import { AuthorizationError } from "@/shared/api/errors/AuthorizationError";
import type { StampHistoryResponse as StampHistoryApiResponse } from "@/types";

type StampHistoryQuery = {
  year?: string;
  month?: string;
};

const mapEntry = (
  entry: StampHistoryApiResponse["entries"][number]
): StampHistoryEntry => ({
  id: entry.id ?? null,
  year: entry.year ?? null,
  month: entry.month ?? null,
  day: entry.day ?? null,
  dayOfWeek: entry.dayOfWeek ?? null,
  inTime: entry.inTime ?? null,
  outTime: entry.outTime ?? null,
  breakStartTime:
    (
      entry as StampHistoryApiResponse["entries"][number] & {
        breakStartTime?: string | null;
      }
    ).breakStartTime ?? null,
  breakEndTime:
    (
      entry as StampHistoryApiResponse["entries"][number] & {
        breakEndTime?: string | null;
      }
    ).breakEndTime ?? null,
  overtimeMinutes:
    (
      entry as StampHistoryApiResponse["entries"][number] & {
        overtimeMinutes?: number | null;
      }
    ).overtimeMinutes ?? null,
  updateDate: entry.updateDate ?? null,
});

const mapResponse = (
  response: StampHistoryApiResponse
): StampHistoryResponse => {
  const entries = response.entries.map(mapEntry);
  return {
    selectedYear: response.selectedYear,
    selectedMonth: response.selectedMonth,
    years: response.years,
    months: response.months,
    entries,
    summary: calculateMonthlySummary(entries),
  };
};

const toAuthorizationError = (error: ApiError): AuthorizationError => {
  const details = error.details as
    | { requiredRole?: string; currentRole?: string }
    | undefined;

  const requiredRole =
    typeof details?.requiredRole === "string"
      ? details.requiredRole
      : undefined;
  const currentRole =
    typeof details?.currentRole === "string" ? details.currentRole : undefined;

  return new AuthorizationError(error.message, requiredRole, currentRole);
};

const handleApiError = (error: unknown): never => {
  if (error instanceof AuthorizationError) {
    throw error;
  }

  if (error instanceof ApiError) {
    if (error.status === 403) {
      throw toAuthorizationError(error);
    }
    throw error;
  }

  throw error;
};

export const fetchStampHistory = async (
  query?: StampHistoryQuery
): Promise<StampHistoryResponse> => {
  try {
    const response = await api.get<StampHistoryApiResponse>(
      "/stamp-history",
      query ? { params: query } : undefined
    );
    return mapResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateStamp = async (
  payload: UpdateStampRequest
): Promise<void> => {
  const { id, inTime, outTime } = payload;

  const data: Partial<Record<"inTime" | "outTime", string>> = {};
  if (inTime && inTime.length > 0) {
    data.inTime = inTime;
  }
  if (outTime && outTime.length > 0) {
    data.outTime = outTime;
  }

  try {
    await api.put<void>(`/stamps/${id}`, data);
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteStamp = async (
  payload: DeleteStampRequest
): Promise<void> => {
  try {
    await api.delete<void>(`/stamps/${payload.id}`);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateStampsBatch = async (
  updates: UpdateStampRequest[]
): Promise<void> => {
  for (const update of updates) {
    await updateStamp(update);
  }
};

export const deleteStampsBatch = async (ids: number[]): Promise<void> => {
  for (const id of ids) {
    await deleteStamp({ id });
  }
};
