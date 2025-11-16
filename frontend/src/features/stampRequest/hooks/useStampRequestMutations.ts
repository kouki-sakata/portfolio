import {
  useApproveRequestMutation,
  useBulkApproveRequestsMutation,
  useBulkRejectRequestsMutation,
  useCancelStampRequestMutation,
  useCreateStampRequestMutation,
  useMyStampRequestsQuery,
  usePendingStampRequestsQuery,
  useRejectRequestMutation,
} from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import type {
  MyRequestFilters,
  PendingRequestFilters,
} from "@/features/stampRequestWorkflow/types";

const defaultMyRequestFilters: MyRequestFilters = {
  status: "PENDING",
  page: 0,
  pageSize: 10,
  search: "",
  sort: "submittedTimestamp,DESC",
};

const defaultPendingRequestFilters: PendingRequestFilters = {
  page: 0,
  pageSize: 10,
  status: "PENDING",
  search: "",
  sort: "submittedTimestamp,DESC",
};

export const useMyRequests = (overrides: Partial<MyRequestFilters> = {}) =>
  useMyStampRequestsQuery({
    ...defaultMyRequestFilters,
    ...overrides,
  });

export const usePendingRequests = (
  overrides: Partial<PendingRequestFilters> = {}
) =>
  usePendingStampRequestsQuery({
    ...defaultPendingRequestFilters,
    ...overrides,
  });

export const useCreateStampRequest = useCreateStampRequestMutation;
export const useCancelRequest = useCancelStampRequestMutation;
export const useApproveRequest = useApproveRequestMutation;
export const useRejectRequest = useRejectRequestMutation;
export const useBulkApproveRequests = useBulkApproveRequestsMutation;
export const useBulkRejectRequests = useBulkRejectRequestsMutation;
