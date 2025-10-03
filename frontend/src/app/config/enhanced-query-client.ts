import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import {
  classifyError,
  isAuthenticationError,
  isNetworkError,
} from "@/shared/api/errors";
import type { ToastOptions } from "@/shared/error-handling";
import {
  ConsoleErrorLogger,
  GlobalErrorHandler,
} from "@/shared/error-handling";

/**
 * クエリ設定の型定義
 *
 * @remarks
 * TypeScript v5 satisfies演算子のための型定義
 */
type QueryConfigItem = {
  readonly staleTime: number;
  readonly gcTime: number;
};

/**
 * 機能別のデフォルト設定
 * 各機能のデータ特性に応じて最適なキャッシュ戦略を定義
 *
 * @remarks
 * TypeScript v5のsatisfies演算子を使用し、
 * 型の制約を満たしつつ具体的な値の型を保持
 */
export const QUERY_CONFIG = {
  auth: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  employees: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  homeDashboard: {
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  },
  stampHistory: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  dynamic: {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  },
} as const satisfies Record<string, QueryConfigItem>;

/**
 * React Query統合設定
 */
export type QueryClientConfig = {
  /**
   * Toast表示関数
   */
  toast: (options: ToastOptions) => void;

  /**
   * ログアウト処理
   */
  onLogout?: () => Promise<void>;

  /**
   * リダイレクト処理
   */
  onRedirect?: (path: string) => void;

  /**
   * 再試行処理
   */
  onRetry?: () => void;

  /**
   * ログインページのパス
   */
  loginPath?: string;

  /**
   * 環境
   */
  environment?: "development" | "production";
};

/**
 * エラー再試行判定
 * ネットワークエラーや一時的なエラーの場合のみ再試行
 */
const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  // 最大3回まで再試行
  if (failureCount >= 3) {
    return false;
  }

  const classifiedError = classifyError(
    error instanceof Error ? error : new Error(String(error))
  );

  // ネットワークエラーは再試行可能
  if (isNetworkError(classifiedError)) {
    return true;
  }

  // 500番台のサーバーエラーは再試行
  if ("status" in classifiedError && classifiedError.status >= 500) {
    return true;
  }

  // 認証エラーは再試行しない
  if (isAuthenticationError(classifiedError)) {
    return false;
  }

  return false;
};

/**
 * エラーハンドリング関数
 * QueryCacheとMutationCacheで共通使用
 */
const handleQueryError = (error: unknown, config: QueryClientConfig): void => {
  const classifiedError = classifyError(
    error instanceof Error ? error : new Error(String(error))
  );

  // 認証エラーの場合は自動ログアウト＆リダイレクト
  if (
    isAuthenticationError(classifiedError) &&
    config.onLogout &&
    config.onRedirect
  ) {
    // ログアウト処理を非同期で実行
    const handleAuthLogout = async (): Promise<void> => {
      try {
        await config.onLogout?.();
      } catch (logoutError) {
        // ログアウトエラーは無視（認証トークンが既に無効な可能性があるため）
        if (config.environment === "development") {
          // biome-ignore lint/suspicious/noConsole: Development-only debugging output
          console.warn("Logout error during auth error handling:", logoutError);
        }
      }
      const loginPath = config.loginPath || "/auth/signin";
      config.onRedirect?.(loginPath);
    };

    // fire-and-forgetパターン: Promiseのcatchで明示的にエラーを無視
    handleAuthLogout().catch(() => {
      // すでにエラー状態のため、ログアウト失敗は意図的に無視
    });

    // 認証エラーはGlobalErrorHandlerでは処理しない（Toast表示しないため）
    return;
  }

  // その他のエラーはGlobalErrorHandlerで処理
  try {
    const errorHandler = GlobalErrorHandler.getInstance();
    errorHandler.handle(classifiedError);
  } catch (handlerError) {
    // GlobalErrorHandler自体が失敗してもアプリケーションをクラッシュさせない
    // 開発環境ではデバッグのためログ出力
    if (config.environment === "development") {
      // biome-ignore lint/suspicious/noConsole: Development-only debugging output
      console.error("GlobalErrorHandler failed to handle error:", handlerError);
      // biome-ignore lint/suspicious/noConsole: Development-only debugging output
      console.error("Original error:", classifiedError);
    }
  }
};

/**
 * 強化されたQueryClientを作成
 *
 * @description
 * React 19 Suspense統合について:
 * - デフォルトではsuspense: falseで通常のuseQuery動作を維持
 * - Suspenseを使いたい場合は明示的にuseSuspenseQueryを使用
 * - useSuspenseQueryは自動的にSuspenseモードで動作
 * - SuspenseWrapperコンポーネントと組み合わせて使用を推奨
 *
 * @example
 * ```tsx
 * // Suspenseを使用する場合
 * import { useSuspenseQuery } from "@tanstack/react-query";
 * import { SuspenseWrapper } from "@/shared/components/loading";
 *
 * <SuspenseWrapper fallbackType="skeleton-card">
 *   <ComponentUsingSuspenseQuery />
 * </SuspenseWrapper>
 * ```
 */
export const createEnhancedQueryClient = (
  config: QueryClientConfig
): QueryClient => {
  // GlobalErrorHandlerを初期化
  GlobalErrorHandler.initialize({
    toast: config.toast,
    logger: new ConsoleErrorLogger(config.environment || "production"),
    environment: config.environment || "production",
    enableToast: true,
    enableLogging: true,
    onRetry: config.onRetry,
  });

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => handleQueryError(error, config),
    }),
    mutationCache: new MutationCache({
      onError: (error) => handleQueryError(error, config),
    }),
    defaultOptions: {
      queries: {
        // デフォルトは動的データの設定を使用
        staleTime: QUERY_CONFIG.dynamic.staleTime,
        gcTime: QUERY_CONFIG.dynamic.gcTime,
        retry: shouldRetryQuery,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 30_000), // 指数バックオフ
        refetchOnWindowFocus: false,
        // ネットワークエラー時は自動的に再接続時に再試行
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (failureCount, error) => {
          // ミューテーションは基本的に再試行しない
          // ただしネットワークエラーの場合は1回だけ再試行
          if (failureCount >= 1) {
            return false;
          }
          const classifiedError = classifyError(
            error instanceof Error ? error : new Error(String(error))
          );
          return isNetworkError(classifiedError);
        },
        retryDelay: 1000,
      },
    },
  });
};

/**
 * 特定のクエリキーのキャッシュをクリア
 */
export const clearQueryCache = (
  queryClient: QueryClient,
  queryKey?: string[]
): void => {
  if (queryKey) {
    queryClient.invalidateQueries({ queryKey });
  } else {
    queryClient.clear();
  }
};

/**
 * エラー時にクエリを再試行
 */
export const retryFailedQueries = (queryClient: QueryClient): Promise<void> =>
  queryClient.refetchQueries({
    predicate: (query) =>
      query.state.fetchStatus === "idle" && query.state.status === "error",
  });

/**
 * React Queryのエラーリセット用Hook
 * ErrorBoundaryのreset時に使用
 */
export const useQueryErrorReset = (queryClient: QueryClient) => {
  return () => {
    // エラー状態のクエリをリセット
    queryClient.resetQueries();
    // 再フェッチ（エラーは無視）
    retryFailedQueries(queryClient).catch(() => {
      // リトライ失敗は無視（すでにエラー状態）
    });
  };
};
