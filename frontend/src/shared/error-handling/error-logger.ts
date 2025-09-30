/**
 * エラーログを記録するためのインターフェース
 */
export type ErrorLogger = {
  log(error: Error, level: "error" | "warn" | "info"): void;
  sendToRemote(error: Error): Promise<void>;
};

/**
 * エラーログのエントリー
 */
export type ErrorLogEntry = {
  timestamp: Date;
  level: "error" | "warn" | "info";
  message: string;
  errorType: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
};

/**
 * デフォルトのエラーロガー実装
 */
export class ConsoleErrorLogger implements ErrorLogger {
  private readonly environment: "development" | "production";
  private readonly remoteEndpoint?: string;

  constructor(
    environment: "development" | "production" = "development",
    remoteEndpoint?: string
  ) {
    this.environment = environment;
    this.remoteEndpoint = remoteEndpoint;
  }

  log(error: Error, level: "error" | "warn" | "info" = "error"): void {
    const logEntry = this.createLogEntry(error, level);

    // 開発環境では常にコンソールに出力
    if (this.environment === "development") {
      this.logToConsole(logEntry);
    }

    // 本番環境でエラーレベルの場合はリモート送信も試みる
    if (this.environment === "production" && level === "error") {
      // Fire and forget でリモート送信
      this.sendToRemote(error).catch(() => {
        // リモート送信エラーは意図的に無視
      });
    }
  }

  async sendToRemote(error: Error): Promise<void> {
    if (!this.remoteEndpoint) {
      return;
    }

    const logEntry = this.createLogEntry(error, "error");

    try {
      // TODO: 実際のリモートログサービス（Sentry、LogRocket等）との統合
      await fetch(this.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logEntry),
      });
    } catch (sendError) {
      // リモート送信エラーは握りつぶす（ログの送信失敗でアプリを止めない）
      if (this.environment === "development") {
        // biome-ignore lint/suspicious/noConsole: Development-only debugging output
        console.warn("Failed to send error log to remote:", sendError);
      }
    }
  }

  private createLogEntry(
    error: Error,
    level: "error" | "warn" | "info"
  ): ErrorLogEntry {
    return {
      timestamp: new Date(),
      level,
      message: error.message,
      errorType: error.name,
      stackTrace: error.stack,
      context: this.extractContext(error),
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };
  }

  private extractContext(error: Error): Record<string, unknown> | undefined {
    const context: Record<string, unknown> = {};

    // UnexpectedErrorの場合はcontextを抽出
    if (
      "context" in error &&
      typeof error.context === "object" &&
      error.context !== null
    ) {
      Object.assign(context, error.context);
    }

    // ApiErrorの場合はdetailsを抽出
    if (
      "details" in error &&
      typeof error.details === "object" &&
      error.details !== null
    ) {
      Object.assign(context, { apiDetails: error.details });
    }

    // ValidationErrorの場合はfieldErrorsを抽出
    if (
      "fieldErrors" in error &&
      typeof error.fieldErrors === "object" &&
      error.fieldErrors !== null
    ) {
      Object.assign(context, { fieldErrors: error.fieldErrors });
    }

    return Object.keys(context).length > 0 ? context : undefined;
  }

  private logToConsole(logEntry: ErrorLogEntry): void {
    const logMethod =
      logEntry.level === "error"
        ? console.error
        : logEntry.level === "warn"
          ? console.warn
          : console.log;

    logMethod("🔴 Error Log:", {
      timestamp: logEntry.timestamp.toISOString(),
      level: logEntry.level,
      message: logEntry.message,
      errorType: logEntry.errorType,
      context: logEntry.context,
      url: logEntry.url,
    });

    if (logEntry.stackTrace) {
    }
  }
}
