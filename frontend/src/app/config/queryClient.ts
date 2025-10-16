import { QueryCache, QueryClient } from "@tanstack/react-query";

import { createGlobalErrorHandler } from "@/app/config/error-interceptor";

type QueryConfigItem = {
  readonly staleTime: number;
  readonly gcTime: number;
};

/**
 * 機能別のデフォルト設定
 * 各機能のデータ特性に応じて最適なキャッシュ戦略を定義
 */
export const QUERY_CONFIG = {
  // 認証関連: セッション情報など、比較的短いキャッシュ
  auth: {
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 10 * 60 * 1000, // 10分
  },
  // 従業員管理: 更新頻度は低いが即時反映も求められる
  employees: {
    staleTime: 10 * 60 * 1000, // 10分
    gcTime: 30 * 60 * 1000, // 30分
  },
  // お知らせ管理: 管理者更新頻度を考慮しつつ即時性も確保
  news: {
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 10 * 60 * 1000, // 10分
  },
  // ホームダッシュボード: リアルタイム性が高い
  homeDashboard: {
    staleTime: 60 * 1000, // 1分
    gcTime: 5 * 60 * 1000, // 5分
  },
  // 打刻履歴: 月次単位での利用が多く、一定期間保持する
  stampHistory: {
    staleTime: 2 * 60 * 1000, // 2分
    gcTime: 10 * 60 * 1000, // 10分
  },
  // デフォルト: 動的データの一般的な設定
  dynamic: {
    staleTime: 30 * 1000, // 30秒
    gcTime: 5 * 60 * 1000, // 5分
  },
} as const satisfies Record<string, QueryConfigItem>;

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
  redirect: (path: string) => void,
  loginPath = "/signin"
): void => {
  globalErrorHandler = createGlobalErrorHandler({
    onLogout: logout,
    onRedirect: redirect,
    loginPath,
  });
};
