/**
 * TypeScript v5 Template Literal Types for API Routes
 *
 * @description
 * API エンドポイントの型安全な定義
 * Template Literal Types を活用した厳密な型付け
 */

// ============================================
// 基本パス定義
// ============================================

/**
 * APIベースパス
 */
type APIBase = "/api";

/**
 * APIエンドポイントのTemplate Literal Type
 */
type APIEndpoint<T extends string> = `${APIBase}/${T}`;

// ============================================
// 認証関連エンドポイント
// ============================================

/**
 * 認証エンドポイント
 */
export type AuthEndpoint =
  | APIEndpoint<"auth/login">
  | APIEndpoint<"auth/logout">
  | APIEndpoint<"auth/session">
  | APIEndpoint<"auth/refresh">
  | APIEndpoint<"auth/csrf">;

/**
 * 認証エンドポイントの詳細定義
 */
export const AUTH_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  LOGOUT: "/api/auth/logout",
  SESSION: "/api/auth/session",
  REFRESH: "/api/auth/refresh",
  CSRF: "/api/auth/csrf",
} as const satisfies Record<string, AuthEndpoint>;

// ============================================
// 従業員管理エンドポイント
// ============================================

/**
 * 従業員エンドポイント（パラメータ付き）
 */
export type EmployeeEndpoint =
  | APIEndpoint<"employees">
  | APIEndpoint<`employees/${number}`>
  | APIEndpoint<`employees/${number}/stamps`>
  | APIEndpoint<`employees/${number}/profile`>
  | APIEndpoint<"employees/bulk">;

/**
 * 従業員エンドポイントヘルパー
 */
export const createEmployeeEndpoint = {
  list: (): EmployeeEndpoint => "/api/employees",
  detail: (id: number): EmployeeEndpoint => `/api/employees/${id}`,
  stamps: (id: number): EmployeeEndpoint => `/api/employees/${id}/stamps`,
  profile: (id: number): EmployeeEndpoint => `/api/employees/${id}/profile`,
  bulk: (): EmployeeEndpoint => "/api/employees/bulk",
} as const;

// ============================================
// 打刻管理エンドポイント
// ============================================

/**
 * 打刻エンドポイント
 */
export type StampEndpoint =
  | APIEndpoint<"stamps">
  | APIEndpoint<`stamps/${number}`>
  | APIEndpoint<"stamps/clock-in">
  | APIEndpoint<"stamps/clock-out">
  | APIEndpoint<"stamps/break-start">
  | APIEndpoint<"stamps/break-end">
  | APIEndpoint<`stamps/history/${string}`>;

/**
 * 打刻エンドポイントヘルパー
 */
export const createStampEndpoint = {
  list: (): StampEndpoint => "/api/stamps",
  detail: (id: number): StampEndpoint => `/api/stamps/${id}`,
  clockIn: (): StampEndpoint => "/api/stamps/clock-in",
  clockOut: (): StampEndpoint => "/api/stamps/clock-out",
  breakStart: (): StampEndpoint => "/api/stamps/break-start",
  breakEnd: (): StampEndpoint => "/api/stamps/break-end",
  history: (date: string): StampEndpoint => `/api/stamps/history/${date}`,
} as const;

// ============================================
// ホーム・ダッシュボードエンドポイント
// ============================================

/**
 * ホームエンドポイント
 */
export type HomeEndpoint =
  | APIEndpoint<"home">
  | APIEndpoint<"home/overview">
  | APIEndpoint<"home/news">
  | APIEndpoint<"home/stamps">
  | APIEndpoint<"home/stats">;

/**
 * ホームエンドポイント定義
 */
export const HOME_ENDPOINTS = {
  OVERVIEW: "/api/home/overview",
  NEWS: "/api/home/news",
  STAMPS: "/api/home/stamps",
  STATS: "/api/home/stats",
} as const satisfies Record<string, HomeEndpoint>;

// ============================================
// お知らせ管理エンドポイント
// ============================================

/**
 * お知らせエンドポイント
 */
export type NewsEndpoint =
  | APIEndpoint<"news">
  | APIEndpoint<`news/${number}`>
  | APIEndpoint<"news/published">
  | APIEndpoint<"news/draft">;

/**
 * お知らせエンドポイントヘルパー
 */
export const createNewsEndpoint = {
  list: (): NewsEndpoint => "/api/news",
  detail: (id: number): NewsEndpoint => `/api/news/${id}`,
  published: (): NewsEndpoint => "/api/news/published",
  draft: (): NewsEndpoint => "/api/news/draft",
} as const;

// ============================================
// 統合型定義
// ============================================

/**
 * すべてのAPIエンドポイントのunion型
 */
export type APIRoute =
  | AuthEndpoint
  | EmployeeEndpoint
  | StampEndpoint
  | HomeEndpoint
  | NewsEndpoint;

// ============================================
// アプリケーションルート
// ============================================

/**
 * アプリケーション内のルートパス
 */
export type AppRoute =
  | "/"
  | "/auth/signin"
  | "/auth/signout"
  | "/employees"
  | `/employees/${number}`
  | "/employees/new"
  | `/employees/${number}/edit`
  | "/stamp-history"
  | `/stamp-history/${string}`
  | "/settings"
  | "/settings/profile"
  | "/settings/security"
  | "/admin"
  | "/admin/users"
  | "/admin/logs";

/**
 * アプリケーションルートヘルパー
 */
export const createAppRoute = {
  home: (): AppRoute => "/",
  signin: (): AppRoute => "/auth/signin",
  signout: (): AppRoute => "/auth/signout",
  employees: {
    list: (): AppRoute => "/employees",
    detail: (id: number): AppRoute => `/employees/${id}`,
    new: (): AppRoute => "/employees/new",
    edit: (id: number): AppRoute => `/employees/${id}/edit`,
  },
  stampHistory: {
    list: (): AppRoute => "/stamp-history",
    date: (date: string): AppRoute => `/stamp-history/${date}`,
  },
  settings: {
    root: (): AppRoute => "/settings",
    profile: (): AppRoute => "/settings/profile",
    security: (): AppRoute => "/settings/security",
  },
  admin: {
    root: (): AppRoute => "/admin",
    users: (): AppRoute => "/admin/users",
    logs: (): AppRoute => "/admin/logs",
  },
} as const;

// ============================================
// HTTPメソッド型
// ============================================

/**
 * HTTPメソッド
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * エンドポイントとHTTPメソッドの組み合わせ
 */
export type APIAction<
  E extends APIRoute = APIRoute,
  M extends HttpMethod = HttpMethod
> = `${M} ${E}`;

/**
 * 認証が必要なエンドポイント
 */
export type AuthRequiredEndpoint = Exclude<APIRoute, AuthEndpoint>;

/**
 * 管理者権限が必要なエンドポイント
 */
export type AdminOnlyEndpoint =
  | APIEndpoint<`employees/${number}`>
  | APIEndpoint<"employees/bulk">
  | NewsEndpoint;

// ============================================
// クエリパラメータ型
// ============================================

/**
 * ページネーション用クエリパラメータ
 */
export type PaginationParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

/**
 * 検索用クエリパラメータ
 */
export type SearchParams = {
  q?: string;
  filters?: Record<string, unknown>;
};

/**
 * エンドポイントごとのクエリパラメータマッピング
 */
export type EndpointParams = {
  "/api/employees": PaginationParams & SearchParams;
  "/api/stamps": PaginationParams & { employeeId?: number; date?: string };
  "/api/news": PaginationParams & { status?: "published" | "draft" };
};

/**
 * エンドポイントからクエリパラメータ型を取得
 */
export type GetEndpointParams<E extends keyof EndpointParams> =
  EndpointParams[E];

// ============================================
// 型ガード
// ============================================

/**
 * 有効なAPIエンドポイントかチェック
 */
export function isValidAPIEndpoint(path: string): path is APIRoute {
  return path.startsWith("/api/");
}

/**
 * 認証エンドポイントかチェック
 */
export function isAuthEndpoint(path: string): path is AuthEndpoint {
  return path.startsWith("/api/auth/");
}

/**
 * 管理者エンドポイントかチェック
 */
export function requiresAdminRole(path: string): boolean {
  return (
    path.includes("/bulk") ||
    path.includes("/admin") ||
    /\/api\/employees\/\d+$/.test(path)
  );
}