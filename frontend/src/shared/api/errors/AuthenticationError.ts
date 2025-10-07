import { ApiError } from "./ApiError";

/**
 * 認証エラーを表すクラス（401 Unauthorized）
 * ログインが必要な場合や、セッションが無効な場合に発生
 */
export class AuthenticationError extends ApiError {
  readonly redirectTo?: string;

  constructor(message = "Unauthorized", redirectTo = "/signin") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.redirectTo = redirectTo;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  override getUserMessage(): string {
    return "認証が必要です。ログインしてください。";
  }

  /**
   * リダイレクト先のパスを取得
   */
  getRedirectPath(): string {
    return this.redirectTo || "/signin";
  }

  /**
   * セッションが期限切れかどうかを判定
   */
  isSessionExpired(): boolean {
    return (
      this.message.toLowerCase().includes("session") ||
      this.message.toLowerCase().includes("expired")
    );
  }
}
