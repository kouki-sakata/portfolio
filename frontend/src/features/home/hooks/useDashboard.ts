import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  createHomeRepository,
  type IHomeRepository,
} from "@/features/home/repositories/HomeRepository";

/**
 * ダッシュボードクエリのオプション定義
 *
 * @remarks
 * TypeScript v5のベストプラクティスに従い、queryOptions関数を使用して
 * より優れた型推論と再利用性を実現
 */
export const dashboardQueryOptions = (
  repository: IHomeRepository = createHomeRepository()
) =>
  queryOptions({
    queryKey: ["home", "overview"] as const,
    queryFn: () => repository.getDashboard(),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // 5分ごとに自動更新
  });

/**
 * ダッシュボードデータ取得用カスタムフック
 * Single Responsibility: ダッシュボードデータの取得のみを管理
 *
 * @remarks
 * queryOptions パターンを使用してTypeScript v5の型推論を最大化
 */
export const useDashboard = (
  repository: IHomeRepository = createHomeRepository()
) => {
  const query = useQuery(dashboardQueryOptions(repository));

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
