/**
 * TypeScript v5 型ガード・型述語ユーティリティ
 *
 * @description
 * 型安全性を高めるための型ガード関数群
 * TypeScript v5の型述語（Type Predicates）を活用
 */

// Top-level regex patterns for performance optimization
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * null/undefinedでないことを保証する型ガード
 *
 * @example
 * ```ts
 * const values = [1, null, 2, undefined, 3];
 * const nonNullValues = values.filter(isNonNullable);
 * // nonNullValues の型: number[]
 * ```
 */
export function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 文字列であることを保証する型ガード
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * 数値であることを保証する型ガード
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * 配列であることを保証する型ガード
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * オブジェクトであることを保証する型ガード
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * エラーオブジェクトであることを保証する型ガード
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * 特定のプロパティが存在することを保証する型ガード
 *
 * @example
 * ```ts
 * if (hasProperty(data, 'id') && hasProperty(data, 'email')) {
 *   // data.id と data.email が安全に使える
 * }
 * ```
 */
export function hasProperty<K extends string>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return isObject(obj) && prop in obj;
}

/**
 * 空でない配列であることを保証する型ガード
 */
export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return value.length > 0;
}

/**
 * 空でない文字列であることを保証する型ガード
 */
export function isNonEmptyString(value: string): value is string {
  return value.length > 0 && value.trim().length > 0;
}

/**
 * 有効な日付文字列であることを保証する型ガード
 */
export function isValidDateString(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

/**
 * 正の整数であることを保証する型ガード
 */
export function isPositiveInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value > 0;
}

/**
 * メールアドレス形式であることを保証する型ガード
 */
export function isEmailFormat(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

/**
 * UUID形式であることを保証する型ガード
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * JSONパース可能な文字列であることを保証する型ガード
 */
export function isJSONString(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Promise型であることを保証する型ガード
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    isObject(value) &&
    "then" in value &&
    typeof (value as { then: unknown }).then === "function"
  );
}

/**
 * 関数であることを保証する型ガード
 */
export function isFunction(
  value: unknown
): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

/**
 * 型安全なObject.keys
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: 2 } as const;
 * const keys = typedKeys(obj); // ('a' | 'b')[]
 * ```
 */
export function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

/**
 * 型安全なObject.entries
 */
export function typedEntries<T extends object>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * 型安全なArray.includes
 *
 * @example
 * ```ts
 * const allowedValues = ['a', 'b', 'c'] as const;
 * if (includes(allowedValues, value)) {
 *   // value の型: 'a' | 'b' | 'c'
 * }
 * ```
 */
export function includes<T extends readonly unknown[]>(
  array: T,
  value: unknown
): value is T[number] {
  return array.includes(value);
}
