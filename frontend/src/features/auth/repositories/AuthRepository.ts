import { z } from "zod";

import type {
  LoginRequest,
  LoginResponse,
  SessionResponse,
} from "@/features/auth/types";
import { defaultHttpClient } from "@/shared/repositories/httpClientAdapter";
import type { IHttpClient } from "@/shared/repositories/types";

/**
 * Zodスキーマによるランタイムバリデーション
 * データ整合性の保証
 */
const EmployeeSummarySchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  admin: z.boolean(),
});

const SessionResponseSchema = z.object({
  authenticated: z.boolean(),
  employee: z.nullable(EmployeeSummarySchema),
});

const LoginResponseSchema = z.object({
  employee: EmployeeSummarySchema,
});

/**
 * 認証リポジトリインターフェース
 * Single Responsibility Principle: 認証関連のデータアクセスのみを担当
 */
export type IAuthRepository = {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  getSession(): Promise<SessionResponse>;
  refreshSession(): Promise<SessionResponse>;
};

/**
 * 認証リポジトリ実装
 * Dependency Inversion: IHttpClientインターフェースに依存
 */
export class AuthRepository implements IAuthRepository {
  constructor(private readonly httpClient: IHttpClient = defaultHttpClient) {}

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.httpClient.post<unknown>(
      "/auth/login",
      credentials
    );
    return LoginResponseSchema.parse(response);
  }

  async logout(): Promise<void> {
    await this.httpClient.post("/auth/logout", undefined, { parseJson: false });
  }

  async getSession(): Promise<SessionResponse> {
    const response = await this.httpClient.get<unknown>("/auth/session");
    return SessionResponseSchema.parse(response);
  }

  async refreshSession(): Promise<SessionResponse> {
    const response = await this.httpClient.post<unknown>("/auth/refresh");
    return SessionResponseSchema.parse(response);
  }
}

/**
 * Factory関数
 * テスト時にモックを注入可能
 */
export const createAuthRepository = (
  httpClient?: IHttpClient
): IAuthRepository => new AuthRepository(httpClient);

/**
 * デフォルトインスタンス
 */
export const authRepository = createAuthRepository();
