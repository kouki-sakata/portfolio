import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type QueryClient,
} from "@tanstack/react-query";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { toast } from "@/hooks/use-toast";
import * as api from "@/features/stampRequestWorkflow/api/stampRequestApi";
import type {
  StampRequestCancelPayload,
  StampRequestCreatePayload,
  StampRequestListResponse,
} from "@/features/stampRequestWorkflow/types";
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
};

const invalidateWorkflowCaches = async (queryClient: QueryClient) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: stampRequestQueryKeys.root }),
    queryClient.invalidateQueries({ queryKey: queryKeys.stampHistory.all }),
  ]);
};

export const useMyStampRequestsQuery = (params: MyRequestFilters) =>
  useQuery<StampRequestListResponse>({
    queryKey: stampRequestQueryKeys.my(params),
    queryFn: () => api.fetchMyRequests(params),
    staleTime: QUERY_CONFIG.stampRequests.staleTime,
    gcTime: QUERY_CONFIG.stampRequests.gcTime,
  });

export const useCreateStampRequestMutation = (): UseMutationResult<
  unknown,
  unknown,
  StampRequestCreatePayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StampRequestCreatePayload) =>
      api.createStampRequest(payload),
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
      api.cancelStampRequest(payload),
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
