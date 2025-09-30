// エラークラス
export { ApiError } from './ApiError';
export { NetworkError } from './NetworkError';
export { ValidationError } from './ValidationError';
export { AuthenticationError } from './AuthenticationError';
export { AuthorizationError } from './AuthorizationError';
export { UnexpectedError } from './UnexpectedError';

// エラー分類ユーティリティ
export {
  isApiError,
  isNetworkError,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isUnexpectedError,
  classifyHttpError,
  classifyError
} from './error-classifier';