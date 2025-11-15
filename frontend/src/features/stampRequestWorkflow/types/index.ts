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
  originalInTime?: string | null;
  originalOutTime?: string | null;
  originalBreakStartTime?: string | null;
  originalBreakEndTime?: string | null;
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

export type PendingRequestFilters = {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
  sort?: string;
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

export type StampRequestApprovalPayload = {
  requestId: number;
  approvalNote?: string | null;
};

export type StampRequestRejectionPayload = {
  requestId: number;
  rejectionReason: string;
};

export type StampRequestBulkPayload = {
  requestIds: number[];
  approvalNote?: string | null;
  rejectionReason?: string;
};

export type StampRequestBulkOperationResult = {
  successCount: number;
  failureCount: number;
  failedRequestIds: number[];
};
