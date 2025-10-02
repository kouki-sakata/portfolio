import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EmployeeSummary } from "@/features/auth/types";
import { createListOptimisticMutation } from "@/shared/utils/mutationHelpers";
import { queryKeys } from "@/shared/utils/queryUtils";
import { createEmployee, deleteEmployee, updateEmployee } from "../api";
import type { EmployeeUpsertInput } from "../types";
import { EMPLOYEES_QUERY_KEY } from "./useEmployees";

/**
 * 従業員作成用mutation
 *
 * @remarks
 * - 作成成功後、従業員一覧のクエリを無効化して再フェッチ
 * - 楽観的更新により、即座にUIに反映
 * - エラー時は自動的にロールバック
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

  return useMutation(
    createListOptimisticMutation<
      EmployeeSummary,
      EmployeeSummary,
      Error,
      EmployeeUpsertInput & { password: string }
    >(queryClient, {
      mutationFn: createEmployee,
      listQueryKey: EMPLOYEES_QUERY_KEY,
      itemQueryKey: (id) => queryKeys.employees.detail(Number(id)),
      operation: "create",
      getItem: (variables) => {
        // 楽観的な従業員データを生成（一時的なIDを使用）
        return {
          id: -Math.random(), // 一時的な負のID
          email: variables.email,
          firstName: variables.firstName,
          lastName: variables.lastName,
          admin: variables.admin,
        } satisfies EmployeeSummary;
      },
      invalidateQueries: [queryKeys.employees.all],
    })
  );
}

/**
 * 従業員更新用mutation
 *
 * @remarks
 * - 更新成功後、従業員一覧のクエリを無効化して再フェッチ
 * - passwordは任意（省略可能）
 * - 楽観的更新により、即座にUIに反映
 * - エラー時は自動的にロールバック
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

  return useMutation(
    createListOptimisticMutation<
      EmployeeSummary,
      EmployeeSummary,
      Error,
      EmployeeUpsertInput & { id: number; password?: string }
    >(queryClient, {
      mutationFn: ({ id, ...payload }) => updateEmployee(id, payload),
      listQueryKey: EMPLOYEES_QUERY_KEY,
      itemQueryKey: (id) => queryKeys.employees.detail(Number(id)),
      operation: "update",
      getItem: (variables) => {
        // 更新後の従業員データを生成
        return {
          id: variables.id,
          email: variables.email,
          firstName: variables.firstName,
          lastName: variables.lastName,
          admin: variables.admin,
        } satisfies EmployeeSummary;
      },
      invalidateQueries: [queryKeys.employees.all],
    })
  );
}

/**
 * 従業員削除用mutation（一括削除対応）
 *
 * @remarks
 * - 削除成功後、従業員一覧のクエリを無効化して再フェッチ
 * - 楽観的更新により、即座にUIから削除
 * - エラー時は自動的にロールバック
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
      // 複数IDの削除は並列実行で高速化
      await Promise.all(ids.map((id) => deleteEmployee(id)));
      return ids;
    },
    // 楽観的更新: 削除前にキャッシュから削除対象を除外
    onMutate: async (employeeIds) => {
      const ids = Array.isArray(employeeIds) ? employeeIds : [employeeIds];

      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: EMPLOYEES_QUERY_KEY });

      // 現在のキャッシュを保存（ロールバック用）
      const previousEmployees = queryClient.getQueryData<{
        employees: EmployeeSummary[];
      }>(EMPLOYEES_QUERY_KEY);

      // 楽観的にキャッシュを更新（削除対象を除外）
      if (previousEmployees) {
        queryClient.setQueryData<{ employees: EmployeeSummary[] }>(
          EMPLOYEES_QUERY_KEY,
          {
            employees: previousEmployees.employees.filter(
              (emp) => !ids.includes(emp.id)
            ),
          }
        );
      }

      // 個別の従業員詳細キャッシュも削除
      for (const id of ids) {
        queryClient.removeQueries({
          queryKey: queryKeys.employees.detail(id),
        });
      }

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
