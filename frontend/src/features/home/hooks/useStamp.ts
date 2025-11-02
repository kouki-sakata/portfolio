import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

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
  409: ["conflict", "simulated error"],
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
      code: (error as { code?: string }).code,
      message: repoError.message,
      details: repoError.details,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  if (error && typeof error === "object" && "code" in error) {
    const plainError = error as {
      code?: string;
      status?: number;
      message?: string;
      details?: unknown;
    };
    return {
      status: plainError.status,
      code: plainError.code,
      message: plainError.message,
      details: plainError.details,
    };
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
  (typeof navigator !== "undefined" && navigator.onLine === false) ||
  errorInfo.status === 0 ||
  errorInfo.code === "NETWORK_ERROR" ||
  errorInfo.message?.toLowerCase() === "network error" ||
  error.message === "Network Error";
const isTimeoutIssue = (errorInfo: ErrorInfo, error: Error): boolean =>
  errorInfo.code === "TIMEOUT" ||
  error.message?.includes("timeout") ||
  error.message?.includes("Timeout");

const isServerIssue = (errorInfo: ErrorInfo): boolean =>
  errorInfo.code === "SERVER_ERROR" || (errorInfo.status ?? 0) >= 500;

export type StampStatusResult = "success" | "error" | "conflict";

export type StampStatus = {
  message: string;
  submittedAt: string;
  type: "1" | "2";
  result: StampStatusResult;
};

export type UseStampOptions = {
  timestampProvider?: () => string;
  onStampCaptured?: (input: { iso: string; type: "1" | "2" }) => void;
};

/**
 * 打刻用カスタムフック
 * Single Responsibility: 打刻ロジックのみを管理
 */
export const useStamp = (
  repository: IHomeRepository = createHomeRepository(),
  { timestampProvider, onStampCaptured }: UseStampOptions = {}
) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StampStatus | null>(null);
  const [lastStampTime, setLastStampTime] = useState<Record<string, number>>(
    {}
  );
  const capturedStampRef = useRef<{ iso: string; type: "1" | "2" } | null>(
    null
  );

  // 二重送信防止のための待機時間（ミリ秒）
  const DebounceMs = 3000;

  const stampMutation = useMutation<StampResponse, Error, StampRequest>({
    mutationFn: (request: StampRequest) => repository.submitStamp(request),
    onSuccess: (response: StampResponse) => {
      const captured = capturedStampRef.current;
      const iso = captured?.iso ?? formatLocalTimestamp();
      const type = captured?.type ?? "1";

      setStatus({
        message: response.message,
        submittedAt: iso,
        type,
        result: "success",
      });
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
      capturedStampRef.current = null;
    },
    onError: (error) => {
      const errorInfo = extractErrorInfo(error);
      const captured = capturedStampRef.current;
      const iso = captured?.iso ?? formatLocalTimestamp();
      const type = captured?.type ?? "1";

      // 409 Conflict（重複打刻エラー）の特別処理
      const conflictMessage = resolveConflictMessage(errorInfo);
      if (conflictMessage) {
        setStatus({
          message: conflictMessage,
          submittedAt: iso,
          type,
          result: "conflict",
        });
        toast({
          variant: "destructive",
          title: "重複打刻エラー",
          description: conflictMessage,
        });
        capturedStampRef.current = null;
        return; // 早期リターンで他のエラーハンドリングをスキップ
      }

      const errorMessage = "打刻に失敗しました。再度お試しください。";

      // サーバーエラーを最初にチェック（500番台）
      if (isServerIssue(errorInfo)) {
        setStatus({
          message:
            "サーバーエラーが発生しました。しばらくしてから再度お試しください。",
          submittedAt: iso,
          type,
          result: "error",
        });
        toast({
          variant: "destructive",
          title: "サーバーエラー",
          description:
            "サーバーエラーが発生しました。しばらくしてから再度お試しください。",
        });
        capturedStampRef.current = null;
        return;
      }

      if (isTimeoutIssue(errorInfo, error)) {
        setStatus({
          message:
            "リクエストがタイムアウトしました。しばらくしてから再度お試しください。",
          submittedAt: iso,
          type,
          result: "error",
        });
        toast({
          variant: "destructive",
          title: "タイムアウト",
          description:
            "リクエストがタイムアウトしました。しばらくしてから再度お試しください。",
        });
        capturedStampRef.current = null;
        return;
      }

      if (isNetworkIssue(errorInfo, error)) {
        setStatus({
          message: "通信エラーが発生しました。接続を確認してください。",
          submittedAt: iso,
          type,
          result: "error",
        });
        toast({
          variant: "destructive",
          title: "ネットワークエラー",
          description: "通信エラーが発生しました。接続を確認してください。",
        });
        capturedStampRef.current = null;
        return;
      }

      // 上記いずれにも該当しない汎用エラー
      setStatus({
        message: errorMessage,
        submittedAt: iso,
        type,
        result: "error",
      });
      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
      });
      capturedStampRef.current = null;
    },
  });

  const shouldBlockStamp = useCallback(
    (type: "1" | "2", now: number) => {
      const lastTime = lastStampTime[type] ?? 0;
      const elapsed = now - lastTime;

      if (elapsed < DebounceMs) {
        const stampTypeName = type === "1" ? "出勤" : "退勤";
        const waitSeconds = Math.ceil((DebounceMs - elapsed) / 1000);

        toast({
          variant: "destructive",
          title: "二重送信防止",
          description: `短時間での連続${stampTypeName}打刻はできません。あと${waitSeconds}秒お待ちください。`,
        });
        return true;
      }

      return false;
    },
    [lastStampTime]
  );

  const resolveTimestamp = useCallback(
    (override?: string): string => {
      if (override) {
        return override;
      }

      if (!timestampProvider) {
        return formatLocalTimestamp();
      }

      try {
        const provided = timestampProvider();
        return provided || formatLocalTimestamp();
      } catch {
        return formatLocalTimestamp();
      }
    },
    [timestampProvider]
  );

  const handleStamp = useCallback(
    async (type: "1" | "2", nightWork: boolean, isoOverride?: string) => {
      const now = Date.now();

      if (shouldBlockStamp(type, now)) {
        return;
      }

      setStatus(null);

      const timestamp = resolveTimestamp(isoOverride);

      capturedStampRef.current = { iso: timestamp, type };
      onStampCaptured?.({ iso: timestamp, type });

      await stampMutation.mutateAsync({
        stampType: type,
        stampTime: timestamp,
        nightWorkFlag: nightWork ? "1" : "0",
      });

      setLastStampTime((prev) => ({ ...prev, [type]: now }));
    },
    [onStampCaptured, resolveTimestamp, shouldBlockStamp, stampMutation]
  );

  const clearStatus = useCallback(() => {
    setStatus(null);
  }, []);

  return {
    handleStamp,
    isLoading: stampMutation.isPending,
    status,
    clearStatus,
  };
};
