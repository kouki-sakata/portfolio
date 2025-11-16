import type {
  PendingRequestFilters,
  StampRequestApprovalPayload,
  StampRequestBulkOperationResult,
  StampRequestBulkPayload,
  StampRequestCancelPayload,
  StampRequestCreatePayload,
  StampRequestListResponse,
  StampRequestRejectionPayload,
} from "@/features/stampRequestWorkflow/types";
import { api } from "@/shared/api/axiosClient";

const ENDPOINT = "/stamp-requests" as const;

export type MyRequestQuery = {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
};

export const createStampRequest = (payload: StampRequestCreatePayload) =>
  api.post(`${ENDPOINT}`, payload);

export const fetchMyRequests = (
  params: MyRequestQuery
): Promise<StampRequestListResponse> => {
  const { status, page, pageSize, search, sort } = params;
  return api.get<StampRequestListResponse>(`${ENDPOINT}/my-requests`, {
    params: {
      status: status && status !== "ALL" ? status : undefined,
      page,
      size: pageSize,
      search,
      sort,
    },
  });
};

export const cancelStampRequest = ({
  requestId,
  reason,
}: StampRequestCancelPayload) =>
  api.post<void>(`${ENDPOINT}/${requestId}/cancel`, {
    cancellationReason: reason,
  });

export const fetchPendingRequests = (
  params: PendingRequestFilters
): Promise<StampRequestListResponse> => {
  const { status, page, pageSize, search, sort } = params;
  return api.get<StampRequestListResponse>(`${ENDPOINT}/pending`, {
    params: {
      status: status && status !== "ALL" ? status : undefined,
      page,
      size: pageSize,
      search,
      sort,
    },
  });
};

export const approveRequest = ({
  requestId,
  approvalNote,
}: StampRequestApprovalPayload) =>
  api.post<void>(`${ENDPOINT}/${requestId}/approve`, {
    approvalNote:
      approvalNote && approvalNote.length > 0 ? approvalNote : undefined,
  });

export const rejectRequest = ({
  requestId,
  rejectionReason,
}: StampRequestRejectionPayload) =>
  api.post<void>(`${ENDPOINT}/${requestId}/reject`, {
    rejectionReason,
  });

export const bulkApproveRequests = ({
  requestIds,
  approvalNote,
}: StampRequestBulkPayload): Promise<StampRequestBulkOperationResult> =>
  api.post<StampRequestBulkOperationResult>(`${ENDPOINT}/bulk/approve`, {
    requestIds,
    approvalNote,
  });

export const bulkRejectRequests = ({
  requestIds,
  rejectionReason,
}: StampRequestBulkPayload): Promise<StampRequestBulkOperationResult> =>
  api.post<StampRequestBulkOperationResult>(`${ENDPOINT}/bulk/reject`, {
    requestIds,
    rejectionReason,
  });
