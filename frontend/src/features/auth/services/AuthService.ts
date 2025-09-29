import type { IAuthRepository } from "@/features/auth/repositories/AuthRepository";
import { authRepository } from "@/features/auth/repositories/AuthRepository";
import type {
  EmployeeSummary,
  LoginRequest,
  SessionResponse,
} from "@/features/auth/types";
import type { RepositoryError } from "@/shared/repositories/types";

/**
 * 認証サービスインターフェース
 * Single Responsibility: 認証ビジネスロジックのみを担当
 */
export type IAuthService = {
  login(credentials: LoginRequest): Promise<EmployeeSummary>;
  logout(): Promise<void>;
  validateSession(): Promise<SessionResponse>;
  isAuthenticated(): Promise<boolean>;
};

/**
 * 認証エラー
 */
export class AuthenticationError extends Error {
  public readonly code:
    | "INVALID_CREDENTIALS"
    | "SESSION_EXPIRED"
    | "NETWORK_ERROR";

  constructor(
    message: string,
    code: "INVALID_CREDENTIALS" | "SESSION_EXPIRED" | "NETWORK_ERROR"
  ) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

/**
 * Type guard for RepositoryError
 */
const isRepositoryError = (error: unknown): error is RepositoryError =>
  error instanceof Error &&
  "code" in error &&
  "status" in error &&
  typeof (error as RepositoryError).status === "number";

/**
 * 認証サービス実装
 * Open/Closed Principle: 拡張可能な設計
 */
export class AuthService implements IAuthService {
  private readonly repository: IAuthRepository;

  constructor(repository: IAuthRepository = authRepository) {
    this.repository = repository;
  }

  async login(credentials: LoginRequest): Promise<EmployeeSummary> {
    try {
      const response = await this.repository.login(credentials);
      return response.employee;
    } catch (error) {
      if (isRepositoryError(error) && error.status === 401) {
        throw new AuthenticationError(
          "Invalid email or password",
          "INVALID_CREDENTIALS"
        );
      }
      throw new AuthenticationError(
        "Failed to connect to authentication service",
        "NETWORK_ERROR"
      );
    }
  }

  async logout(): Promise<void> {
    try {
      await this.repository.logout();
    } catch (_error) {
      // ログアウトエラーは無視
    }
  }

  async validateSession(): Promise<SessionResponse> {
    try {
      return await this.repository.getSession();
    } catch (error) {
      if (isRepositoryError(error) && error.status === 401) {
        return {
          authenticated: false,
          employee: null,
        };
      }
      throw new AuthenticationError(
        "Failed to validate session",
        "NETWORK_ERROR"
      );
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.validateSession();
    return session.authenticated;
  }
}

/**
 * Factory関数
 */
export const createAuthService = (repository?: IAuthRepository): IAuthService =>
  new AuthService(repository);

/**
 * デフォルトインスタンス
 */
export const authService = createAuthService();
