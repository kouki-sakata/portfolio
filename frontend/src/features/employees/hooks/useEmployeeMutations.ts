import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EmployeeSummary } from "@/features/auth/types";
import { createEmployee, deleteEmployee, updateEmployee } from "../api";
import type { EmployeeUpsertInput } from "../types";
import { EMPLOYEES_QUERY_KEY } from "./useEmployees";

/**
 * 従業員作成用mutation
 *
 * @remarks
 * - 作成成功後、従業員一覧のクエリを無効化して再フェッチ
 * - 楽観的更新は行わず、サーバーレスポンスを待つ
 *
 * @example
 * ```tsx
 * const createMutation = useCreateEmployee();
 * await createMutation.mutateAsync({
 *   firstName: "太郎",
 *   lastName: "山田",
 *   email: "taro@example.com",
 *   password: "password123",
 *   admin: false
 * });
 * ```
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EmployeeUpsertInput & { password: string }) =>
      createEmployee(payload),
    onSuccess: async () => {
      // 従業員一覧を再フェッチ
      await queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
}

/**
 * 従業員更新用mutation
 *
 * @remarks
 * - 更新成功後、従業員一覧のクエリを無効化して再フェッチ
 * - passwordは任意（省略可能）
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateEmployee();
 * await updateMutation.mutateAsync({
 *   id: 1,
 *   firstName: "太郎",
 *   lastName: "山田",
 *   email: "taro@example.com",
 *   admin: true
 * });
 * ```
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: EmployeeUpsertInput & { id: number; password?: string }) =>
      updateEmployee(id, payload),
    onSuccess: async () => {
      // 従業員一覧を再フェッチ
      await queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
}

/**
 * 従業員削除用mutation（一括削除対応）
 *
 * @remarks
 * - 削除成功後、従業員一覧のクエリを無効化して再フェッチ
 * - 楽観的更新パターンを実装（onMutate, onError, onSettled）
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteEmployees();
 *
 * // 単一削除
 * await deleteMutation.mutateAsync(1);
 *
 * // 一括削除
 * await deleteMutation.mutateAsync([1, 2, 3]);
 * ```
 */
export function useDeleteEmployees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeIds: number | number[]) => {
      const ids = Array.isArray(employeeIds) ? employeeIds : [employeeIds];
      // 複数IDの削除は順次実行
      await Promise.all(ids.map((id) => deleteEmployee(id)));
    },
    // 楽観的更新: 削除前にキャッシュから削除対象を除外
    onMutate: async (employeeIds) => {
      const ids = Array.isArray(employeeIds) ? employeeIds : [employeeIds];

      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: EMPLOYEES_QUERY_KEY });

      // 現在のキャッシュを保存（ロールバック用）
      const previousEmployees = queryClient.getQueryData(EMPLOYEES_QUERY_KEY);

      // 楽観的にキャッシュを更新（削除対象を除外）
      queryClient.setQueryData(
        EMPLOYEES_QUERY_KEY,
        (old: { employees: EmployeeSummary[] }) => ({
          employees: old.employees.filter((emp) => !ids.includes(emp.id)),
        })
      );

      // ロールバック用のコンテキストを返す
      return { previousEmployees };
    },
    // エラー時: キャッシュをロールバック
    onError: (_error, _variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(
          EMPLOYEES_QUERY_KEY,
          context.previousEmployees
        );
      }
    },
    // 完了時: 最新データを再フェッチ
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
}
