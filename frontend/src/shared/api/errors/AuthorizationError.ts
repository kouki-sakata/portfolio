import { ApiError } from './ApiError';

/**
 * 認可エラーを表すクラス（403 Forbidden）
 * 権限が不足している場合に発生
 */
export class AuthorizationError extends ApiError {
  readonly requiredRole?: string;
  readonly currentRole?: string;

  constructor(
    message: string = 'Forbidden',
    requiredRole?: string,
    currentRole?: string
  ) {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.requiredRole = requiredRole;
    this.currentRole = currentRole;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  getUserMessage(): string {
    if (this.requiredRole) {
      return `この操作には${this.requiredRole}権限が必要です。`;
    }
    return 'この操作を行う権限がありません。';
  }

  /**
   * 必要な権限の詳細を取得
   */
  getPermissionDetails(): string {
    if (this.requiredRole && this.currentRole) {
      return `必要な権限: ${this.requiredRole}, 現在の権限: ${this.currentRole}`;
    }
    if (this.requiredRole) {
      return `必要な権限: ${this.requiredRole}`;
    }
    return '権限が不足しています';
  }

  /**
   * 管理者権限が必要かどうかを判定
   */
  requiresAdmin(): boolean {
    return this.requiredRole?.toLowerCase().includes('admin') || false;
  }
}