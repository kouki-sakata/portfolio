import type { QueryClient } from "@tanstack/react-query";
import { QUERY_CONFIG } from "@/app/config/enhanced-query-client";
// TODO: Replace with actual API functions when implemented
import {
  getEmployeeById,
  getEmployees,
} from "@/features/employees/api/testHelpers";
// TODO: Replace with actual API function when renamed
import { getDashboardData } from "@/features/home/api/testHelpers";
import { getStampHistory } from "@/features/stampHistory/api";
import { queryKeys } from "@/shared/utils/queryUtils";

/**
 * ルート遷移時の事前データ取得
 * ページ遷移前に必要なデータをprefetchしてUXを改善
 *
 * @param queryClient React Query Client
 * @param route 遷移先のルート
 */
export const prefetchRouteData = async (
  queryClient: QueryClient,
  route: string
): Promise<void> => {
  switch (route) {
    case "/employees": {
      // 従業員一覧の最初のページをprefetch
      await queryClient.prefetchQuery({
        queryKey: queryKeys.employees.list({ page: 1 }),
        queryFn: () => getEmployees({ page: 1, size: 20 }),
        staleTime: QUERY_CONFIG.pagination.employees.staleTime,
      });
      break;
    }
    case "/stamp-history": {
      // 当月の打刻履歴をprefetch
      const now = new Date();
      await queryClient.prefetchQuery({
        queryKey: queryKeys.stampHistory.list({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }),
        queryFn: () =>
          getStampHistory({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          }),
        staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
      });
      break;
    }
    case "/home":
    case "/": {
      // ダッシュボードデータをprefetch
      await queryClient.prefetchQuery({
        queryKey: queryKeys.home.dashboard(),
        queryFn: getDashboardData,
        staleTime: QUERY_CONFIG.dynamic.dashboard.staleTime,
      });
      break;
    }
    default:
      // 未知のルートでは何もしない
      break;
  }
};

/**
 * ユーザーインタラクション時のprefetch
 * ホバーやフォーカス時に事前データ取得
 *
 * @param queryClient React Query Client
 * @param queryKey クエリキー
 * @param queryFn データ取得関数
 * @param staleTime データの新鮮度維持期間（デフォルト: 60秒）
 */
export const prefetchOnInteraction = <TData = unknown>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  staleTime = 60_000
): Promise<void> =>
  queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });

/**
 * 従業員詳細のホバー時prefetch
 * 従業員カードやリストアイテムのホバー時に詳細データを先読み
 */
export const prefetchEmployeeDetail = (
  queryClient: QueryClient,
  employeeId: number
): Promise<void> =>
  prefetchOnInteraction(
    queryClient,
    queryKeys.employees.detail(employeeId),
    () => getEmployeeById(employeeId),
    QUERY_CONFIG.master.employees.staleTime
  );

/**
 * 打刻履歴の月次データ先読み
 * 前月・翌月のナビゲーション時に事前取得
 */
export const prefetchAdjacentMonths = async (
  queryClient: QueryClient,
  currentYear: number,
  currentMonth: number
): Promise<void> => {
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  // 前月と翌月のデータを並列でprefetch
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.stampHistory.list({
        year: prevYear,
        month: prevMonth,
      }),
      queryFn: () =>
        getStampHistory({
          year: prevYear,
          month: prevMonth,
        }),
      staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.stampHistory.list({
        year: nextYear,
        month: nextMonth,
      }),
      queryFn: () =>
        getStampHistory({
          year: nextYear,
          month: nextMonth,
        }),
      staleTime: QUERY_CONFIG.dynamic.stampHistory.staleTime,
    }),
  ]);
};

/**
 * ダッシュボードデータの並列prefetch
 * 複数の関連データを効率的に事前取得
 */
export const prefetchDashboardData = async (
  queryClient: QueryClient
): Promise<void> => {
  // ダッシュボード表示に必要な複数のデータを並列でprefetch
  await Promise.all([
    // ダッシュボードメインデータ
    queryClient.prefetchQuery({
      queryKey: queryKeys.home.dashboard(),
      queryFn: getDashboardData,
      staleTime: QUERY_CONFIG.dynamic.dashboard.staleTime,
    }),
    // お知らせデータ
    queryClient.prefetchQuery({
      queryKey: queryKeys.home.news(),
      queryFn: () => {
        // TODO: getNewsを実装後に置き換え
        return Promise.resolve([]);
      },
      staleTime: QUERY_CONFIG.dynamic.news.staleTime,
    }),
  ]);
};

/**
 * ページネーションの先読み
 * 次のページを事前に取得してスムーズなページ遷移を実現
 */
export const prefetchNextPage = <TData = unknown>(
  queryClient: QueryClient,
  options: {
    queryKeyFactory: (page: number) => readonly unknown[];
    queryFn: (page: number) => Promise<TData>;
    currentPage: number;
    totalPages: number;
    staleTime?: number;
  }
): Promise<void> => {
  const { queryKeyFactory, queryFn, currentPage, totalPages, staleTime } =
    options;

  if (currentPage >= totalPages) {
    return Promise.resolve();
  }

  const nextPage = currentPage + 1;
  return queryClient.prefetchQuery({
    queryKey: queryKeyFactory(nextPage),
    queryFn: () => queryFn(nextPage),
    staleTime: staleTime || QUERY_CONFIG.pagination.employees.staleTime,
  });
};

/**
 * 無限スクロール用のprefetch
 * スクロール位置に応じて次のデータセットを先読み
 */
export const prefetchInfiniteScrollData = async (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<unknown>,
  pages = 2 // デフォルトで2ページ先まで先読み
): Promise<void> => {
  await queryClient.prefetchInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage: { hasNext: boolean; nextPage: number }) =>
      lastPage.hasNext ? lastPage.nextPage : undefined,
    pages,
  });
};

/**
 * 条件付きprefetch
 * 特定の条件が満たされた場合のみprefetchを実行
 */
export const conditionalPrefetch = async (
  queryClient: QueryClient,
  prefetchOptions: {
    condition: boolean | (() => boolean);
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
    staleTime?: number;
    gcTime?: number;
  }
): Promise<void> => {
  const { condition, queryKey, queryFn, staleTime, gcTime } = prefetchOptions;
  const shouldPrefetch =
    typeof condition === "function" ? condition() : condition;

  if (!shouldPrefetch) {
    return;
  }

  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
    gcTime,
  });
};

/**
 * バックグラウンドでの静かなprefetch
 * UIをブロックせずにデータを先読み
 */
export const silentPrefetch = (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<unknown>,
  options?: {
    staleTime?: number;
    gcTime?: number;
  }
): void => {
  // fire-and-forget パターン: エラーを無視して非同期実行
  queryClient
    .prefetchQuery({
      queryKey,
      queryFn,
      ...options,
    })
    .catch(() => {
      // エラーは意図的に無視（バックグラウンドprefetchのため）
    });
};

/**
 * 優先度付きprefetch
 * 重要度に応じてprefetchの順序を制御
 */
export const prefetchWithPriority = async (
  queryClient: QueryClient,
  prefetchTasks: Array<{
    priority: "high" | "medium" | "low";
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
    staleTime?: number;
  }>
): Promise<void> => {
  // 優先度でソート
  const sortedTasks = [...prefetchTasks].sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // 高優先度は直列実行、その他は並列実行
  const highPriorityTasks = sortedTasks.filter((t) => t.priority === "high");
  const otherTasks = sortedTasks.filter((t) => t.priority !== "high");

  // 高優先度タスクを順次実行
  for (const task of highPriorityTasks) {
    await queryClient.prefetchQuery({
      queryKey: task.queryKey,
      queryFn: task.queryFn,
      staleTime: task.staleTime,
    });
  }

  // その他のタスクを並列実行
  if (otherTasks.length > 0) {
    await Promise.all(
      otherTasks.map((task) =>
        queryClient.prefetchQuery({
          queryKey: task.queryKey,
          queryFn: task.queryFn,
          staleTime: task.staleTime,
        })
      )
    );
  }
};
