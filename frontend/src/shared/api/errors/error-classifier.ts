import { ApiError } from "./ApiError";
import { AuthenticationError } from "./AuthenticationError";
import { AuthorizationError } from "./AuthorizationError";
import { NetworkError } from "./NetworkError";
import { UnexpectedError } from "./UnexpectedError";
import { ValidationError } from "./ValidationError";

/**
 * エラーがApiErrorかどうか判定
 */
export function isApiError(error: Error): error is ApiError {
  return error instanceof ApiError;
}

/**
 * エラーがNetworkErrorかどうか判定
 */
export function isNetworkError(error: Error): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * エラーがValidationErrorかどうか判定
 */
export function isValidationError(error: Error): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * エラーがAuthenticationErrorかどうか判定
 */
export function isAuthenticationError(
  error: Error
): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * エラーがAuthorizationErrorかどうか判定
 */
export function isAuthorizationError(
  error: Error
): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * エラーがUnexpectedErrorかどうか判定
 */
export function isUnexpectedError(error: Error): error is UnexpectedError {
  return error instanceof UnexpectedError;
}

/**
 * HTTP応答からエラークラスを生成
 */
export function classifyHttpError(
  status: number,
  message: string,
  code?: string,
  details?: Record<string, unknown>
): ApiError | NetworkError {
  // ネットワークエラー（ステータスコード0）
  if (status === 0) {
    return new NetworkError(
      message || "ネットワークエラーが発生しました",
      new Error("Network failure")
    );
  }

  // 401: 認証エラー
  if (status === 401) {
    return new AuthenticationError(message || "Unauthorized");
  }

  // 403: 認可エラー
  if (status === 403) {
    const requiredRole = details?.["requiredRole"] as string | undefined;
    const currentRole = details?.["currentRole"] as string | undefined;
    return new AuthorizationError(
      message || "Forbidden",
      requiredRole,
      currentRole
    );
  }

  // 422: バリデーションエラー
  if (status === 422) {
    const fieldErrors = extractFieldErrors(details);
    return new ValidationError(
      message || "Validation failed",
      status,
      fieldErrors
    );
  }

  // その他のAPIエラー
  return new ApiError(message, status, code, details);
}

/**
 * 値がstring配列かどうか判定するType Guard
 */
function isFieldErrorArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/**
 * エラー値を文字列配列に正規化
 */
function normalizeErrorValue(error: unknown): string[] {
  if (Array.isArray(error)) {
    return error.map((e) => String(e));
  }
  return [String(error)];
}

/**
 * errorsプロパティからフィールドエラーを抽出
 */
function extractFromErrorsProperty(
  errors: Record<string, unknown>
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const [field, error] of Object.entries(errors)) {
    fieldErrors[field] = normalizeErrorValue(error);
  }

  return fieldErrors;
}

/**
 * detailsオブジェクト自体からフィールドエラーを抽出
 */
function extractFromDetailsObject(
  details: Record<string, unknown>
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const [field, value] of Object.entries(details)) {
    if (isFieldErrorArray(value)) {
      fieldErrors[field] = value;
    }
  }

  return fieldErrors;
}

/**
 * detailsオブジェクトからフィールドエラーを抽出
 */
function extractFieldErrors(
  details?: Record<string, unknown>
): Record<string, string[]> {
  if (!details) {
    return {};
  }

  // errorsプロパティがある場合（一般的なAPIレスポンス）
  if (details["errors"] && typeof details["errors"] === "object") {
    return extractFromErrorsProperty(details["errors"] as Record<string, unknown>);
  }

  // fieldErrorsプロパティがある場合
  if (details["fieldErrors"] && typeof details["fieldErrors"] === "object") {
    return details["fieldErrors"] as Record<string, string[]>;
  }

  // detailsそのものがフィールドエラー形式の場合
  return extractFromDetailsObject(details);
}

/**
 * 一般的なErrorオブジェクトを分類
 */
export function classifyError(error: Error): ApiError | UnexpectedError {
  // 既に分類済みのエラー
  if (isApiError(error)) {
    return error;
  }

  // ネットワークエラーのパターン
  if (
    error.name === "NetworkError" ||
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("fetch")
  ) {
    return new NetworkError(error.message, error);
  }

  // その他は予期しないエラー
  return new UnexpectedError(error.message, {
    originalError: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });
}
