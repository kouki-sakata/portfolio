/**
 * 予期しないエラーを表すクラス
 * APIError以外の一般的なエラーを処理します
 */
export class UnexpectedError extends Error {
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string = '予期しないエラーが発生しました',
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'UnexpectedError';
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnexpectedError);
    }

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, UnexpectedError.prototype);
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  getUserMessage(): string {
    return '予期しないエラーが発生しました。しばらくしてから再度お試しください。';
  }

  /**
   * エラーの詳細情報を取得
   */
  getDetails(): {
    message: string;
    timestamp: Date;
    context?: Record<string, unknown>;
    stack?: string;
  } {
    return {
      message: this.message,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * エラーログ用の文字列を生成
   */
  toLogString(): string {
    const details = this.getDetails();
    return JSON.stringify({
      error: this.name,
      message: details.message,
      timestamp: details.timestamp.toISOString(),
      context: details.context,
      stack: details.stack?.split('\n').slice(0, 5).join('\n') // 最初の5行のみ
    });
  }
}