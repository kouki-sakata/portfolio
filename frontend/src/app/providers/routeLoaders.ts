import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "react-router-dom";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { fetchSession } from "@/features/auth/api/session";
import { fetchEmployees } from "@/features/employees/api";
import { getHomeDashboard } from "@/features/home/api/homeDashboard";
import { fetchNewsList } from "@/features/news/api/newsApi";
import { fetchStampHistory } from "@/features/stampHistory/api";
import {
  hasStatus,
  type StatusAwareError as StatusError,
} from "@/shared/api/errors";
import { authEvents } from "@/shared/api/events/authEvents";
import { queryKeys } from "@/shared/utils/queryUtils";

export const homeRouteLoader = async (queryClient: QueryClient) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.home.dashboard(),
    queryFn: getHomeDashboard,
    staleTime: QUERY_CONFIG.homeDashboard.staleTime,
    gcTime: QUERY_CONFIG.homeDashboard.gcTime,
  });

export const employeeAdminRouteLoader = async (queryClient: QueryClient) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.employees.list(),
    queryFn: () => fetchEmployees(),
    staleTime: QUERY_CONFIG.employees.staleTime,
    gcTime: QUERY_CONFIG.employees.gcTime,
  });

export const stampHistoryRouteLoader = async (queryClient: QueryClient) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.stampHistory.list(),
    queryFn: () => fetchStampHistory({}),
    staleTime: QUERY_CONFIG.stampHistory.staleTime,
    gcTime: QUERY_CONFIG.stampHistory.gcTime,
  });

const handleAuthRedirect = (error: unknown): never => {
  if (hasStatus(error)) {
    const statusError: StatusError = error;

    if (statusError.status === 401) {
      authEvents.emitUnauthorized(
        "セッションが期限切れです。再度サインインしてください。"
      );
      throw redirect("/signin");
    }

    if (statusError.status === 403) {
      authEvents.emitForbidden("管理者権限が必要です。");
      throw redirect("/");
    }
  }

  throw error;
};

export const newsManagementLoader = async (queryClient: QueryClient) => {
  try {
    // セッション取得とアクセス権限チェック
    const session = await queryClient.fetchQuery({
      queryKey: queryKeys.auth.session(),
      queryFn: fetchSession,
      staleTime: QUERY_CONFIG.auth.staleTime,
      gcTime: QUERY_CONFIG.auth.gcTime,
    });

    // 管理者権限チェック
    if (!(session.authenticated && session.employee?.admin)) {
      authEvents.emitForbidden("管理者権限が必要です。");
      throw redirect("/");
    }

    // ニュースリストのプリフェッチ
    await queryClient.fetchQuery({
      queryKey: queryKeys.news.list(),
      queryFn: fetchNewsList,
      staleTime: QUERY_CONFIG.news.staleTime,
      gcTime: QUERY_CONFIG.news.gcTime,
    });

    return session;
  } catch (error) {
    // React Router の redirect は Response オブジェクトを throw するため、
    // そのまま再 throw して正常なナビゲーションを維持
    if (error instanceof Response) {
      throw error;
    }

    // API エラー（401/403など）は handleAuthRedirect で処理
    handleAuthRedirect(error);
  }
};
