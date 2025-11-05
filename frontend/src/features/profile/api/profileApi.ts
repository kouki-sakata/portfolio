import { api } from "@/shared/api/axiosClient";

export type ProfileScheduleDto = {
  start: string;
  end: string;
  breakMinutes: number;
};

export type ProfileMetadataDto = {
  address: string;
  department: string;
  employeeNumber: string;
  activityNote: string;
  location: string;
  manager: string;
  workStyle: string;
  schedule: ProfileScheduleDto;
  status: string;
  joinedAt: string;
  avatarUrl: string;
};

export type ProfileEmployeeDto = {
  id: number;
  fullName: string;
  email: string;
  admin: boolean;
  updatedAt: string;
};

export type ProfileResponse = {
  employee: ProfileEmployeeDto;
  metadata: ProfileMetadataDto;
};

export type ProfileMetadataUpdatePayload = {
  address?: string;
  department?: string;
  employeeNumber?: string;
  activityNote?: string;
  location?: string;
  manager?: string;
  workStyle?: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  scheduleBreakMinutes?: number;
  status?: string;
  joinedAt?: string;
  avatarUrl?: string;
};

export type ProfileActivityItemDto = {
  id: string;
  occurredAt: string;
  actor: string;
  operationType: "VIEW" | "UPDATE" | string;
  summary: string;
  changedFields: string[];
  beforeSnapshot: Record<string, string | null>;
  afterSnapshot: Record<string, string | null>;
};

export type ProfileActivityResponse = {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  items: ProfileActivityItemDto[];
};

export type ProfileActivityQuery = {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
};

export const fetchProfile = async (): Promise<ProfileResponse> =>
  api.get<ProfileResponse>("/profile/me");

export const updateProfileMetadata = async (
  payload: ProfileMetadataUpdatePayload
): Promise<ProfileResponse> =>
  api.patch<ProfileResponse>("/profile/me/metadata", payload);

export const fetchProfileActivity = async (
  params: ProfileActivityQuery = {}
): Promise<ProfileActivityResponse> =>
  api.get<ProfileActivityResponse>("/profile/me/activity", { params });

export type MonthlyTrendDto = {
  month: string;
  totalHours: number;
  overtimeHours: number;
};

export type AttendanceSummaryDto = {
  currentMonth: {
    totalHours: number;
    overtimeHours: number;
    lateCount: number;
    paidLeaveHours: number;
  };
  trendData: MonthlyTrendDto[];
};

export type MonthlyAttendanceDto = {
  month: string;
  totalHours: number;
  overtimeHours: number;
  lateCount: number;
  paidLeaveHours: number;
};

export type ProfileStatisticsResponse = {
  summary: AttendanceSummaryDto;
  monthly: MonthlyAttendanceDto[];
};

export const fetchProfileStatistics = async (): Promise<ProfileStatisticsResponse> =>
  api.get<ProfileStatisticsResponse>("/profile/me/statistics");
