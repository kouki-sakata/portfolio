import { ApiError } from './ApiError';

/**
 * ネットワーク関連のエラーを表すクラス
 * ネットワーク接続エラー、タイムアウトエラーなどを処理します
 */
export class NetworkError extends ApiError {
  readonly isRetryable: boolean = true;
  readonly originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message, 0, 'NETWORK_ERROR');
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  getUserMessage(): string {
    return 'ネットワークエラーが発生しました。接続を確認してください。';
  }

  /**
   * エラーが再試行可能かどうかを判定
   */
  canRetry(): boolean {
    return this.isRetryable;
  }

  /**
   * 再試行に関する提案メッセージを取得
   */
  getRetrySuggestion(): string {
    return 'ネットワーク接続を確認して、再試行してください。';
  }
}