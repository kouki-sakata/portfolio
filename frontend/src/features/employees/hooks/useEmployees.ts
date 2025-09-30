import { useQuery } from "@tanstack/react-query";

import { fetchEmployees } from "../api";
import type { EmployeeListResponse } from "../types";

/**
 * 従業員一覧取得用のクエリキー
 */
export const EMPLOYEES_QUERY_KEY = ["employees", "list"] as const;

/**
 * 従業員一覧を取得するReact Queryフック
 *
 * @remarks
 * - staleTime: 30秒（30秒間はキャッシュされたデータを使用）
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
    queryFn: () => fetchEmployees(false),
    staleTime: 30 * 1000, // 30秒
  });
}
