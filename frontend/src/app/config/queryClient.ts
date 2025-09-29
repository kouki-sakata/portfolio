import { QueryCache, QueryClient } from "@tanstack/react-query";

import { createGlobalErrorHandler } from "@/app/config/error-interceptor";

/**
 * 機能別のデフォルト設定
 * 各機能のデータ特性に応じて最適なキャッシュ戦略を定義
 */
export const QUERY_CONFIG = {
  // 認証関連: セッション情報など、比較的短いキャッシュ
  auth: {
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 10 * 60 * 1000, // 10分（旧cacheTime）
  },
  // マスターデータ: 従業員マスタなど、変更頻度が低いデータ
  master: {
    staleTime: 30 * 60 * 1000, // 30分
    gcTime: 60 * 60 * 1000, // 60分
  },
  // 動的データ: 打刻履歴など、リアルタイム性が求められるデータ
  dynamic: {
    staleTime: 30 * 1000, // 30秒
    gcTime: 5 * 60 * 1000, // 5分
  },
} as const;

/**
 * QueryClient設定を作成
 * エラーインターセプターは後から設定される
 */
let globalErrorHandler: ((error: unknown) => void) | undefined;

const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (globalErrorHandler) {
          globalErrorHandler(error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        // デフォルトは動的データの設定を使用
        staleTime: QUERY_CONFIG.dynamic.staleTime,
        gcTime: QUERY_CONFIG.dynamic.gcTime,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

export const queryClient = createQueryClient();

/**
 * エラーインターセプターを設定
 * AuthProviderから呼び出される
 */
export const configureQueryClientErrorHandler = (
  logout: () => Promise<void>,
  redirect: (path: string) => void
): void => {
  globalErrorHandler = createGlobalErrorHandler({
    onLogout: logout,
    onRedirect: redirect,
    loginPath: "/auth/signin",
  });
};
