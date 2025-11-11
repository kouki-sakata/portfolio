import { calculateMonthlySummary } from "@/features/stampHistory/lib/summary";
import type {
  CreateStampRequest,
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
  employeeId: entry.employeeId ?? null,
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
  isNightShift:
    (
      entry as StampHistoryApiResponse["entries"][number] & {
        isNightShift?: boolean | null;
      }
    ).isNightShift ?? null,
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

export const createStamp = async (
  payload: CreateStampRequest
): Promise<void> => {
  const { employeeId, year, month, day, inTime, outTime, breakStartTime, breakEndTime, isNightShift } = payload;

  const data: {
    employeeId: number;
    year: string;
    month: string;
    day: string;
    inTime?: string;
    outTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
    isNightShift?: boolean;
  } = {
    employeeId,
    year,
    month,
    day,
  };

  // 出勤・退勤時刻は値がある場合のみ送信
  if (inTime !== undefined && inTime.length > 0) {
    data.inTime = inTime;
  }
  if (outTime !== undefined && outTime.length > 0) {
    data.outTime = outTime;
  }
  if (breakStartTime !== undefined && breakStartTime.length > 0) {
    data.breakStartTime = breakStartTime;
  }
  if (breakEndTime !== undefined && breakEndTime.length > 0) {
    data.breakEndTime = breakEndTime;
  }
  if (isNightShift !== undefined) {
    data.isNightShift = isNightShift;
  }

  try {
    await api.post<void>("/stamps", data);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateStamp = async (
  payload: UpdateStampRequest
): Promise<void> => {
  const { id, inTime, outTime, breakStartTime, breakEndTime, isNightShift } = payload;

  const data: {
    inTime?: string;
    outTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
    isNightShift?: boolean;
  } = {};

  // 出勤・退勤時刻は値がある場合のみ送信
  if (inTime !== undefined && inTime.length > 0) {
    data.inTime = inTime;
  }
  if (outTime !== undefined && outTime.length > 0) {
    data.outTime = outTime;
  }
  // 休憩時間は空文字列も送信（削除を表す）
  if (breakStartTime !== undefined) {
    data.breakStartTime = breakStartTime;
  }
  if (breakEndTime !== undefined) {
    data.breakEndTime = breakEndTime;
  }
  if (isNightShift !== undefined) {
    data.isNightShift = isNightShift;
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
