import type { QueryClient, UseMutationOptions } from "@tanstack/react-query";

/**
 * 楽観的更新用のコンテキスト型
 */
export type OptimisticContext<TData> = {
  previousData?: TData;
};

/**
 * 楽観的更新の設定オプション
 */
export type OptimisticMutationOptions<
  TData,
  TError,
  TVariables,
  TQueryData = unknown,
> = {
  /** ミューテーション実行関数 */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /** 更新対象のクエリキー */
  queryKey:
    | readonly unknown[]
    | ((variables: TVariables) => readonly unknown[]);

  /** 楽観的更新の実行関数 */
  optimisticUpdater: (
    oldData: TQueryData | undefined,
    variables: TVariables
  ) => TQueryData;

  /** エラー時のロールバック処理（オプション） */
  rollbackHandler?: (error: TError, variables: TVariables) => void;

  /** 成功時の追加処理（オプション） */
  onSuccessHandler?: (data: TData, variables: TVariables) => void;

  /** 関連するクエリの無効化設定 */
  invalidateQueries?: readonly unknown[][];

  /** 楽観的更新を無効化するかどうか */
  disableOptimisticUpdate?: boolean;
};

/**
 * 楽観的更新を含むミューテーション設定を生成する高階関数
 *
 * @example
 * ```typescript
 * const updateEmployeeMutation = createOptimisticMutation({
 *   mutationFn: updateEmployee,
 *   queryKey: (variables) => queryKeys.employees.detail(variables.id),
 *   optimisticUpdater: (oldData, variables) => ({
 *     ...oldData,
 *     ...variables.data
 *   })
 * });
 * ```
 */
export const createOptimisticMutation = <
  TData = unknown,
  TError = Error,
  TVariables = void,
  TQueryData = unknown,
>(
  queryClient: QueryClient,
  options: OptimisticMutationOptions<TData, TError, TVariables, TQueryData>
): UseMutationOptions<
  TData,
  TError,
  TVariables,
  OptimisticContext<TQueryData>
> => {
  const {
    mutationFn,
    queryKey,
    optimisticUpdater,
    rollbackHandler,
    onSuccessHandler,
    invalidateQueries,
    disableOptimisticUpdate = false,
  } = options;

  return {
    mutationFn,

    onMutate: async (variables) => {
      if (disableOptimisticUpdate) {
        return {};
      }

      const resolvedQueryKey =
        typeof queryKey === "function" ? queryKey(variables) : queryKey;

      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: resolvedQueryKey });

      // 現在のデータをスナップショット
      const previousData =
        queryClient.getQueryData<TQueryData>(resolvedQueryKey);

      // 楽観的更新を適用
      queryClient.setQueryData(
        resolvedQueryKey,
        (oldData: TQueryData | undefined) =>
          optimisticUpdater(oldData, variables)
      );

      return { previousData };
    },

    onError: (error, variables, context) => {
      if (!disableOptimisticUpdate && context?.previousData !== undefined) {
        const resolvedQueryKey =
          typeof queryKey === "function" ? queryKey(variables) : queryKey;

        // エラー時はデータをロールバック
        queryClient.setQueryData(resolvedQueryKey, context.previousData);
      }

      // カスタムロールバックハンドラーを実行
      rollbackHandler?.(error, variables);
    },

    onSuccess: (data, variables) => {
      // カスタム成功ハンドラーを実行
      onSuccessHandler?.(data, variables);
    },

    onSettled: async (_data, _error, variables) => {
      const resolvedQueryKey =
        typeof queryKey === "function" ? queryKey(variables) : queryKey;

      // 対象のクエリを無効化
      await queryClient.invalidateQueries({ queryKey: resolvedQueryKey });

      // 関連するクエリも無効化
      if (invalidateQueries && invalidateQueries.length > 0) {
        await Promise.all(
          invalidateQueries.map((key) =>
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      }
    },
  };
};

/**
 * リスト系データの楽観的更新ヘルパー
 * 新規追加、更新、削除の共通パターンを提供
 */
export const createListOptimisticMutation = <
  TItem extends { id: number | string },
  TData = unknown,
  TError = Error,
  TVariables = void,
>(
  queryClient: QueryClient,
  options: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    listQueryKey: readonly unknown[];
    itemQueryKey?: (id: number | string) => readonly unknown[];
    operation: "create" | "update" | "delete";
    getItem: (variables: TVariables) => TItem;
    invalidateQueries?: readonly unknown[][];
  }
): UseMutationOptions<
  TData,
  TError,
  TVariables,
  OptimisticContext<TItem[]>
> => {
  const {
    mutationFn,
    listQueryKey,
    itemQueryKey,
    operation,
    getItem,
    invalidateQueries,
  } = options;

  return {
    mutationFn,

    onMutate: async (variables) => {
      // リストクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: listQueryKey });

      // 現在のリストデータをスナップショット
      const previousList = queryClient.getQueryData<TItem[]>(listQueryKey);

      const item = getItem(variables);

      // 操作に応じてリストを更新
      queryClient.setQueryData<TItem[]>(listQueryKey, (old = []) => {
        switch (operation) {
          case "create":
            return [...old, item];
          case "update":
            return old.map((i) => (i.id === item.id ? item : i));
          case "delete":
            return old.filter((i) => i.id !== item.id);
          default:
            return old;
        }
      });

      // アイテム個別のキャッシュも更新
      if (itemQueryKey && operation !== "delete") {
        queryClient.setQueryData(itemQueryKey(item.id), item);
      }

      return { previousData: previousList };
    },

    onError: (_error, _variables, context) => {
      // エラー時はリストをロールバック
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(listQueryKey, context.previousData);
      }
    },

    onSettled: async () => {
      // リストを無効化
      await queryClient.invalidateQueries({ queryKey: listQueryKey });

      // 関連するクエリも無効化
      if (invalidateQueries && invalidateQueries.length > 0) {
        await Promise.all(
          invalidateQueries.map((key) =>
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      }
    },
  };
};

/**
 * ページネーション対応の楽観的更新ヘルパー
 */
export const createPaginatedOptimisticMutation = <
  TItem extends { id: number | string },
  TData = unknown,
  TError = Error,
  TVariables extends { page?: number } = { page?: number },
>(
  queryClient: QueryClient,
  options: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    pageQueryKey: (page: number) => readonly unknown[];
    operation: "create" | "update" | "delete";
    getItem: (variables: TVariables) => TItem;
    currentPage: number;
  }
): UseMutationOptions<
  TData,
  TError,
  TVariables,
  OptimisticContext<{ items: TItem[]; total: number }>
> => {
  const { mutationFn, pageQueryKey, operation, getItem, currentPage } = options;

  return {
    mutationFn,

    onMutate: async (variables) => {
      const targetPage = variables.page || currentPage;
      const targetQueryKey = pageQueryKey(targetPage);

      // ページクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: targetQueryKey });

      // 現在のページデータをスナップショット
      const previousPageData = queryClient.getQueryData<{
        items: TItem[];
        total: number;
      }>(targetQueryKey);

      const item = getItem(variables);

      // ページデータを更新
      queryClient.setQueryData<{ items: TItem[]; total: number }>(
        targetQueryKey,
        (old) => {
          if (!old) {
            return old;
          }

          switch (operation) {
            case "create":
              return {
                items: [...old.items, item],
                total: old.total + 1,
              };
            case "update":
              return {
                items: old.items.map((i) => (i.id === item.id ? item : i)),
                total: old.total,
              };
            case "delete":
              return {
                items: old.items.filter((i) => i.id !== item.id),
                total: old.total - 1,
              };
            default:
              return old;
          }
        }
      );

      return { previousData: previousPageData };
    },

    onError: (_error, variables, context) => {
      const targetPage = variables.page || currentPage;
      const targetQueryKey = pageQueryKey(targetPage);

      // エラー時はページデータをロールバック
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(targetQueryKey, context.previousData);
      }
    },

    onSettled: async (_, __, variables) => {
      const targetPage = variables.page || currentPage;

      // 全ページを無効化
      await queryClient.invalidateQueries({
        queryKey: pageQueryKey(targetPage)[0] as unknown[],
        exact: false,
      });
    },
  };
};

/**
 * 複数の楽観的更新を同時に実行するヘルパー
 */
export const createBatchOptimisticMutation = <
  TData = unknown,
  TError = Error,
  TVariables = void,
>(
  queryClient: QueryClient,
  options: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    updates: Array<{
      queryKey:
        | readonly unknown[]
        | ((variables: TVariables) => readonly unknown[]);
      updater: (oldData: unknown, variables: TVariables) => unknown;
    }>;
  }
): UseMutationOptions<TData, TError, TVariables, Record<string, unknown>> => {
  const { mutationFn, updates } = options;

  return {
    mutationFn,

    onMutate: async (variables) => {
      const previousDataMap: Record<string, unknown> = {};

      // すべての更新を並列で実行
      await Promise.all(
        updates.map(async (update, index) => {
          const resolvedQueryKey =
            typeof update.queryKey === "function"
              ? update.queryKey(variables)
              : update.queryKey;

          await queryClient.cancelQueries({ queryKey: resolvedQueryKey });

          const previousData = queryClient.getQueryData(resolvedQueryKey);
          previousDataMap[`data_${index}`] = previousData;

          queryClient.setQueryData(resolvedQueryKey, (oldData) =>
            update.updater(oldData, variables)
          );
        })
      );

      return previousDataMap;
    },

    onError: (_error, variables, context) => {
      if (!context) {
        return;
      }

      // すべての更新をロールバック
      updates.forEach((update, index) => {
        const resolvedQueryKey =
          typeof update.queryKey === "function"
            ? update.queryKey(variables)
            : update.queryKey;

        const previousData = context[`data_${index}`];
        if (previousData !== undefined) {
          queryClient.setQueryData(resolvedQueryKey, previousData);
        }
      });
    },

    onSettled: async (_data, _error, variables) => {
      // すべてのクエリを無効化
      await Promise.all(
        updates.map((update) => {
          const resolvedQueryKey =
            typeof update.queryKey === "function"
              ? update.queryKey(variables)
              : update.queryKey;

          return queryClient.invalidateQueries({ queryKey: resolvedQueryKey });
        })
      );
    },
  };
};

/**
 * デバウンス付き楽観的更新ヘルパー
 * 頻繁な更新を抑制しつつ楽観的更新を実現
 */
export const createDebouncedOptimisticMutation = <
  TData = unknown,
  TError = Error,
  TVariables = void,
  TQueryData = unknown,
>(
  queryClient: QueryClient,
  options: OptimisticMutationOptions<TData, TError, TVariables, TQueryData> & {
    debounceMs?: number;
  }
): UseMutationOptions<
  TData,
  TError,
  TVariables,
  OptimisticContext<TQueryData>
> => {
  let timeoutId: NodeJS.Timeout | null = null;

  const baseOptions = createOptimisticMutation(queryClient, options);

  return {
    ...baseOptions,
    mutationFn: (variables) => {
      // 既存のタイマーをキャンセル
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // デバウンス処理
      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await options.mutationFn(variables);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, options.debounceMs || 300);
      });
    },
  };
};
