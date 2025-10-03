import { useQuery } from "@tanstack/react-query";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { queryKeys } from "@/shared/utils/queryUtils";
import { fetchEmployees } from "../api";
import type { EmployeeListResponse } from "../types";

/**
 * 従業員一覧取得用のクエリキー
 */
export const EMPLOYEES_QUERY_KEY = queryKeys.employees.list();

/**
 * 従業員一覧を取得するReact Queryフック
 *
 * @remarks
 * - staleTime: 10分（従業員マスタの更新頻度に合わせたキャッシュ）
 * - gcTime: 30分（未参照データを保持）
 * - 管理者のみフィルタリングはデフォルトでfalse
 *
 * @example
 * ```tsx
 * function EmployeeList() {
 *   const { data, isLoading, isError } = useEmployees();
 *
 *   if (isLoading) return <PageLoader />;
 *   if (isError) return <ErrorMessage />;
 *
 *   return <EmployeeTable data={data.employees} />;
 * }
 * ```
 */
export function useEmployees() {
  return useQuery<EmployeeListResponse>({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: () => fetchEmployees(),
    staleTime: QUERY_CONFIG.employees.staleTime,
    gcTime: QUERY_CONFIG.employees.gcTime,
  });
}
