import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  createHomeRepository,
  type IHomeRepository,
} from "@/features/home/repositories/HomeRepository";
import type { StampRequest, StampResponse } from "@/features/home/types";
import { toast } from "@/hooks/use-toast";
import type { HttpClientError } from "@/shared/api/httpClient";
import { formatLocalTimestamp } from "@/shared/utils/date";
import { queryKeys } from "@/shared/utils/queryUtils";

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
  const [lastStampTime, setLastStampTime] = useState<Record<string, number>>(
    {}
  );

  // 二重送信防止のための待機時間（ミリ秒）
  const DebounceMs = 3000;

  const stampMutation = useMutation<StampResponse, Error, StampRequest>({
    mutationFn: (request: StampRequest) => repository.submitStamp(request),
    onSuccess: (response: StampResponse) => {
      setMessage(response.message);
      toast({
        title: "成功",
        description: response.message,
      });
      // ホームダッシュボードと勤怠履歴の両方を無効化
      Promise.all([
        queryClient.invalidateQueries({ queryKey: HOME_DASHBOARD_KEY }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stampHistory.all }),
      ]).catch(() => {
        // エラーハンドリングは不要（キャッシュ無効化の失敗は次回フェッチで解決）
      });
    },
    onError: (error) => {
      // 409 Conflict（重複打刻エラー）の特別処理
      const httpError = error as HttpClientError;
      if (httpError.status === 409) {
        const serverMessage =
          (httpError.payload as { message?: string })?.message ||
          "既に打刻済みです。同じ日に同じ種別の打刻はできません。";

        setMessage(serverMessage);
        toast({
          variant: "destructive",
          title: "重複打刻エラー",
          description: serverMessage,
        });
        return; // 早期リターンで他のエラーハンドリングをスキップ
      }

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
    async (type: "1" | "2", nightWork: boolean) => {
      // 二重送信防止チェック
      const now = Date.now();
      const lastTime = lastStampTime[type] || 0;

      if (now - lastTime < DebounceMs) {
        const stampTypeName = type === "1" ? "出勤" : "退勤";
        const waitSeconds = Math.ceil((DebounceMs - (now - lastTime)) / 1000);

        toast({
          variant: "destructive",
          title: "二重送信防止",
          description: `短時間での連続${stampTypeName}打刻はできません。あと${waitSeconds}秒お待ちください。`,
        });
        return;
      }

      setMessage(null);
      // JST固定で時刻を送信（海外アクセスでも正しい時刻を保証）
      const timestamp = formatLocalTimestamp();

      await stampMutation.mutateAsync({
        stampType: type,
        stampTime: timestamp,
        nightWorkFlag: nightWork ? "1" : "0",
      });

      // 打刻成功後に最終打刻時刻を更新
      setLastStampTime((prev) => ({ ...prev, [type]: now }));
    },
    [stampMutation, lastStampTime]
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
