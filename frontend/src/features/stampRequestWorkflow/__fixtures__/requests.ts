import type { StampHistoryEntry } from "@/features/stampHistory/types";
import type {
  StampRequestListItem,
  StampRequestListResponse,
} from "@/features/stampRequestWorkflow/types";

export const mockStampHistoryEntry: StampHistoryEntry = {
  id: 45,
  employeeId: 99,
  year: "2025",
  month: "11",
  day: "07",
  dayOfWeek: "FRI",
  inTime: "09:00",
  outTime: "18:10",
  breakStartTime: "12:00",
  breakEndTime: "13:00",
  overtimeMinutes: 70,
  isNightShift: false,
  updateDate: "2025/11/08 09:23",
  requestStatus: "NONE",
  requestId: null,
};

export const mockStampRequestItem: StampRequestListItem = {
  id: 101,
  stampHistoryId: 45,
  dateLabel: "2025/11/07",
  status: "PENDING",
  reason: "家族の急用で退勤が遅れたため修正が必要です。",
  createdAt: "2025-11-07T19:05:05+09:00",
  submittedTimestamp: 1_762_522_305_000, // 2025-11-07 19:05:05 JST
  employeeName: "田中 太郎",
  requestedInTime: "2025-11-07T09:00:00+09:00",
  requestedOutTime: "2025-11-07T18:30:00+09:00",
  requestedBreakStartTime: "2025-11-07T12:10:00+09:00",
  requestedBreakEndTime: "2025-11-07T13:05:00+09:00",
  approvalNote: null,
  rejectionReason: null,
  unread: true,
};

export const mockStampRequestList: StampRequestListResponse = {
  requests: [
    mockStampRequestItem,
    {
      ...mockStampRequestItem,
      id: 102,
      stampHistoryId: 46,
      status: "APPROVED",
      unread: false,
      reason:
        "交通遅延で出勤時間がズレたため修正をお願いします（証明書添付済み）。",
      createdAt: "2025-11-06T08:45:00+09:00",
      submittedTimestamp: 1_699_277_100_000,
    },
  ],
  totalCount: 2,
  pageNumber: 0,
  pageSize: 20,
};
