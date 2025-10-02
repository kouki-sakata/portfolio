import type { QueryClient } from "@tanstack/react-query";

/**
 * 型安全なクエリキーファクトリーパターン
 * 各機能のクエリキーを一元管理し、型安全性を保証
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
  keysList: readonly (readonly unknown[])[]
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

/**
 * 関連データの選択的無効化
 * アクションタイプに応じて関連するクエリのみを無効化
 */
export const invalidateRelatedQueries = async (
  queryClient: QueryClient,
  action: {
    type: string;
    payload?: unknown;
  }
): Promise<void> => {
  const invalidationMap: Record<
    string,
    readonly (readonly unknown[])[] | (() => readonly (readonly unknown[])[])
  > = {
    // 従業員関連
    "employee.create": [queryKeys.employees.all],
    "employee.update": () => {
      const id = (action.payload as { id: number })?.id;
      return id
        ? [queryKeys.employees.detail(id), queryKeys.employees.list()]
        : [queryKeys.employees.all];
    },
    "employee.delete": [queryKeys.employees.all],

    // 打刻関連
    "stamp.create": [queryKeys.home.dashboard(), queryKeys.stampHistory.all],
    "stamp.update": () => {
      const filters = action.payload as { year?: number; month?: number };
      return filters
        ? [queryKeys.stampHistory.list(filters), queryKeys.home.dashboard()]
        : [queryKeys.stampHistory.all, queryKeys.home.dashboard()];
    },
    "stamp.delete": () => {
      const filters = action.payload as { year?: number; month?: number };
      return filters
        ? [queryKeys.stampHistory.list(filters), queryKeys.home.dashboard()]
        : [queryKeys.stampHistory.all, queryKeys.home.dashboard()];
    },

    // お知らせ関連
    "news.update": [queryKeys.home.news(), queryKeys.home.dashboard()],

    // セッション関連
    "session.expired": [queryKeys.auth.all],
  };

  const mapValue = invalidationMap[action.type];

  const keysToInvalidate: readonly (readonly unknown[])[] | undefined =
    typeof mapValue === "function"
      ? (mapValue as () => readonly (readonly unknown[])[])()
      : mapValue;

  if (keysToInvalidate) {
    await invalidateMultipleQueries(queryClient, keysToInvalidate);
  }
};

/**
 * バックグラウンド更新
 * UIをブロックせずにデータを更新
 */
export const backgroundRefetch = (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  options?: {
    stale?: boolean;
    type?: "all" | "active" | "inactive";
  }
): Promise<void> =>
  queryClient.refetchQueries({
    queryKey,
    type: options?.type || "active",
    stale: options?.stale !== undefined ? options.stale : true,
  });

/**
 * 条件付き無効化
 * 特定の条件が満たされた場合のみ無効化
 */
export const conditionalInvalidate = async (
  queryClient: QueryClient,
  condition: boolean | (() => boolean),
  queryKey: readonly unknown[]
): Promise<void> => {
  const shouldInvalidate =
    typeof condition === "function" ? condition() : condition;

  if (shouldInvalidate) {
    await queryClient.invalidateQueries({ queryKey });
  }
};

/**
 * 段階的無効化
 * 重要度に応じて段階的にキャッシュを無効化
 */
export const cascadeInvalidate = async (
  queryClient: QueryClient,
  primaryKeys: readonly (readonly unknown[])[],
  secondaryKeys?: readonly (readonly unknown[])[],
  delayMs = 100
): Promise<void> => {
  // まず主要なクエリを無効化
  await invalidateMultipleQueries(queryClient, primaryKeys);

  // 少し遅延してから副次的なクエリを無効化
  if (secondaryKeys && secondaryKeys.length > 0) {
    setTimeout(() => {
      invalidateMultipleQueries(queryClient, secondaryKeys).catch(() => {
        // エラーは無視（副次的な無効化のため）
      });
    }, delayMs);
  }
};

/**
 * 部分一致での無効化
 * クエリキーの一部が一致するものを無効化
 */
export const invalidatePartialMatch = async (
  queryClient: QueryClient,
  partialKey: readonly unknown[]
): Promise<void> => {
  await queryClient.invalidateQueries({
    queryKey: partialKey,
    exact: false,
  });
};

/**
 * スマートな無効化戦略
 * データの鮮度と重要度に基づいて無効化を制御
 */
export const smartInvalidate = async (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  options?: {
    force?: boolean;
    maxStaleTime?: number;
    skipIfFresh?: boolean;
  }
): Promise<void> => {
  const {
    force = false,
    maxStaleTime = 60_000,
    skipIfFresh = true,
  } = options || {};

  // 強制無効化の場合
  if (force) {
    await queryClient.invalidateQueries({ queryKey });
    return;
  }

  // クエリの状態を確認
  const queries = queryClient.getQueryCache().findAll({ queryKey });

  for (const query of queries) {
    const dataUpdatedAt = query.state.dataUpdatedAt;
    const now = Date.now();
    const timeSinceUpdate = now - dataUpdatedAt;

    // データが新鮮な場合はスキップ
    if (skipIfFresh && timeSinceUpdate < maxStaleTime) {
      continue;
    }

    // 個別に無効化
    await queryClient.invalidateQueries({
      queryKey: query.queryKey,
      exact: true,
    });
  }
};
