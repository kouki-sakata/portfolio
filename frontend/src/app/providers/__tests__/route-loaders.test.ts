import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { fetchSession } from "@/features/auth/api/session";
import { fetchEmployees } from "@/features/employees/api";
import { getHomeDashboard } from "@/features/home/api/homeDashboard";
import { fetchNewsList } from "@/features/news/api/newsApi";
import { fetchStampHistory } from "@/features/stampHistory/api";
import { ApiError } from "@/shared/api/errors/ApiError";
import { authEvents } from "@/shared/api/events/authEvents";
import { queryKeys } from "@/shared/utils/queryUtils";
import {
  employeeAdminRouteLoader,
  homeRouteLoader,
  newsManagementLoader,
  stampHistoryRouteLoader,
} from "../routeLoaders";

vi.mock("@/features/home/api/homeDashboard", () => ({
  getHomeDashboard: vi.fn(async () => ({
    employee: {
      id: 1,
      firstName: "太郎",
      lastName: "山田",
      email: "taro@example.com",
      admin: false,
    },
    news: [],
  })),
}));

vi.mock("@/features/employees/api", () => ({
  fetchEmployees: vi.fn(async () => ({ employees: [] })),
}));

vi.mock("@/features/stampHistory/api", () => ({
  fetchStampHistory: vi.fn(async () => ({
    entries: [],
    years: [],
    months: [],
    selectedYear: "",
    selectedMonth: "",
  })),
}));

vi.mock("@/features/auth/api/session", () => ({
  fetchSession: vi.fn(),
}));

vi.mock("@/features/news/api/newsApi", () => ({
  fetchNewsList: vi.fn(async () => ({ news: [] })),
}));

describe("route loaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchSession).mockResolvedValue({
      authenticated: true,
      employee: {
        id: 1,
        firstName: "管理者",
        lastName: "ユーザー",
        email: "admin@example.com",
        admin: true,
      },
    });
    vi.mocked(fetchNewsList).mockResolvedValue({ news: [] });
  });

  it("prefetches home dashboard data with configured cache options", async () => {
    const queryClient = new QueryClient();
    const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

    await homeRouteLoader(queryClient);

    expect(prefetchSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.home.dashboard(),
      queryFn: getHomeDashboard,
      staleTime: QUERY_CONFIG.homeDashboard.staleTime,
      gcTime: QUERY_CONFIG.homeDashboard.gcTime,
    });
  });

  it("prefetches employee list data", async () => {
    const queryClient = new QueryClient();
    const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

    await employeeAdminRouteLoader(queryClient);

    expect(prefetchSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.employees.list(),
      queryFn: expect.any(Function),
      staleTime: QUERY_CONFIG.employees.staleTime,
      gcTime: QUERY_CONFIG.employees.gcTime,
    });
    expect(fetchEmployees).toHaveBeenCalledWith();
  });

  it("prefetches stamp history data", async () => {
    const queryClient = new QueryClient();
    const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

    await stampHistoryRouteLoader(queryClient);

    expect(prefetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.stampHistory.list(),
        staleTime: QUERY_CONFIG.stampHistory.staleTime,
        gcTime: QUERY_CONFIG.stampHistory.gcTime,
      })
    );
    expect(fetchStampHistory).toHaveBeenCalledWith({});
  });

  it("validates admin session and prefetches news list for news management route", async () => {
    const queryClient = new QueryClient();
    const fetchQuerySpy = vi.spyOn(queryClient, "fetchQuery");

    await newsManagementLoader(queryClient);

    expect(fetchQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.auth.session(),
        queryFn: fetchSession,
        staleTime: QUERY_CONFIG.auth.staleTime,
        gcTime: QUERY_CONFIG.auth.gcTime,
      })
    );

    expect(fetchQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.news.list(),
        queryFn: fetchNewsList,
        staleTime: QUERY_CONFIG.news.staleTime,
        gcTime: QUERY_CONFIG.news.gcTime,
      })
    );
  });

  it("redirects non-admin users away from news management route", async () => {
    const queryClient = new QueryClient();
    vi.mocked(fetchSession).mockResolvedValue({
      authenticated: true,
      employee: {
        id: 2,
        firstName: "一般",
        lastName: "ユーザー",
        email: "user@example.com",
        admin: false,
      },
    });

    const fetchQuerySpy = vi.spyOn(queryClient, "fetchQuery");
    const forbiddenSpy = vi.spyOn(authEvents, "emitForbidden");

    let thrown: unknown;
    try {
      await newsManagementLoader(queryClient);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect(thrown).toMatchObject({ status: 302 });
    const redirectResponse = thrown as Response;
    expect(redirectResponse.headers.get("Location")).toBe("/");

    expect(fetchQuerySpy).toHaveBeenCalledTimes(1);
    expect(forbiddenSpy).toHaveBeenCalledWith("管理者権限が必要です。");

    forbiddenSpy.mockRestore();
  });

  it("redirects to signin when session request returns 401", async () => {
    const queryClient = new QueryClient();
    const unauthorizedError = new ApiError("Unauthorized", 401);

    vi.mocked(fetchSession).mockRejectedValue(unauthorizedError);
    const unauthorizedSpy = vi.spyOn(authEvents, "emitUnauthorized");

    let thrown: unknown;
    try {
      await newsManagementLoader(queryClient);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect(thrown).toMatchObject({ status: 302 });
    const redirectResponse = thrown as Response;
    expect(redirectResponse.headers.get("Location")).toBe("/signin");
    expect(unauthorizedSpy).toHaveBeenCalledWith(
      "セッションが期限切れです。再度サインインしてください。"
    );

    unauthorizedSpy.mockRestore();
  });

  it("redirects to signin when news prefetch fails with 401", async () => {
    const queryClient = new QueryClient();
    const unauthorizedError = new ApiError("Unauthorized", 401);

    vi.mocked(fetchNewsList).mockRejectedValue(unauthorizedError);
    const unauthorizedSpy = vi.spyOn(authEvents, "emitUnauthorized");

    let thrown: unknown;
    try {
      await newsManagementLoader(queryClient);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect(thrown).toMatchObject({ status: 302 });
    const redirectResponse = thrown as Response;
    expect(redirectResponse.headers.get("Location")).toBe("/signin");
    expect(unauthorizedSpy).toHaveBeenCalledWith(
      "セッションが期限切れです。再度サインインしてください。"
    );

    unauthorizedSpy.mockRestore();
  });
});
