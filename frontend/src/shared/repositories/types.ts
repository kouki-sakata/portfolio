/**
 * Repository Pattern基本型定義
 * SOLID原則のDependency Inversion Principle (DIP)に準拠
 */

/**
 * HTTPクライアントインターフェース
 * 具象実装から抽象へ依存を逆転
 */
export type IHttpClient = {
  get<T>(path: string, options?: HttpRequestOptions): Promise<T>;
  post<T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T>;
  put<T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T>;
  patch<T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T>;
  delete<T>(path: string, options?: HttpRequestOptions): Promise<T>;
};

/**
 * HTTPリクエストオプション
 */
export type HttpRequestOptions = {
  headers?: HeadersInit;
  parseJson?: boolean;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
};

/**
 * リポジトリエラー
 */
export interface RepositoryError extends Error {
  code:
    | "NETWORK_ERROR"
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "UNAUTHORIZED"
    | "UNKNOWN";
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
