import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  createHomeRepository,
  type IHomeRepository,
} from "@/features/home/repositories/HomeRepository";
import type { StampRequest, StampResponse } from "@/features/home/types";
import { toast } from "@/hooks/use-toast";
import type { HttpClientError } from "@/shared/api/httpClient";

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
      toast({
        title: "成功",
        description: response.message,
      });
      queryClient
        .invalidateQueries({ queryKey: HOME_DASHBOARD_KEY })
        .catch(() => {
          // エラーハンドリングは不要（キャッシュ無効化の失敗は次回フェッチで解決）
        });
    },
    onError: (error) => {
      const errorMessage = "打刻に失敗しました。再度お試しください。";
      setMessage(errorMessage);

      // ネットワークエラーの判定
      const isNetworkError =
        !navigator.onLine ||
        error.message === "Network error" ||
        (error as HttpClientError).status === 0 ||
        (error as HttpClientError & { code?: string }).code === "NETWORK_ERROR";

      if (isNetworkError) {
        toast({
          variant: "destructive",
          title: "ネットワークエラー",
          description: "通信エラーが発生しました。接続を確認してください。",
        });
      } else if (
        error.message?.includes("timeout") ||
        error.message?.includes("Timeout")
      ) {
        toast({
          variant: "destructive",
          title: "タイムアウト",
          description:
            "リクエストがタイムアウトしました。しばらくしてから再度お試しください。",
        });
      } else if (
        error.message?.includes("500") ||
        error.message?.includes("Server")
      ) {
        toast({
          variant: "destructive",
          title: "サーバーエラー",
          description:
            "サーバーエラーが発生しました。しばらくしてから再度お試しください。",
        });
      } else {
        toast({
          variant: "destructive",
          title: "エラー",
          description: errorMessage,
        });
      }
    },
  });

  const handleStamp = useCallback(
    (type: "1" | "2", nightWork: boolean) => {
      setMessage(null);
      const timestamp = new Date().toISOString().slice(0, 19);

      stampMutation.mutate({
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
