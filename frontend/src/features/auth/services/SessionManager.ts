import type { EmployeeSummary } from "@/features/auth/types";

/**
 * セッション管理インターフェース
 * Single Responsibility: セッションの状態管理のみを担当
 */
export type ISessionManager = {
  getSession(): SessionData | null;
  setSession(user: EmployeeSummary): void;
  clearSession(): void;
  hasValidSession(): boolean;
  onSessionChange(callback: SessionChangeCallback): () => void;
};

export type SessionData = {
  user: EmployeeSummary;
  createdAt: Date;
  expiresAt: Date;
};

export type SessionChangeCallback = (session: SessionData | null) => void;

/**
 * セッション管理実装
 * Observer Patternでセッション変更を通知
 */
export class SessionManager implements ISessionManager {
  private session: SessionData | null = null;
  private readonly listeners = new Set<SessionChangeCallback>();
  private readonly sessionDuration = 8 * 60 * 60 * 1000; // 8時間

  getSession(): SessionData | null {
    if (this.session && this.isExpired(this.session)) {
      this.clearSession();
      return null;
    }
    return this.session;
  }

  setSession(user: EmployeeSummary): void {
    const now = new Date();
    this.session = {
      user,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.sessionDuration),
    };
    this.notifyListeners();
  }

  clearSession(): void {
    this.session = null;
    this.notifyListeners();
  }

  hasValidSession(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  onSessionChange(callback: SessionChangeCallback): () => void {
    this.listeners.add(callback);
    // 即座に現在のセッション状態を通知
    callback(this.session);

    // クリーンアップ関数を返す
    return () => {
      this.listeners.delete(callback);
    };
  }

  private isExpired(session: SessionData): boolean {
    return new Date() > session.expiresAt;
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      callback(this.session);
    });
  }
}

/**
 * シングルトンインスタンス
 * アプリケーション全体で共有
 */
let sessionManagerInstance: ISessionManager | null = null;

export const getSessionManager = (): ISessionManager => {
  sessionManagerInstance ??= new SessionManager();
  return sessionManagerInstance;
};

/**
 * テスト用リセット関数
 */
export const resetSessionManager = (): void => {
  sessionManagerInstance = null;
};
