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
 * カスタムZodエラーマップ
 * Zodのバリデーションエラーを日本語メッセージに変換します
 */
const customErrorMap: ZodErrorMap = (issue: ZodIssueOptionalMessage, _ctx) => {
  // スキーマレベルのカスタムメッセージが設定されている場合は優先
  // issueにmessageが設定されている場合、それはスキーマレベルのカスタムメッセージ
  if (issue.message !== undefined) {
    return { message: issue.message };
  }

  // ZodIssueからErrorContextを構築
  const context: ErrorContext = {
    expected: "expected" in issue ? issue.expected : undefined,
    received: "received" in issue ? issue.received : undefined,
    validation: "validation" in issue ? issue.validation : undefined,
    minimum: "minimum" in issue ? issue.minimum : undefined,
    maximum: "maximum" in issue ? issue.maximum : undefined,
    type:
      "type" in issue
        ? (issue.type as "string" | "number" | "array" | "date")
        : undefined,
    inclusive: "inclusive" in issue ? issue.inclusive : undefined,
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
