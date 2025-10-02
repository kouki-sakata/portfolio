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
 * 機能別のデフォルト設定
 * 各機能のデータ特性に応じて最適なキャッシュ戦略を定義
 *
 * @description
 * - staleTime: データがfreshからstaleになるまでの時間（この間は再フェッチされない）
 * - gcTime: 非アクティブなクエリがガベージコレクションされるまでの時間（旧cacheTime）
 */
export const QUERY_CONFIG = {
  // 認証関連: セッション情報とCSRFトークンで異なる戦略
  auth: {
    session: {
      staleTime: 5 * 60 * 1000, // 5分 - セッションは定期的に確認
      gcTime: 10 * 60 * 1000, // 10分 - セッション情報は短めに保持
    },
    csrf: {
      staleTime: 30 * 60 * 1000, // 30分 - CSRFトークンは長めに保持
      gcTime: 60 * 60 * 1000, // 60分
    },
  },
  // マスターデータ: 変更頻度が低いデータ
  master: {
    employees: {
      staleTime: 30 * 60 * 1000, // 30分 - 従業員情報は頻繁には変わらない
      gcTime: 60 * 60 * 1000, // 60分 - 長期間キャッシュ保持
    },
    departments: {
      staleTime: 60 * 60 * 1000, // 60分 - 部署情報はほぼ変わらない
      gcTime: 120 * 60 * 1000, // 120分 - 非常に長期間保持
    },
    roles: {
      staleTime: 60 * 60 * 1000, // 60分 - 権限情報もほぼ変わらない
      gcTime: 120 * 60 * 1000, // 120分
    },
  },
  // 動的データ: リアルタイム性が求められるデータ
  dynamic: {
    stampHistory: {
      staleTime: 30 * 1000, // 30秒 - 打刻履歴は最新を表示
      gcTime: 5 * 60 * 1000, // 5分 - 短期間のみキャッシュ
    },
    dashboard: {
      staleTime: 60 * 1000, // 60秒 - ダッシュボードは程よく新鮮に
      gcTime: 10 * 60 * 1000, // 10分
    },
    news: {
      staleTime: 5 * 60 * 1000, // 5分 - お知らせは頻繁には更新されない
      gcTime: 15 * 60 * 1000, // 15分
    },
    currentStamp: {
      staleTime: 10 * 1000, // 10秒 - 現在の打刻状態は即座に反映
      gcTime: 60 * 1000, // 1分 - 短期間のみ保持
    },
  },
  // ページネーション関連: リスト表示のキャッシュ戦略
  pagination: {
    employees: {
      staleTime: 5 * 60 * 1000, // 5分 - ページ毎のキャッシュ
      gcTime: 15 * 60 * 1000, // 15分
    },
    stampHistory: {
      staleTime: 60 * 1000, // 1分 - 履歴ページは短めに
      gcTime: 5 * 60 * 1000, // 5分
    },
    logs: {
      staleTime: 2 * 60 * 1000, // 2分 - ログは中程度の鮮度
      gcTime: 10 * 60 * 1000, // 10分
    },
  },
} as const;

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
        // デフォルトは動的データのダッシュボード設定を使用
        staleTime: QUERY_CONFIG.dynamic.dashboard.staleTime,
        gcTime: QUERY_CONFIG.dynamic.dashboard.gcTime,
        retry: shouldRetryQuery,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 30_000), // 指数バックオフ（最大30秒）
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
