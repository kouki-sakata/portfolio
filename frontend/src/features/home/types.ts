import type { EmployeeSummary } from "@/features/auth/types";
import type { NewsResponse } from "@/types";

export type AttendanceStatus =
  | "NOT_ATTENDED"
  | "WORKING"
  | "ON_BREAK"
  | "FINISHED";

export type DailyAttendanceSnapshot = {
  status: AttendanceStatus;
  attendanceTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  departureTime: string | null;
  overtimeMinutes: number;
};

export type HomeNewsItem = Pick<
  NewsResponse,
  | "id"
  | "title"
  | "content"
  | "label"
  | "newsDate"
  | "releaseFlag"
  | "updateDate"
>;

export type HomeDashboardResponse = {
  employee: EmployeeSummary;
  news: HomeNewsItem[];
  attendance: DailyAttendanceSnapshot | null;
};

export type StampRequest = {
  stampType: "1" | "2";
  stampTime: string;
  nightWorkFlag: "0" | "1";
};

export type StampResponse = {
  message: string;
  success?: boolean;
};
