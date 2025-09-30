import {
  type ApiError,
  classifyError,
  isApiError,
  isAuthenticationError,
  isAuthorizationError,
  isNetworkError,
  isUnexpectedError,
  isValidationError,
  type UnexpectedError,
} from "../api/errors";
import type { ErrorLogger } from "./error-logger";

/**
 * Toast表示のオプション
 */
export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

/**
 * GlobalErrorHandlerの設定
 */
export type ErrorHandlerConfig = {
  toast: (options: ToastOptions) => void;
  logger: ErrorLogger;
  environment: "development" | "production";
  enableToast?: boolean;
  enableLogging?: boolean;
  onRetry?: () => void;
};

/**
 * アプリケーション全体のエラーハンドリングを管理するクラス
 * Singletonパターンで実装
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler | null = null;
  private readonly config: ErrorHandlerConfig;

  private constructor(config: ErrorHandlerConfig) {
    this.config = {
      enableToast: true,
      enableLogging: true,
      ...config,
    };
  }

  /**
   * GlobalErrorHandlerを初期化
   */
  static initialize(config: ErrorHandlerConfig): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler(config);
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * GlobalErrorHandlerのインスタンスを取得
   */
  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      throw new Error("GlobalErrorHandler not initialized");
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * インスタンスをリセット（テスト用）
   */
  static reset(): void {
    GlobalErrorHandler.instance = null;
  }

  /**
   * エラーをハンドリング
   */
  handle(error: Error): void {
    // エラーを分類
    const classifiedError = this.classifyError(error);

    // ログに記録
    if (this.config.enableLogging) {
      this.logError(classifiedError);
    }

    // Toast表示
    if (this.config.enableToast) {
      this.showToast(classifiedError);
    }
  }

  /**
   * エラーを分類
   */
  private classifyError(error: Error): ApiError | UnexpectedError {
    if (isApiError(error)) {
      return error;
    }

    return classifyError(error);
  }

  /**
   * エラーをログに記録
   */
  private logError(error: ApiError | UnexpectedError): void {
    const level = this.getLogLevel(error);
    this.config.logger.log(error, level);
  }

  /**
   * エラーのログレベルを判定
   */
  private getLogLevel(
    error: ApiError | UnexpectedError
  ): "error" | "warn" | "info" {
    // 認証エラーは警告レベル
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return "warn";
    }

    // バリデーションエラーは警告レベル
    if (isValidationError(error)) {
      return "warn";
    }

    // それ以外はエラーレベル
    return "error";
  }

  /**
   * Toast表示
   */
  private showToast(error: ApiError | UnexpectedError): void {
    // 認証エラーはToast表示しない（リダイレクト処理が別途行われるため）
    if (isAuthenticationError(error)) {
      return;
    }

    const toastOptions = this.createToastOptions(error);
    this.config.toast(toastOptions);
  }

  /**
   * Toast表示オプションを作成
   */
  private createToastOptions(error: ApiError | UnexpectedError): ToastOptions {
    const title = this.getToastTitle(error);
    const description = this.getToastDescription(error);
    const action = this.getToastAction(error);

    return {
      title,
      description,
      variant: "destructive",
      duration: 5000,
      ...(action && { action }),
    };
  }

  /**
   * Toast のタイトルを取得
   */
  private getToastTitle(error: ApiError | UnexpectedError): string {
    if (isNetworkError(error)) {
      return "ネットワークエラー";
    }

    if (isValidationError(error)) {
      return "入力エラー";
    }

    if (isAuthorizationError(error)) {
      return "権限エラー";
    }

    if (isApiError(error)) {
      if (error.status >= 500) {
        return "サーバーエラー";
      }
      if (error.status >= 400) {
        return "エラー";
      }
    }

    return "システムエラー";
  }

  /**
   * Toast の説明を取得
   */
  private getToastDescription(error: ApiError | UnexpectedError): string {
    if (isApiError(error)) {
      return error.getUserMessage();
    }

    if (isUnexpectedError(error)) {
      return error.getUserMessage();
    }

    return "予期しないエラーが発生しました。";
  }

  /**
   * Toast のアクション（再試行ボタンなど）を取得
   */
  private getToastAction(
    error: ApiError | UnexpectedError
  ): ToastOptions["action"] | undefined {
    // ネットワークエラーの場合は再試行ボタンを表示
    if (isNetworkError(error) && error.isRetryable && this.config.onRetry) {
      return {
        label: "再試行",
        onClick: this.config.onRetry,
      };
    }

    return;
  }

  /**
   * エラー情報を構造化して返す（デバッグ用）
   */
  getErrorInfo(error: Error): Record<string, unknown> {
    const classifiedError = this.classifyError(error);

    if (isApiError(classifiedError)) {
      return {
        type: classifiedError.constructor.name,
        status: classifiedError.status,
        code: classifiedError.code,
        message: classifiedError.message,
        userMessage: classifiedError.getUserMessage(),
        details: classifiedError.details,
      };
    }

    if (isUnexpectedError(classifiedError)) {
      return classifiedError.getDetails();
    }

    return {
      type: "UnknownError",
      message: error.message,
      name: error.name,
    };
  }
}
