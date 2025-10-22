import { ApiError } from "@/shared/api/errors/ApiError";
import type { RepositoryError } from "@/shared/repositories/types";

export type StatusError = ApiError | (RepositoryError & { status: number });

export const hasStatus = (error: unknown): error is StatusError =>
  error instanceof ApiError ||
  (error instanceof Error &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number");
