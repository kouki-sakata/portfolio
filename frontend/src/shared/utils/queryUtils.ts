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
 * 認証関連のクエリキー
 */
const authKeys = {
  all: ["auth"] as const,
  session: () => ["auth", "session"] as const,
  user: (userId: string) => ["auth", "user", userId] as const,
} as const;

/**
 * 従業員管理のクエリキー
 */
const employeesKeys = {
  all: ["employees"] as const,
  list: (filters: { page?: number; search?: string } = {}) =>
    ["employees", "list", filters] as const,
  detail: (id: number) => ["employees", "detail", id] as const,
} as const;

/**
 * 打刻履歴のクエリキー
 */
const stampHistoryKeys = {
  all: ["stampHistory"] as const,
  list: (
    filters: {
      year?: number | string;
      month?: number | string;
      employeeId?: number;
    } = {}
  ) => ["stampHistory", "list", filters] as const,
  detail: (id: number) => ["stampHistory", "detail", id] as const,
} as const;

/**
 * ホーム画面のクエリキー
 */
const homeKeys = {
  all: ["home"] as const,
  dashboard: () => ["home", "dashboard"] as const,
  news: () => ["home", "news"] as const,
} as const;

/**
 * お知らせ管理のクエリキー
 */
const newsKeys = {
  all: ["news"] as const,
  list: () => ["news"] as const,
  published: () => ["news", "published"] as const,
  detail: (id: number) => ["news", id] as const,
} as const;

/**
 * 打刻修正ワークフローのクエリキー
 */
const stampRequestKeys = {
  all: ["stampRequests"] as const,
  my: (
    params: {
      status?: string;
      page?: number;
      pageSize?: number;
      search?: string;
      sort?: string;
    } = {}
  ) => ["stampRequests", "my", params] as const,
  pending: (
    params: {
      status?: string;
      page?: number;
      pageSize?: number;
      search?: string;
      sort?: string;
    } = {}
  ) => ["stampRequests", "pending", params] as const,
  detail: (id: number) => ["stampRequests", "detail", id] as const,
} as const;

/**
 * 型安全なクエリキーファクトリーパターン
 * 各機能のクエリキーを一元管理し、型安全性を保証
 *
 * @remarks
 * TypeScript v5で循環参照を避けるため、各機能のキーを個別に定義してから統合
 * これにより、厳格な型チェックモードでもエラーなくビルドできる
 */
export const queryKeys = {
  auth: authKeys,
  employees: employeesKeys,
  stampHistory: stampHistoryKeys,
  home: homeKeys,
  news: newsKeys,
  stampRequests: stampRequestKeys,
} as const;

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
