/**
 * Zodカスタムエラーマップ
 * グローバルにZodのエラーメッセージを日本語化します
 * @module zod-error-map
 */

import { type ZodErrorMap, type ZodIssueOptionalMessage, z } from "zod";
import {
  type ErrorContext,
  getValidationMessage,
  type ZodErrorCode,
} from "./validation-messages";

/**
 * unknown 型を string に narrowing するヘルパー関数
 */
function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * unknown 型を number に narrowing するヘルパー関数（bigint を除外）
 */
function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

/**
 * カスタムZodエラーマップ
 * Zodのバリデーションエラーを日本語メッセージに変換します
 */
const customErrorMap: ZodErrorMap = (issue: ZodIssueOptionalMessage, _ctx) => {
  // スキーマレベルのカスタムメッセージが設定されている場合は優先
  // issueにmessageが設定されている場合、それはスキーマレベルのカスタムメッセージ
  if (issue.message !== undefined) {
    return { message: issue.message };
  }

  // ZodIssueからErrorContextを構築（型安全に）
  const context: ErrorContext = {
    expected:
      "expected" in issue && isString(issue.expected)
        ? issue.expected
        : undefined,
    received:
      "received" in issue && isString(issue.received)
        ? issue.received
        : undefined,
    validation:
      "validation" in issue && isString(issue.validation)
        ? issue.validation
        : undefined,
    minimum:
      "minimum" in issue && isNumber(issue.minimum) ? issue.minimum : undefined,
    maximum:
      "maximum" in issue && isNumber(issue.maximum) ? issue.maximum : undefined,
    type:
      "type" in issue && isString(issue.type)
        ? (issue.type as "string" | "number" | "array" | "date")
        : undefined,
    inclusive:
      "inclusive" in issue && typeof issue.inclusive === "boolean"
        ? issue.inclusive
        : undefined,
  };

  // validation-messagesからメッセージを取得
  const message = getValidationMessage(issue.code as ZodErrorCode, context);

  return { message };
};

/**
 * グローバルにZodエラーマップを設定します
 * アプリケーション起動時に一度だけ呼び出してください
 */
export function setupZodErrorMap(): void {
  z.setErrorMap(customErrorMap);
}

/**
 * Zodエラーマップをデフォルトにリセットします
 * 主にテスト環境での使用を想定しています
 */
export function resetZodErrorMap(): void {
  // Zodのデフォルトエラーマップに戻す
  z.setErrorMap((_issue, ctx) => ({
    message: ctx.defaultError,
  }));
}
