// エラークラス
export { ApiError } from "./ApiError";
export { AuthenticationError } from "./AuthenticationError";
export { AuthorizationError } from "./AuthorizationError";
// エラー分類ユーティリティ
export {
  classifyError,
  classifyHttpError,
  isApiError,
  isAuthenticationError,
  isAuthorizationError,
  isNetworkError,
  isUnexpectedError,
  isValidationError,
} from "./error-classifier";
export type { StatusAwareError } from "./errorUtils";
export { hasStatus } from "./errorUtils";
export { NetworkError } from "./NetworkError";
export { UnexpectedError } from "./UnexpectedError";
export { ValidationError } from "./ValidationError";
