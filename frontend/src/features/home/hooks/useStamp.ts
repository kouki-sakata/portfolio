import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  createHomeRepository,
  type IHomeRepository,
} from "@/features/home/repositories/HomeRepository";
import type { StampRequest, StampResponse } from "@/features/home/types";
import { GlobalErrorHandler } from "@/shared/error-handling";

const HOME_DASHBOARD_KEY = ["home", "dashboard"] as const;

/**
 * 打刻用カスタムフック
 * Single Responsibility: 打刻ロジックのみを管理
 */
export const useStamp = (
  repository: IHomeRepository = createHomeRepository()
) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const stampMutation = useMutation<StampResponse, Error, StampRequest>({
    mutationFn: (request: StampRequest) => repository.submitStamp(request),
    onSuccess: (response: StampResponse) => {
      setMessage(response.message);
      queryClient
        .invalidateQueries({ queryKey: HOME_DASHBOARD_KEY })
        .catch(() => {
          // エラーハンドリングは不要（キャッシュ無効化の失敗は次回フェッチで解決）
        });
    },
    onError: () => {
      setMessage("打刻に失敗しました。再度お試しください。");
    },
  });

  const emitStampError = useCallback((error: unknown) => {
    if (!(error instanceof Error)) {
      return;
    }

    try {
      GlobalErrorHandler.getInstance().handle(error);
    } catch {
      if (!import.meta.env.PROD) {
        // biome-ignore lint/suspicious/noConsole: emit diagnostic info in non-production environments
        console.error("Failed to dispatch error to GlobalErrorHandler", error);
      }
    }
  }, []);

  const handleStamp = useCallback(
    async (type: "1" | "2", nightWork: boolean) => {
      setMessage(null);
      const timestamp = new Date().toISOString().slice(0, 19);

      try {
        await stampMutation.mutateAsync({
          stampType: type,
          stampTime: timestamp,
          nightWorkFlag: nightWork ? "1" : "0",
        });
      } catch (error) {
        emitStampError(error);
      }
    },
    [emitStampError, stampMutation]
  );

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    handleStamp,
    isLoading: stampMutation.isPending,
    message,
    clearMessage,
  };
};
