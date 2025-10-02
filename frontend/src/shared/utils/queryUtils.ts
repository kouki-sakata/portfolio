import type { QueryClient } from "@tanstack/react-query";

/**
 * クエリキーを作成するヘルパー関数
 *
 * @remarks
 * TypeScript v5のconst type parameterを使用して、
 * リテラル型を保持したままクエリキーを生成
 *
 * @example
 * ```ts
 * const key = createQueryKey(['users', { id: 1 }]);
 * // key の型: readonly ['users', { readonly id: 1 }]
 * ```
 */
export function createQueryKey<const T extends readonly unknown[]>(key: T): T {
  return key;
}

/**
 * ミューテーションキーを作成するヘルパー関数
 *
 * @remarks
 * TypeScript v5のconst type parameterを使用
 *
 * @example
 * ```ts
 * const key = createMutationKey(['users', 'update', 1]);
 * // key の型: readonly ['users', 'update', 1]
 * ```
 */
export function createMutationKey<const T extends readonly unknown[]>(
  key: T
): T {
  return key;
}

/**
 * クエリキーファクトリーの型定義
 *
 * @remarks
 * TypeScript v5 satisfies演算子のための型定義
 */
type QueryKeysConfig = {
  readonly [key: string]: {
    readonly all: readonly unknown[];
    readonly [method: string]:
      | readonly unknown[]
      | ((...args: unknown[]) => readonly unknown[]);
  };
};

/**
 * 型安全なクエリキーファクトリーパターン
 * 各機能のクエリキーを一元管理し、型安全性を保証
 *
 * @remarks
 * TypeScript v5のsatisfies演算子を使用して
 * 型制約を満たしつつ具体的な値の型を保持
 */
export const queryKeys = {
  // 認証関連
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
    user: (userId: string) => [...queryKeys.auth.all, "user", userId] as const,
  },

  // 従業員管理
  employees: {
    all: ["employees"] as const,
    list: (filters?: { page?: number; search?: string }) =>
      [...queryKeys.employees.all, "list", filters] as const,
    detail: (id: number) => [...queryKeys.employees.all, "detail", id] as const,
  },

  // 打刻履歴
  stampHistory: {
    all: ["stampHistory"] as const,
    list: (filters?: { year?: number; month?: number; employeeId?: number }) =>
      [...queryKeys.stampHistory.all, "list", filters] as const,
    detail: (id: number) =>
      [...queryKeys.stampHistory.all, "detail", id] as const,
  },

  // ホーム画面
  home: {
    all: ["home"] as const,
    dashboard: () => [...queryKeys.home.all, "dashboard"] as const,
    news: () => [...queryKeys.home.all, "news"] as const,
  },
} as const satisfies QueryKeysConfig;

/**
 * 特定のキーに関連するすべてのクエリを無効化するヘルパー関数
 */
export const invalidateQueries = async (
  queryClient: QueryClient,
  keys: readonly unknown[]
): Promise<void> => {
  await queryClient.invalidateQueries({ queryKey: keys });
};

/**
 * 複数のキーを一度に無効化するヘルパー関数
 */
export const invalidateMultipleQueries = async (
  queryClient: QueryClient,
  keysList: readonly unknown[][]
): Promise<void> => {
  await Promise.all(
    keysList.map((keys) => queryClient.invalidateQueries({ queryKey: keys }))
  );
};

/**
 * 楽観的更新のためのユーティリティ関数
 */
export const optimisticUpdate = <TData>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: (oldData: TData | undefined) => TData
): TData | undefined => {
  const previousData = queryClient.getQueryData<TData>(queryKey);
  queryClient.setQueryData(queryKey, updater);
  return previousData;
};

/**
 * 楽観的更新のロールバック用ユーティリティ関数
 */
export const rollbackOptimisticUpdate = <TData>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  previousData: TData | undefined
): void => {
  if (previousData !== undefined) {
    queryClient.setQueryData(queryKey, previousData);
  } else {
    queryClient.removeQueries({ queryKey });
  }
};

/**
 * すべてのキャッシュをクリアするヘルパー関数
 * ログアウト時などに使用
 */
export const clearAllCaches = (queryClient: QueryClient): void => {
  queryClient.clear();
};

/**
 * 特定の機能に関連するキャッシュのみをクリアするヘルパー関数
 */
export const clearFeatureCaches = (
  queryClient: QueryClient,
  feature: keyof typeof queryKeys
): void => {
  queryClient.removeQueries({ queryKey: queryKeys[feature].all });
};
