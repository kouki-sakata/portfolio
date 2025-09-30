import { ApiError } from './ApiError';
import { NetworkError } from './NetworkError';
import { ValidationError } from './ValidationError';
import { AuthenticationError } from './AuthenticationError';
import { AuthorizationError } from './AuthorizationError';
import { UnexpectedError } from './UnexpectedError';

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
export function isAuthenticationError(error: Error): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * エラーがAuthorizationErrorかどうか判定
 */
export function isAuthorizationError(error: Error): error is AuthorizationError {
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
      message || 'ネットワークエラーが発生しました',
      new Error('Network failure')
    );
  }

  // 401: 認証エラー
  if (status === 401) {
    return new AuthenticationError(message || 'Unauthorized');
  }

  // 403: 認可エラー
  if (status === 403) {
    const requiredRole = details?.requiredRole as string | undefined;
    const currentRole = details?.currentRole as string | undefined;
    return new AuthorizationError(
      message || 'Forbidden',
      requiredRole,
      currentRole
    );
  }

  // 422: バリデーションエラー
  if (status === 422) {
    const fieldErrors = extractFieldErrors(details);
    return new ValidationError(
      message || 'Validation failed',
      status,
      fieldErrors
    );
  }

  // その他のAPIエラー
  return new ApiError(message, status, code, details);
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
  if (details.errors && typeof details.errors === 'object') {
    const errors = details.errors as Record<string, unknown>;
    const fieldErrors: Record<string, string[]> = {};

    for (const field in errors) {
      if (Object.prototype.hasOwnProperty.call(errors, field)) {
        const error = errors[field];
        if (Array.isArray(error)) {
          fieldErrors[field] = error.map(e => String(e));
        } else if (typeof error === 'string') {
          fieldErrors[field] = [error];
        } else {
          fieldErrors[field] = [String(error)];
        }
      }
    }

    return fieldErrors;
  }

  // fieldErrorsプロパティがある場合
  if (details.fieldErrors && typeof details.fieldErrors === 'object') {
    return details.fieldErrors as Record<string, string[]>;
  }

  // detailsそのものがフィールドエラー形式の場合
  const fieldErrors: Record<string, string[]> = {};
  for (const field in details) {
    if (Object.prototype.hasOwnProperty.call(details, field)) {
      const value = details[field];
      if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
        fieldErrors[field] = value as string[];
      }
    }
  }

  return fieldErrors;
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
    error.name === 'NetworkError' ||
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('fetch')
  ) {
    return new NetworkError(error.message, error);
  }

  // その他は予期しないエラー
  return new UnexpectedError(error.message, {
    originalError: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
}