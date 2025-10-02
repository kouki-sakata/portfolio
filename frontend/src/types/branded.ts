/**
 * TypeScript v5 Branded Types パターン
 *
 * @description
 * 構造的型付けを名義的型付けに変換し、
 * より厳密な型安全性を実現するためのユーティリティ
 *
 * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
 */

/**
 * ブランド型の基本定義
 *
 * @template K - 基底型
 * @template T - ブランド名
 *
 * @example
 * ```ts
 * type UserId = Brand<number, 'UserId'>;
 * type ProductId = Brand<number, 'ProductId'>;
 *
 * // これらは同じnumber型だが、TypeScriptでは別の型として扱われる
 * ```
 */
export type Brand<K, T extends string> = K & { readonly __brand: T };

// ============================================
// エンティティID型定義
// ============================================

/**
 * 従業員ID型
 */
export type EmployeeId = Brand<number, "EmployeeId">;

/**
 * 打刻ID型
 */
export type StampId = Brand<number, "StampId">;

/**
 * お知らせID型
 */
export type NewsId = Brand<number, "NewsId">;

/**
 * セッションID型（文字列ベース）
 */
export type SessionId = Brand<string, "SessionId">;

/**
 * CSRFトークン型
 */
export type CsrfToken = Brand<string, "CsrfToken">;

/**
 * JWT トークン型
 */
export type JwtToken = Brand<string, "JwtToken">;

// ============================================
// 値オブジェクト型定義
// ============================================

/**
 * メールアドレス型
 */
export type EmailAddress = Brand<string, "EmailAddress">;

/**
 * ハッシュ化されたパスワード型
 */
export type HashedPassword = Brand<string, "HashedPassword">;

/**
 * タイムスタンプ型（ISO 8601形式）
 */
export type Timestamp = Brand<string, "Timestamp">;

/**
 * 日付型（YYYY-MM-DD形式）
 */
export type DateString = Brand<string, "DateString">;

/**
 * 時刻型（HH:mm:ss形式）
 */
export type TimeString = Brand<string, "TimeString">;

/**
 * 金額型（日本円）
 */
export type JPYAmount = Brand<number, "JPYAmount">;

/**
 * パーセンテージ型（0-100）
 */
export type Percentage = Brand<number, "Percentage">;

// ============================================
// ブランド型生成ヘルパー関数
// ============================================

/**
 * EmployeeIdを生成
 */
export function toEmployeeId(id: number): EmployeeId {
  if (id <= 0 || !Number.isInteger(id)) {
    throw new Error("Invalid employee ID");
  }
  return id as EmployeeId;
}

/**
 * StampIdを生成
 */
export function toStampId(id: number): StampId {
  if (id <= 0 || !Number.isInteger(id)) {
    throw new Error("Invalid stamp ID");
  }
  return id as StampId;
}

/**
 * NewsIdを生成
 */
export function toNewsId(id: number): NewsId {
  if (id <= 0 || !Number.isInteger(id)) {
    throw new Error("Invalid news ID");
  }
  return id as NewsId;
}

/**
 * SessionIdを生成
 */
export function toSessionId(id: string): SessionId {
  if (!id || id.trim().length === 0) {
    throw new Error("Invalid session ID");
  }
  return id as SessionId;
}

/**
 * CsrfTokenを生成
 */
export function toCsrfToken(token: string): CsrfToken {
  if (!token || token.trim().length === 0) {
    throw new Error("Invalid CSRF token");
  }
  return token as CsrfToken;
}

/**
 * EmailAddressを生成（バリデーション付き）
 */
export function toEmailAddress(email: string): EmailAddress {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address");
  }
  return email as EmailAddress;
}

/**
 * Timestampを生成（ISO 8601形式）
 */
export function toTimestamp(dateStr: string): Timestamp {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid timestamp");
  }
  return date.toISOString() as Timestamp;
}

/**
 * DateStringを生成（YYYY-MM-DD形式）
 */
export function toDateString(date: Date | string): DateString {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) {
    throw new Error("Invalid date");
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as DateString;
}

/**
 * TimeStringを生成（HH:mm:ss形式）
 */
export function toTimeString(date: Date | string): TimeString {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) {
    throw new Error("Invalid time");
  }
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}` as TimeString;
}

/**
 * JPYAmountを生成
 */
export function toJPYAmount(amount: number): JPYAmount {
  if (amount < 0 || !Number.isFinite(amount)) {
    throw new Error("Invalid JPY amount");
  }
  return Math.floor(amount) as JPYAmount;
}

/**
 * Percentageを生成（0-100）
 */
export function toPercentage(value: number): Percentage {
  if (value < 0 || value > 100 || !Number.isFinite(value)) {
    throw new Error("Invalid percentage");
  }
  return value as Percentage;
}

// ============================================
// 型ガード
// ============================================

/**
 * EmployeeId型ガード
 */
export function isEmployeeId(value: unknown): value is EmployeeId {
  return typeof value === "number" && value > 0 && Number.isInteger(value);
}

/**
 * SessionId型ガード
 */
export function isSessionId(value: unknown): value is SessionId {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * EmailAddress型ガード
 */
export function isEmailAddress(value: unknown): value is EmailAddress {
  if (typeof value !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}