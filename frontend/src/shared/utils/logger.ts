/**
 * 開発環境専用のロガーユーティリティ
 * 本番環境とテスト環境では出力を抑制します
 */
export const logger = {
  /**
   * デバッグレベルのログを出力
   * @param message - ログメッセージ
   * @param args - 追加の引数
   */
  debug: (message: string, ...args: unknown[]) => {
    if (!import.meta.env.PROD && import.meta.env.MODE !== "test") {
      // biome-ignore lint/suspicious/noConsole: Development logging
      console.debug(message, ...args);
    }
  },

  /**
   * 情報レベルのログを出力
   * @param message - ログメッセージ
   * @param args - 追加の引数
   */
  info: (message: string, ...args: unknown[]) => {
    if (!import.meta.env.PROD && import.meta.env.MODE !== "test") {
      // biome-ignore lint/suspicious/noConsole: Development logging
      console.info(message, ...args);
    }
  },

  /**
   * 警告レベルのログを出力
   * @param message - ログメッセージ
   * @param args - 追加の引数
   */
  warn: (message: string, ...args: unknown[]) => {
    if (!import.meta.env.PROD && import.meta.env.MODE !== "test") {
      // biome-ignore lint/suspicious/noConsole: Development logging
      console.warn(message, ...args);
    }
  },

  /**
   * エラーレベルのログを出力
   * 本番環境でもエラーは出力されます
   * @param message - ログメッセージ
   * @param args - 追加の引数
   */
  error: (message: string, ...args: unknown[]) => {
    if (import.meta.env.MODE !== "test") {
      // biome-ignore lint/suspicious/noConsole: Error logging
      console.error(message, ...args);
    }
  },
};
