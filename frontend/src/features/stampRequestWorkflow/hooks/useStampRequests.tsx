import {
  type QueryClient,
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import {
  approveRequest,
  bulkApproveRequests,
  bulkRejectRequests,
  cancelStampRequest,
  createStampRequest,
  fetchMyRequests,
  fetchPendingRequests,
  rejectRequest,
} from "@/features/stampRequestWorkflow/api/stampRequestApi";
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
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "@/shared/utils/queryUtils";

export type MyRequestFilters = {
  status: string;
  page: number;
  pageSize: number;
  search: string;
  sort: string;
};

export const stampRequestQueryKeys = {
  root: queryKeys.stampRequests.all,
  my: (params: MyRequestFilters) => queryKeys.stampRequests.my(params),
  pending: (params: PendingRequestFilters) =>
    queryKeys.stampRequests.pending(params),
};

const invalidateWorkflowCaches = async (queryClient: QueryClient) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: stampRequestQueryKeys.root }),
    queryClient.invalidateQueries({ queryKey: queryKeys.stampHistory.all }),
  ]);
};

export const useMyStampRequestsQuery = (params: MyRequestFilters, enabled = true) =>
  useQuery<StampRequestListResponse>({
    queryKey: stampRequestQueryKeys.my(params),
    queryFn: () => fetchMyRequests(params),
    staleTime: QUERY_CONFIG.stampRequests.staleTime,
    gcTime: QUERY_CONFIG.stampRequests.gcTime,
    enabled,
  });

export const usePendingStampRequestsQuery = (params: PendingRequestFilters, enabled = true) =>
  useQuery<StampRequestListResponse>({
    queryKey: stampRequestQueryKeys.pending(params),
    queryFn: () => fetchPendingRequests(params),
    staleTime: QUERY_CONFIG.stampRequests.staleTime,
    gcTime: QUERY_CONFIG.stampRequests.gcTime,
    enabled,
  });

export const useCreateStampRequestMutation = (): UseMutationResult<
  unknown,
  unknown,
  StampRequestCreatePayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StampRequestCreatePayload) =>
      createStampRequest(payload),
    onSuccess: async () => {
      toast({
        title: "リクエストを送信しました",
        description: "管理者による承認をお待ちください。",
      });
      await invalidateWorkflowCaches(queryClient);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "時間を空けて再度お試しください。";
      toast({
        title: "リクエスト送信に失敗しました",
        description: message,
        variant: "destructive",
      });
    },
  });
};

export const useCancelStampRequestMutation = (): UseMutationResult<
  void,
  unknown,
  StampRequestCancelPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StampRequestCancelPayload) =>
      cancelStampRequest(payload),
    onSuccess: async () => {
      toast({
        title: "申請を取り消しました",
        description: "ステータスと打刻履歴を更新しました。",
      });
      await invalidateWorkflowCaches(queryClient);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "申請の取り消しに失敗しました。";
      toast({
        title: "取消に失敗しました",
        description: message,
        variant: "destructive",
      });
    },
  });
};

export const useApproveRequestMutation = (): UseMutationResult<
  void,
  unknown,
  StampRequestApprovalPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StampRequestApprovalPayload) =>
      approveRequest(payload),
    onSuccess: async () => {
      toast({
        title: "承認しました",
        description: "選択した申請を承認しました。",
      });
      await invalidateWorkflowCaches(queryClient);
    },
  });
};

export const useRejectRequestMutation = (): UseMutationResult<
  void,
  unknown,
  StampRequestRejectionPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StampRequestRejectionPayload) =>
      rejectRequest(payload),
    onSuccess: async () => {
      toast({
        title: "却下しました",
        description: "理由を添えて却下を完了しました。",
      });
      await invalidateWorkflowCaches(queryClient);
    },
  });
};

const mutationSuccessToast = (
  title: string,
  result: StampRequestBulkOperationResult
) => {
  toast({
    title,
    description: `${result.successCount}件処理しました`,
  });
  if (result.failureCount > 0) {
    toast({
      title: "一部の申請の処理に失敗しました",
      description: `${result.failureCount}件が失敗しました`,
      variant: "destructive",
    });
  }
};

export const useBulkApproveRequestsMutation = (): UseMutationResult<
  StampRequestBulkOperationResult,
  unknown,
  StampRequestBulkPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StampRequestBulkPayload) =>
      bulkApproveRequests(payload),
    onSuccess: async (result) => {
      mutationSuccessToast("一括承認が完了しました", result);
      await invalidateWorkflowCaches(queryClient);
    },
    onError: () => {
      toast({
        title: "一括承認に失敗しました",
        description: "時間を空けて再度お試しください。",
        variant: "destructive",
      });
    },
  });
};

export const useBulkRejectRequestsMutation = (): UseMutationResult<
  StampRequestBulkOperationResult,
  unknown,
  StampRequestBulkPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StampRequestBulkPayload) =>
      bulkRejectRequests(payload),
    onSuccess: async (result) => {
      mutationSuccessToast("一括却下が完了しました", result);
      await invalidateWorkflowCaches(queryClient);
    },
    onError: () => {
      toast({
        title: "一括却下に失敗しました",
        description: "操作を完了できませんでした。",
        variant: "destructive",
      });
    },
  });
};
