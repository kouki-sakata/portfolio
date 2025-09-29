import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useMemo } from "react";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { fetchSession } from "@/features/auth/api/session";
import type { SessionResponse } from "@/features/auth/types";
import { queryKeys } from "@/shared/utils/queryUtils";

/**
 * セッション管理用のカスタムフック
 * 自動リフレッシュとキャッシュ管理を含む
 */
export const useSession = (
  options?: Omit<
    UseQueryOptions<SessionResponse, Error>,
    "queryKey" | "queryFn" | "staleTime" | "gcTime" | "refetchInterval"
  >
) => {
  const query = useQuery<SessionResponse, Error>({
    queryKey: queryKeys.auth.session(),
    queryFn: fetchSession,

    // 認証データ用の設定を使用
    staleTime: QUERY_CONFIG.auth.staleTime, // 5分
    gcTime: QUERY_CONFIG.auth.gcTime, // 10分

    // 15分ごとに自動でセッション情報を更新
    refetchInterval: 15 * 60 * 1000, // 15分

    // セッション情報は常に最新を保つ
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    // リトライ戦略
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    ...options,
  });

  // 計算されたプロパティ
  const isAuthenticated = useMemo(
    () => query.data?.authenticated ?? false,
    [query.data?.authenticated]
  );

  const user = useMemo(
    () => query.data?.employee ?? null,
    [query.data?.employee]
  );

  return {
    ...query,
    isAuthenticated,
    user,
  };
};