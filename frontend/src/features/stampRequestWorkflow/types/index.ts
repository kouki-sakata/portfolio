export type StampRequestStatus =
  | "NONE"
  | "NEW"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type StampRequestListItem = {
  id: number;
  stampHistoryId: number;
  dateLabel: string;
  status: StampRequestStatus;
  reason: string;
  submittedAt: string;
  submittedTimestamp: number;
  employeeName?: string | null;
  requestedInTime?: string | null;
  requestedOutTime?: string | null;
  requestedBreakStartTime?: string | null;
  requestedBreakEndTime?: string | null;
  approvalNote?: string | null;
  rejectionReason?: string | null;
  unread?: boolean;
};

export type StampRequestListResponse = {
  requests: StampRequestListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

export type StampRequestCreatePayload = {
  stampHistoryId: number;
  requestedInTime?: string | null;
  requestedOutTime?: string | null;
  requestedBreakStartTime?: string | null;
  requestedBreakEndTime?: string | null;
  requestedIsNightShift?: boolean;
  reason: string;
};

export type StampRequestCancelPayload = {
  requestId: number;
  reason: string;
};
