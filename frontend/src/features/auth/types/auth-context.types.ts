import type { EmployeeSummary, LoginRequest } from "@/features/auth/types";

/**
 * セッション情報インターフェース
 * セッションのタイミングと警告閾値を管理
 */
export type SessionInfo = {
  /** セッション作成時刻 */
  createdAt: Date;
  /** セッション有効期限 */
  expiresAt: Date;
  /** 最終アクティビティ時刻 */
  lastActivity: Date;
  /** 警告表示までの残り時間（分） */
  warningThreshold: number;
};

/**
 * 拡張認証コンテキスト値インターフェース
 * CSRF保護とセッションタイムアウト管理を含む完全な認証状態
 */
export type EnhancedAuthContextValue = {
  // 基本認証状態
  /** 現在ログイン中のユーザー情報 */
  user: EmployeeSummary | null;
  /** 認証済みフラグ */
  authenticated: boolean;
  /** ローディング状態 */
  loading: boolean;

  // 認証アクション
  /** ログイン処理 */
  login: (payload: LoginRequest) => Promise<EmployeeSummary>;
  /** ログアウト処理 */
  logout: () => Promise<void>;

  // セッション管理
  /** セッション詳細情報 */
  sessionInfo: SessionInfo | null;
  /** セッション更新処理 */
  refreshSession: () => Promise<void>;
  /** セッションの有効期限が近いか */
  isSessionExpiring: boolean;
  /** 有効期限までの残り時間（ミリ秒） */
  timeUntilExpiry: number | null;
  /** セッションタイムアウト警告表示フラグ */
  sessionTimeoutWarning: boolean;

  // CSRF保護
  /** CSRFトークン */
  csrfToken: string | null;
  /** CSRFトークン更新処理 */
  refreshCsrfToken: () => void;
};

/**
 * セッションタイムアウトイベント
 */
export type SessionTimeoutEvent = {
  /** イベントタイプ */
  type: "WARNING" | "EXPIRED";
  /** 残り時間（ミリ秒） */
  timeRemaining: number;
  /** イベント発生時刻 */
  timestamp: Date;
};

/**
 * 認証エラー情報
 */
export type AuthenticationError = {
  /** HTTPステータスコード */
  status: number;
  /** エラーメッセージ */
  message: string;
  /** エラーコード */
  code?: string;
  /** 追加情報 */
  details?: Record<string, unknown>;
};

/**
 * セッション設定
 */
export type SessionConfig = {
  /** セッション有効期限（ミリ秒） */
  sessionDuration: number;
  /** 警告表示タイミング（有効期限の何分前） */
  warningBeforeExpiry: number;
  /** セッション自動延長の有効化 */
  autoExtendSession: boolean;
  /** アイドルタイムアウト（ミリ秒） */
  idleTimeout?: number;
};

/**
 * 認証プロバイダーの設定
 */
export type AuthProviderConfig = {
  /** セッション設定 */
  sessionConfig: SessionConfig;
  /** ログインページのパス */
  loginPath: string;
  /** ログイン後のリダイレクト先 */
  defaultRedirectPath: string;
  /** エラー時のフォールバック処理 */
  onAuthError?: (error: AuthenticationError) => void;
};
