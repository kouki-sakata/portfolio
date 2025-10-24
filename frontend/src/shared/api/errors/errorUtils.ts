import type { RepositoryError } from "@/shared/repositories/types";
import { isRepositoryErrorCode } from "@/shared/repositories/types";
import { ApiError } from "./ApiError";

/**
 * HTTPステータスコードを保持するエラーを厳密に表現する型。
 * ApiError または status プロパティを持つ RepositoryError のみを許容する。
 */
export type StatusAwareError =
  | ApiError
  | (RepositoryError & { status: number });

/**
 * 例外が HTTP ステータスコードを保持しているかを判定する型ガード。
 * ApiError または status プロパティを持つ RepositoryError を検出し、安全に分岐できるようにする。
 */
export const hasStatus = (error: unknown): error is StatusAwareError => {
  if (error instanceof ApiError) {
    return true;
  }

  // RepositoryError with status
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    isRepositoryErrorCode((error as { code?: unknown }).code) &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return true;
  }

  return false;
};
