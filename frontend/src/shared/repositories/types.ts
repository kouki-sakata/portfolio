/**
 * Repository Pattern基本型定義
 * SOLID原則のDependency Inversion Principle (DIP)に準拠
 */

/**
 * HTTPクライアントインターフェース
 * 具象実装から抽象へ依存を逆転
 */
export type IHttpClient = {
  get<T = unknown>(path: string, options?: JsonHttpRequestOptions): Promise<T>;
  get(path: string, options: NoParseHttpRequestOptions): Promise<void>;
  post<T = unknown>(
    path: string,
    body?: unknown,
    options?: JsonHttpRequestOptions
  ): Promise<T>;
  post(
    path: string,
    body: unknown,
    options: NoParseHttpRequestOptions
  ): Promise<void>;
  put<T = unknown>(
    path: string,
    body?: unknown,
    options?: JsonHttpRequestOptions
  ): Promise<T>;
  put(
    path: string,
    body: unknown,
    options: NoParseHttpRequestOptions
  ): Promise<void>;
  patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: JsonHttpRequestOptions
  ): Promise<T>;
  patch(
    path: string,
    body: unknown,
    options: NoParseHttpRequestOptions
  ): Promise<void>;
  delete<T = unknown>(
    path: string,
    options?: JsonHttpRequestOptions
  ): Promise<T>;
  delete(path: string, options: NoParseHttpRequestOptions): Promise<void>;
};

/**
 * HTTPリクエストオプション
 */

/**
 * parseJson === true のとき JSON をパースして T を返す
 */
export type JsonHttpRequestOptions = {
  headers?: HeadersInit;
  parseJson?: true;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
};

/**
 * parseJson === false のとき本文をパースせず void を返す
 */
export type NoParseHttpRequestOptions = {
  headers?: HeadersInit;
  parseJson: false;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
};

export type HttpRequestOptions =
  | JsonHttpRequestOptions
  | NoParseHttpRequestOptions;

/**
 * リポジトリエラーコード定義
 */
export const REPOSITORY_ERROR_CODES = [
  "NETWORK_ERROR",
  "SERVER_ERROR",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "UNAUTHORIZED",
  "TIMEOUT",
  "UNKNOWN",
] as const;

export type RepositoryErrorCode = (typeof REPOSITORY_ERROR_CODES)[number];

export const isRepositoryErrorCode = (
  value: unknown
): value is RepositoryErrorCode =>
  typeof value === "string" &&
  REPOSITORY_ERROR_CODES.includes(value as RepositoryErrorCode);

/**
 * リポジトリエラー
 */
export interface RepositoryError extends Error {
  code: RepositoryErrorCode;
  status?: number;
  details?: unknown;
}

/**
 * ページネーション情報
 */
export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
};

/**
 * 基本リポジトリインターフェース
 * Single Responsibility Principle (SRP)に準拠
 */
export type Repository<T, Id = string | number> = {
  findById(id: Id): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: Id): Promise<void>;
};

/**
 * 読み取り専用リポジトリ
 * Interface Segregation Principle (ISP)に準拠
 */
export type ReadOnlyRepository<T, Id = string | number> = {
  findById(id: Id): Promise<T | null>;
  findAll(): Promise<T[]>;
};

/**
 * ページネーション対応リポジトリ
 */
export interface PaginatedRepository<T, Id = string | number>
  extends Repository<T, Id> {
  findPaginated(params: PaginationParams): Promise<PaginatedResponse<T>>;
}
