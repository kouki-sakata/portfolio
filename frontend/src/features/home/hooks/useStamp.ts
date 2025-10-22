import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  createHomeRepository,
  type IHomeRepository,
} from "@/features/home/repositories/HomeRepository";
import type { StampRequest, StampResponse } from "@/features/home/types";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/shared/api/errors/ApiError";
import type { RepositoryError } from "@/shared/repositories/types";
import { formatLocalTimestamp } from "@/shared/utils/date";
import { queryKeys } from "@/shared/utils/queryUtils";

const HOME_DASHBOARD_KEY = ["home", "dashboard"] as const;

const GENERIC_STATUS_MESSAGES: Record<number, string[]> = {
  409: ["conflict"],
};
const DEFAULT_CONFLICT_MESSAGE =
  "既に打刻済みです。同じ日に同じ種別の打刻はできません。";

type ErrorInfo = {
  status?: number;
  code?: RepositoryError["code"] | string;
  message?: string;
  details?: unknown;
};

const extractErrorInfo = (error: unknown): ErrorInfo => {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error && "code" in error) {
    const repoError = error as RepositoryError & { status?: number };
    return {
      status: repoError.status,
      code: repoError.code,
      message: repoError.message,
      details: repoError.details,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return {};
};

const extractServerMessage = (details: unknown): string | undefined => {
  if (details && typeof details === "object" && "message" in details) {
    const maybeMessage = (details as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage;
    }
  }
  return;
};

const resolveConflictMessage = (errorInfo: ErrorInfo): string | null => {
  if (errorInfo.status !== 409) {
    return null;
  }

  const normalizedMessage = errorInfo.message?.trim();
  const isGenericMessage = Boolean(
    normalizedMessage &&
      GENERIC_STATUS_MESSAGES[errorInfo.status ?? -1]?.includes(
        normalizedMessage.toLowerCase()
      )
  );

  return (
    extractServerMessage(errorInfo.details) ||
    (isGenericMessage ? undefined : normalizedMessage) ||
    DEFAULT_CONFLICT_MESSAGE
  );
};

const isNetworkIssue = (errorInfo: ErrorInfo, error: Error): boolean =>
  !navigator.onLine ||
  errorInfo.status === 0 ||
  errorInfo.code === "NETWORK_ERROR" ||
  errorInfo.message?.toLowerCase() === "network error" ||
  error.message === "Network Error";

const isTimeoutIssue = (errorInfo: ErrorInfo, error: Error): boolean =>
  errorInfo.code === "TIMEOUT" ||
  error.message.includes("timeout") ||
  error.message.includes("Timeout");

const isServerIssue = (error: Error): boolean =>
  error.message.includes("500") || error.message.includes("Server");

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
      const errorInfo = extractErrorInfo(error);

      // 409 Conflict（重複打刻エラー）の特別処理
      const conflictMessage = resolveConflictMessage(errorInfo);
      if (conflictMessage) {
        setMessage(conflictMessage);
        toast({
          variant: "destructive",
          title: "重複打刻エラー",
          description: conflictMessage,
        });
        return; // 早期リターンで他のエラーハンドリングをスキップ
      }

      const errorMessage = "打刻に失敗しました。再度お試しください。";
      setMessage(errorMessage);

      if (isNetworkIssue(errorInfo, error)) {
        toast({
          variant: "destructive",
          title: "ネットワークエラー",
          description: "通信エラーが発生しました。接続を確認してください。",
        });
        return;
      }

      if (isTimeoutIssue(errorInfo, error)) {
        toast({
          variant: "destructive",
          title: "タイムアウト",
          description:
            "リクエストがタイムアウトしました。しばらくしてから再度お試しください。",
        });
        return;
      }

      if (isServerIssue(error)) {
        toast({
          variant: "destructive",
          title: "サーバーエラー",
          description:
            "サーバーエラーが発生しました。しばらくしてから再度お試しください。",
        });
        return;
      }

      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
      });
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
