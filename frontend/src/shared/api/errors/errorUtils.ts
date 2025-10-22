import type { RepositoryError } from "@/shared/repositories/types";
import { ApiError } from "./ApiError";

type StatusCarrier = { status: number };

/**
 * HTTPステータスコードを保持するエラーを包括的に表現する型。
 * ApiError または status プロパティを持つ RepositoryError / その他のオブジェクトを許容する。
 */
export type StatusAwareError =
  | ApiError
  | (RepositoryError & StatusCarrier)
  | (StatusCarrier & object);

/**
 * 例外が HTTP ステータスコードを保持しているかを判定する型ガード。
 * ApiError か、status プロパティを持つ Error / オブジェクトを検出し、安全に分岐できるようにする。
 */
export const hasStatus = (error: unknown): error is StatusAwareError => {
  if (error instanceof ApiError) {
    return true;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return true;
  }

  return false;
};
