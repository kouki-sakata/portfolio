import { QueryCache } from "@tanstack/react-query";

import {
  hasStatus,
  type StatusAwareError as StatusError,
} from "@/shared/api/errors";

/**
 * エラーインターセプター設定
 */
export type ErrorInterceptorConfig = {
  /** ログアウト処理 */
  onLogout: () => Promise<void>;
  /** リダイレクト処理 */
  onRedirect: (path: string) => void;
  /** ログインページのパス */
  loginPath?: string;
};

/**
 * 401エラーハンドリング
 * 未認証エラー時に自動ログアウト・リダイレクトを実行
 */
export const handle401Error = async (
  error: unknown,
  config: ErrorInterceptorConfig
): Promise<void> => {
  if (!hasStatus(error)) {
    return;
  }

  const statusError: StatusError = error;

  if (statusError.status === 401) {
    try {
      // ログアウト処理を実行
      await config.onLogout();
    } catch (_logoutError) {
      // ログアウトエラーは無視して処理を継続
    }

    // ログインページへリダイレクト
    const loginPath = config.loginPath ?? "/signin";
    config.onRedirect(loginPath);
  }
};

/**
 * グローバルエラーハンドラー作成
 * QueryClientのonErrorに設定する関数を生成
 */
export const createGlobalErrorHandler = (
  config: ErrorInterceptorConfig
): ((error: unknown) => void) => {
  return (error: unknown) => {
    // 401エラーの処理
    void handle401Error(error, config);

    // その他のエラー処理
    if (hasStatus(error)) {
      const statusError: StatusError = error;

      switch (statusError.status) {
        case 403:
          break;
        case 404:
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          break;
        default:
      }
    } else {
      // HTTPエラー以外は個別のエラー処理なし
    }
  };
};

/**
 * QueryCacheエラーハンドラー設定
 * React Queryのキャッシュレベルでエラーを捕捉
 */
export const createQueryCacheErrorHandler = (
  config: ErrorInterceptorConfig
): QueryCache =>
  new QueryCache({
    onError: (error: unknown) => {
      void handle401Error(error, config);
    },
  });
