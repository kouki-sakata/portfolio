import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  createHomeRepository,
  type IHomeRepository,
} from "@/features/home/repositories/HomeRepository";
import type { StampRequest, StampResponse } from "@/features/home/types";
import { createOptimisticMutation } from "@/shared/utils/mutationHelpers";
import { queryKeys } from "@/shared/utils/queryUtils";

const _HOME_DASHBOARD_KEY = ["home", "overview"] as const;

/**
 * 打刻用カスタムフック
 * Single Responsibility: 打刻ロジックのみを管理
 * 楽観的更新により即座にUIに反映
 */
export const useStamp = (
  repository: IHomeRepository = createHomeRepository()
) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const stampMutation = useMutation<StampResponse, Error, StampRequest>(
    createOptimisticMutation<StampResponse, Error, StampRequest>(queryClient, {
      mutationFn: (request: StampRequest) => repository.submitStamp(request),
      queryKey: queryKeys.home.dashboard(),
      optimisticUpdater: (oldData, variables) => {
        // ダッシュボードデータの楽観的更新
        // 打刻状態を即座に反映
        if (!oldData || typeof oldData !== "object") {
          return oldData;
        }

        return {
          ...oldData,
          isStamped: variables.stampType === "1",
          lastStampTime: variables.stampTime,
        };
      },
      onSuccessHandler: (response: StampResponse) => {
        setMessage(response.message);
      },
      invalidateQueries: [
        queryKeys.home.dashboard(),
        queryKeys.stampHistory.all,
      ],
    })
  );

  // エラー時のメッセージ設定を追加
  const originalOnError = stampMutation.onError;
  stampMutation.onError = (error, variables, context) => {
    setMessage("打刻に失敗しました。再度お試しください。");
    originalOnError?.(error, variables, context);
  };

  const handleStamp = useCallback(
    async (type: "1" | "2", nightWork: boolean) => {
      setMessage(null);
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
    setMessage(null);
  }, []);

  return {
    handleStamp,
    isLoading: stampMutation.isPending,
    message,
    clearMessage,
  };
};
