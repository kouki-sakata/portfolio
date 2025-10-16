import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "react-router-dom";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { fetchSession } from "@/features/auth/api/session";
import { fetchEmployees } from "@/features/employees/api";
import { getHomeDashboard } from "@/features/home/api/homeDashboard";
import { fetchNewsList } from "@/features/news/api/newsApi";
import { fetchStampHistory } from "@/features/stampHistory/api";
import { authEvents } from "@/shared/api/events/authEvents";
import type { HttpClientError } from "@/shared/api/httpClient";
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

const isHttpClientError = (error: unknown): error is HttpClientError =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  typeof (error as { status?: unknown }).status === "number";

const handleAuthRedirect = (error: unknown): never => {
  if (isHttpClientError(error)) {
    if (error.status === 401) {
      authEvents.emitUnauthorized(
        "セッションが期限切れです。再度サインインしてください。"
      );
      throw redirect("/signin");
    }

    if (error.status === 403) {
      authEvents.emitForbidden("管理者権限が必要です。");
      throw redirect("/");
    }
  }

  throw error;
};

export const newsManagementLoader = async (queryClient: QueryClient) => {
  // セッション取得とアクセス権限チェック
  const session = await queryClient
    .fetchQuery({
      queryKey: queryKeys.auth.session(),
      queryFn: fetchSession,
      staleTime: QUERY_CONFIG.auth.staleTime,
      gcTime: QUERY_CONFIG.auth.gcTime,
    })
    .catch((error) => {
      handleAuthRedirect(error);
      // この行には到達しませんが、TypeScript の型チェックのため
      throw error;
    });

  // 管理者権限チェック
  if (!(session.authenticated && session.employee?.admin)) {
    authEvents.emitForbidden("管理者権限が必要です。");
    throw redirect("/");
  }

  // ニュースリストのプリフェッチ
  await queryClient
    .fetchQuery({
      queryKey: queryKeys.news.list(),
      queryFn: fetchNewsList,
      staleTime: QUERY_CONFIG.news.staleTime,
      gcTime: QUERY_CONFIG.news.gcTime,
    })
    .catch((error) => {
      handleAuthRedirect(error);
      throw error;
    });

  return session;
};
