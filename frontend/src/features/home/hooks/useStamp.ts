import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  createHomeRepository,
  type IHomeRepository,
} from "@/features/home/repositories/HomeRepository";
import type { StampRequest, StampResponse } from "@/features/home/types";

const HOME_DASHBOARD_KEY = ["home", "dashboard"] as const;

/**
 * 打刻用カスタムフック
 * Single Responsibility: 打刻ロジックのみを管理
 */
export const useStamp = (
  repository: IHomeRepository = createHomeRepository()
) => {
  const queryClient = useQueryClient();
  const [messageState, setMessageState] = useState<{
    message: string;
    status: "success" | "error";
  } | null>(null);

  const stampMutation = useMutation<StampResponse, Error, StampRequest>({
    mutationFn: (request: StampRequest) => repository.submitStamp(request),
    onSuccess: (response: StampResponse) => {
      setMessageState({
        message: response.message,
        status: response.success ? "success" : "error",
      });
      queryClient
        .invalidateQueries({ queryKey: HOME_DASHBOARD_KEY })
        .catch(() => {
          // エラーハンドリングは不要（キャッシュ無効化の失敗は次回フェッチで解決）
        });
    },
    onError: () => {
      setMessageState({
        message: "打刻に失敗しました。再度お試しください。",
        status: "error",
      });
    },
  });

  const handleStamp = useCallback(
    async (type: "1" | "2", nightWork: boolean) => {
      setMessageState(null);
      const timestamp = new Date().toISOString().slice(0, 19);

      await stampMutation.mutateAsync({
        stampType: type,
        stampTime: timestamp,
        nightWorkFlag: nightWork ? "1" : "0",
      });
    },
    [stampMutation]
  );

  const clearMessage = useCallback(() => {
    setMessageState(null);
  }, []);

  return {
    handleStamp,
    isLoading: stampMutation.isPending,
    message: messageState?.message ?? null,
    messageStatus: messageState?.status ?? null,
    clearMessage,
  };
};
