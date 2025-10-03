import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { fetchEmployees } from "@/features/employees/api";
import { getHomeDashboard } from "@/features/home/api/homeDashboard";
import { fetchStampHistory } from "@/features/stampHistory/api";
import { queryKeys } from "@/shared/utils/queryUtils";
import {
  employeeAdminRouteLoader,
  homeRouteLoader,
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

describe("route loaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
