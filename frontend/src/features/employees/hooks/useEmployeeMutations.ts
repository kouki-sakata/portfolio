import {
  mutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/shared/utils/queryUtils";
import { createEmployee, deleteEmployee, updateEmployee } from "../api";
import type { EmployeeListResponse, EmployeeUpsertInput } from "../types";
import { EMPLOYEES_QUERY_KEY } from "./useEmployees";

/**
 * 従業員作成用mutationオプション定義
 *
 * @remarks
 * TypeScript v5のベストプラクティスに従い、mutationOptions関数を使用
 */
export const createEmployeeMutationOptions = () =>
  mutationOptions({
    mutationKey: ["employees", "create"] as const,
    mutationFn: (payload: EmployeeUpsertInput & { password: string }) =>
      createEmployee(payload),
  });

/**
 * 従業員作成用mutation
 *
 * @remarks
 * - 楽観的更新で新規従業員を一時的にリストへ追加
 * - エラー時にはキャッシュをロールバック
 * - 完了時に関連クエリを再検証
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    ...createEmployeeMutationOptions(),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.employees.all,
      });

      const previousData =
        queryClient.getQueryData<EmployeeListResponse>(EMPLOYEES_QUERY_KEY);

      queryClient.setQueryData<EmployeeListResponse>(
        EMPLOYEES_QUERY_KEY,
        (old) => ({
          employees: [
            ...(old?.employees ?? []),
            {
              id: Number.MIN_SAFE_INTEGER,
              firstName: payload.firstName,
              lastName: payload.lastName,
              email: payload.email,
              admin: payload.admin,
            },
          ],
        })
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(EMPLOYEES_QUERY_KEY, context.previousData);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees.all,
      });
    },
  });
}

/**
 * 従業員更新用mutation
 *
 * @remarks
 * - 楽観的更新で対象従業員の情報を更新
 * - エラー時に元のキャッシュへ復元
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: EmployeeUpsertInput & { id: number; password?: string }) =>
      updateEmployee(id, payload),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.employees.all,
      });

      const previousData =
        queryClient.getQueryData<EmployeeListResponse>(EMPLOYEES_QUERY_KEY);

      queryClient.setQueryData<EmployeeListResponse>(
        EMPLOYEES_QUERY_KEY,
        (old) => {
          if (!old?.employees) {
            return old;
          }
          return {
            employees: old.employees.map((employee) =>
              employee.id === variables.id
                ? {
                    ...employee,
                    firstName: variables.firstName ?? employee.firstName,
                    lastName: variables.lastName ?? employee.lastName,
                    email: variables.email ?? employee.email,
                    admin: variables.admin ?? employee.admin,
                  }
                : employee
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(EMPLOYEES_QUERY_KEY, context.previousData);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees.all,
      });
    },
  });
}

/**
 * 従業員削除用mutation（一括削除対応）
 *
 * @remarks
 * - 楽観的更新で削除対象従業員をリストから除外
 * - エラー時にキャッシュをロールバック
 */
export function useDeleteEmployees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeIds: number | number[]) => {
      const ids = Array.isArray(employeeIds) ? employeeIds : [employeeIds];
      await deleteEmployee(ids);
    },
    onMutate: async (employeeIds) => {
      const ids = Array.isArray(employeeIds) ? employeeIds : [employeeIds];

      await queryClient.cancelQueries({
        queryKey: queryKeys.employees.all,
      });

      const previousData =
        queryClient.getQueryData<EmployeeListResponse>(EMPLOYEES_QUERY_KEY);

      queryClient.setQueryData<EmployeeListResponse>(
        EMPLOYEES_QUERY_KEY,
        (old) => {
          if (!old?.employees) {
            return old;
          }
          return {
            employees: old.employees.filter((emp) => !ids.includes(emp.id)),
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(EMPLOYEES_QUERY_KEY, context.previousData);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees.all,
      });
    },
  });
}
