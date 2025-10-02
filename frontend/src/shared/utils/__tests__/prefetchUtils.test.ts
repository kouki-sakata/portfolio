import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QUERY_CONFIG } from "@/app/config/enhanced-query-client";
import * as employeesApi from "@/features/employees/api/testHelpers";
import * as dashboardApi from "@/features/home/api/testHelpers";
import * as stampHistoryApi from "@/features/stampHistory/api";
import {
  conditionalPrefetch,
  prefetchAdjacentMonths,
  prefetchDashboardData,
  prefetchEmployeeDetail,
  prefetchInfiniteScrollData,
  prefetchNextPage,
  prefetchOnInteraction,
  prefetchRouteData,
  prefetchWithPriority,
  silentPrefetch,
} from "@/shared/utils/prefetchUtils";
import { queryKeys } from "@/shared/utils/queryUtils";

// Mock modules
vi.mock("@/features/employees/api/testHelpers", () => ({
  getEmployees: vi.fn(),
  getEmployeeById: vi.fn(),
}));

vi.mock("@/features/home/api/testHelpers", () => ({
  getDashboardData: vi.fn(),
}));

vi.mock("@/features/stampHistory/api", () => ({
  fetchStampHistory: vi.fn(),
  updateStamp: vi.fn(),
  deleteStamp: vi.fn(),
}));

describe("Prefetchユーティリティ", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });

    // Mock API functions
    vi.mocked(employeesApi.getEmployees).mockResolvedValue({
      employees: [
        {
          id: 1,
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          admin: false,
        },
      ],
    });
    vi.mocked(employeesApi.getEmployeeById).mockResolvedValue({
      id: 1,
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      admin: false,
    });
    vi.mocked(dashboardApi.getDashboardData).mockResolvedValue({
      employee: {
        id: 1,
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        admin: false,
      },
      news: [],
    });
    vi.mocked(stampHistoryApi.fetchStampHistory).mockResolvedValue({
      selectedYear: new Date().getFullYear().toString(),
      selectedMonth: (new Date().getMonth() + 1).toString(),
      years: [new Date().getFullYear().toString()],
      months: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
      entries: [],
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe("prefetchRouteData", () => {
    it("従業員ルートのデータを先読みする", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      await prefetchRouteData(queryClient, "/employees");

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.employees.list({ page: 1 }),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.pagination.employees.staleTime,
      });

      expect(employeesApi.getEmployees).toHaveBeenCalledWith({
        page: 1,
        size: 20,
      });
    });

    it("打刻履歴ルートのデータを先読みする", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
      const now = new Date();

      await prefetchRouteData(queryClient, "/stamp-history");

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.stampHistory.list({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
      });
    });

    it("ホームルートのデータを先読みする", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      await prefetchRouteData(queryClient, "/home");

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.home.dashboard(),
        queryFn: dashboardApi.getDashboardData,
        staleTime: QUERY_CONFIG.dynamic.dashboard.staleTime,
      });
    });

    it("ルートパスでもダッシュボードデータを先読みする", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      await prefetchRouteData(queryClient, "/");

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.home.dashboard(),
        queryFn: dashboardApi.getDashboardData,
        staleTime: QUERY_CONFIG.dynamic.dashboard.staleTime,
      });
    });

    it("未知のルートでは何もしない", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      await prefetchRouteData(queryClient, "/unknown");

      expect(prefetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("prefetchOnInteraction", () => {
    it("指定されたクエリを先読みする", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });
      const queryKey = ["interaction-test"] as const;

      await prefetchOnInteraction(queryClient, queryKey, fetchFn, 30_000);

      expect(fetchFn).toHaveBeenCalled();

      // キャッシュにデータが保存される
      const cachedData = queryClient.getQueryData(queryKey);
      expect(cachedData).toEqual({ data: "test" });
    });

    it("カスタムstaleTimeが適用される", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });
      const queryKey = ["stale-test"] as const;
      const customStaleTime = 120_000;

      await prefetchOnInteraction(
        queryClient,
        queryKey,
        fetchFn,
        customStaleTime
      );

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey,
        queryFn: fetchFn,
        staleTime: customStaleTime,
      });
    });
  });

  describe("prefetchEmployeeDetail", () => {
    it("従業員詳細データを先読みする", async () => {
      const employeeId = 123;

      await prefetchEmployeeDetail(queryClient, employeeId);

      expect(employeesApi.getEmployeeById).toHaveBeenCalledWith(employeeId);

      // キャッシュにデータが保存される
      const cachedData = queryClient.getQueryData(
        queryKeys.employees.detail(employeeId)
      );
      expect(cachedData).toBeDefined();
    });

    it("正しいstaleTimeが設定される", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
      const employeeId = 456;

      await prefetchEmployeeDetail(queryClient, employeeId);

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.employees.detail(employeeId),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.master.employees.staleTime,
      });
    });
  });

  describe("prefetchAdjacentMonths", () => {
    it("前月と翌月のデータを並列で先読みする", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      await prefetchAdjacentMonths(queryClient, 2024, 6);

      // 前月（5月）のデータ
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.stampHistory.list({ year: 2024, month: 5 }),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
      });

      // 翌月（7月）のデータ
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.stampHistory.list({ year: 2024, month: 7 }),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
      });
    });

    it("年をまたぐ場合も正しく処理する", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      // 1月の場合
      await prefetchAdjacentMonths(queryClient, 2024, 1);

      // 前月は前年の12月
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.stampHistory.list({ year: 2023, month: 12 }),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
      });

      // 翌月は2月
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.stampHistory.list({ year: 2024, month: 2 }),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
      });
    });

    it("12月の場合も正しく処理する", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      await prefetchAdjacentMonths(queryClient, 2024, 12);

      // 前月は11月
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.stampHistory.list({ year: 2024, month: 11 }),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
      });

      // 翌月は翌年の1月
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.stampHistory.list({ year: 2025, month: 1 }),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
      });
    });
  });

  describe("prefetchDashboardData", () => {
    it("ダッシュボードとお知らせデータを並列で先読みする", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      await prefetchDashboardData(queryClient);

      // ダッシュボードデータ
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.home.dashboard(),
        queryFn: dashboardApi.getDashboardData,
        staleTime: QUERY_CONFIG.dynamic.dashboard.staleTime,
      });

      // お知らせデータ
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.home.news(),
        queryFn: expect.any(Function),
        staleTime: QUERY_CONFIG.dynamic.news.staleTime,
      });
    });
  });

  describe("prefetchNextPage", () => {
    it("次のページをprefetchする", async () => {
      const queryKeyFactory = (page: number) => ["page", page] as const;
      const queryFn = vi.fn((page: number) =>
        Promise.resolve({ page, data: `Page ${page}` })
      );
      const currentPage = 2;
      const totalPages = 5;

      await prefetchNextPage(queryClient, {
        queryKeyFactory,
        queryFn,
        currentPage,
        totalPages,
        staleTime: 10_000,
      });

      expect(queryFn).toHaveBeenCalledWith(3);

      // キャッシュに保存される
      const cachedData = queryClient.getQueryData(queryKeyFactory(3));
      expect(cachedData).toEqual({ page: 3, data: "Page 3" });
    });

    it("最終ページでは何もしない", async () => {
      const queryFn = vi.fn();
      const currentPage = 5;
      const totalPages = 5;

      await prefetchNextPage(queryClient, {
        queryKeyFactory: (page) => ["page", page],
        queryFn,
        currentPage,
        totalPages,
      });

      expect(queryFn).not.toHaveBeenCalled();
    });
  });

  describe("prefetchInfiniteScrollData", () => {
    it("無限スクロール用のデータをprefetchする", async () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchInfiniteQuery");
      const queryKey = ["infinite"] as const;
      const queryFn = vi.fn(({ pageParam }) =>
        Promise.resolve({
          data: `Page ${pageParam}`,
          hasNext: pageParam < 5,
          nextPage: pageParam + 1,
        })
      );

      await prefetchInfiniteScrollData(queryClient, queryKey, queryFn, 2);

      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey,
          queryFn,
          initialPageParam: 1,
          getNextPageParam: expect.any(Function),
          pages: 2,
        })
      );
    });
  });

  describe("conditionalPrefetch", () => {
    it("条件がtrueの場合のみprefetchする", async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: "test" });
      const queryKey = ["conditional"] as const;

      await conditionalPrefetch(queryClient, {
        condition: true,
        queryKey,
        queryFn,
      });

      expect(queryFn).toHaveBeenCalled();
    });

    it("条件がfalseの場合はprefetchしない", async () => {
      const queryFn = vi.fn();
      const queryKey = ["conditional"] as const;

      await conditionalPrefetch(queryClient, {
        condition: false,
        queryKey,
        queryFn,
      });

      expect(queryFn).not.toHaveBeenCalled();
    });

    it("条件が関数の場合も動作する", async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: "test" });
      const queryKey = ["conditional"] as const;
      const condition = vi.fn().mockReturnValue(true);

      await conditionalPrefetch(queryClient, {
        condition,
        queryKey,
        queryFn,
      });

      expect(condition).toHaveBeenCalled();
      expect(queryFn).toHaveBeenCalled();
    });
  });

  describe("silentPrefetch", () => {
    it("エラーが発生してもthrowしない", () => {
      const queryFn = vi.fn().mockRejectedValue(new Error("Prefetch failed"));
      const queryKey = ["silent"] as const;

      // エラーがthrowされないことを確認
      expect(() => {
        silentPrefetch(queryClient, queryKey, queryFn);
      }).not.toThrow();
    });

    it("バックグラウンドでprefetchを実行する", () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
      const queryFn = vi.fn().mockResolvedValue({ data: "test" });
      const queryKey = ["silent"] as const;

      silentPrefetch(queryClient, queryKey, queryFn, {
        staleTime: 10_000,
        gcTime: 20_000,
      });

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey,
        queryFn,
        staleTime: 10_000,
        gcTime: 20_000,
      });
    });
  });

  describe("prefetchWithPriority", () => {
    it("高優先度タスクが先に実行される", async () => {
      const executionOrder: string[] = [];

      const tasks = [
        {
          priority: "low" as const,
          queryKey: ["low"] as const,
          queryFn: () => {
            executionOrder.push("low");
            return Promise.resolve({ data: "low" });
          },
        },
        {
          priority: "high" as const,
          queryKey: ["high"] as const,
          queryFn: () => {
            executionOrder.push("high");
            return Promise.resolve({ data: "high" });
          },
        },
        {
          priority: "medium" as const,
          queryKey: ["medium"] as const,
          queryFn: () => {
            executionOrder.push("medium");
            return Promise.resolve({ data: "medium" });
          },
        },
      ];

      await prefetchWithPriority(queryClient, tasks);

      // 高優先度が最初に実行される
      expect(executionOrder[0]).toBe("high");

      // 中・低優先度は並列実行されるため順序は保証されない
      expect(executionOrder).toContain("medium");
      expect(executionOrder).toContain("low");
    });

    it("同じ優先度のタスクは並列実行される", async () => {
      const startTimes: Record<string, number> = {};

      const tasks = [
        {
          priority: "medium" as const,
          queryKey: ["task1"] as const,
          queryFn: async () => {
            startTimes["task1"] = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { data: "task1" };
          },
        },
        {
          priority: "medium" as const,
          queryKey: ["task2"] as const,
          queryFn: async () => {
            startTimes["task2"] = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { data: "task2" };
          },
        },
      ];

      await prefetchWithPriority(queryClient, tasks);

      // 並列実行のため、開始時刻がほぼ同じ
      const timeDiff = Math.abs((startTimes["task1"] ?? 0) - (startTimes["task2"] ?? 0));
      expect(timeDiff).toBeLessThan(5);
    });
  });
});
