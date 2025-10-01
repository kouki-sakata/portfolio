/**
 * Zodバリデーションエラーメッセージの日本語辞書
 * @module validation-messages
 */

/**
 * Zodのエラーコード型定義
 */
export type ZodErrorCode =
  | "invalid_type"
  | "invalid_literal"
  | "custom"
  | "invalid_union"
  | "invalid_union_discriminator"
  | "invalid_enum_value"
  | "unrecognized_keys"
  | "invalid_arguments"
  | "invalid_return_type"
  | "invalid_date"
  | "invalid_string"
  | "too_small"
  | "too_big"
  | "invalid_intersection_types"
  | "not_multiple_of"
  | "not_finite";

/**
 * エラーメッセージコンテキスト
 */
export type ErrorContext = {
  expected?: string;
  received?: string;
  validation?: string;
  minimum?: number;
  maximum?: number;
  type?: "string" | "number" | "array" | "date";
  inclusive?: boolean;
  message?: string;
};

/**
 * 文字列バリデーションのエラーメッセージマップ
 * @public 他のモジュールでの再利用が可能
 */
export const STRING_VALIDATION_MESSAGES: Record<string, string> = {
  email: "有効なメールアドレスの形式で入力してください",
  url: "有効なURLの形式で入力してください",
  uuid: "有効なUUID形式で入力してください",
  cuid: "有効なCUID形式で入力してください",
  cuid2: "有効なCUID2形式で入力してください",
  ulid: "有効なULID形式で入力してください",
  regex: "指定された形式で入力してください",
  datetime: "有効な日時形式で入力してください",
  ip: "有効なIPアドレスで入力してください",
};

/**
 * エラーコード別のメッセージ生成関数マップ
 */
const ERROR_MESSAGE_GENERATORS: Record<
  ZodErrorCode,
  (ctx: ErrorContext) => string
> = {
  invalid_type: (ctx) => {
    if (ctx.received === "undefined" || ctx.received === "null") {
      return "この項目は必須です";
    }
    return `${ctx.expected ?? "適切な型"}が期待されています`;
  },

  invalid_literal: () => "指定された値と一致する必要があります",

  custom: (ctx) => {
    if (ctx.message) {
      return ctx.message;
    }
    return "入力内容をご確認ください";
  },

  invalid_union: () => "入力内容が不正です",

  invalid_union_discriminator: () => "判別子の値が不正です",

  invalid_enum_value: () => "選択可能な値のいずれかを選択してください",

  unrecognized_keys: () => "認識できないキーが含まれています",

  invalid_arguments: () => "関数の引数が不正です",

  invalid_return_type: () => "関数の戻り値の型が不正です",

  invalid_date: () => "無効な日付です",

  invalid_string: (ctx) => {
    if (ctx.validation && ctx.validation in STRING_VALIDATION_MESSAGES) {
      return (
        STRING_VALIDATION_MESSAGES[ctx.validation] ?? "文字列の形式が不正です"
      );
    }
    return "文字列の形式が不正です";
  },

  too_small: (ctx) => {
    const min = ctx.minimum ?? 0;
    const type = ctx.type;

    if (type === "string") {
      return `${min}文字以上で入力してください`;
    }
    if (type === "number") {
      return `${min}以上の値を入力してください`;
    }
    if (type === "array") {
      return `${min}個以上の項目を選択してください`;
    }
    return `最小値は${min}です`;
  },

  too_big: (ctx) => {
    const max = ctx.maximum ?? 0;
    const type = ctx.type;

    if (type === "string") {
      return `${max}文字以下で入力してください`;
    }
    if (type === "number") {
      return `${max}以下の値を入力してください`;
    }
    if (type === "array") {
      return `${max}個以下の項目を選択してください`;
    }
    return `最大値は${max}です`;
  },

  invalid_intersection_types: () => "交差型の条件を満たしていません",

  not_multiple_of: () => "指定された倍数である必要があります",

  not_finite: () => "有限の数値である必要があります",
};

/**
 * Zodエラーコードに対応する日本語メッセージを取得する
 * @param code - Zodエラーコード
 * @param context - エラーコンテキスト（オプション）
 * @returns 日本語エラーメッセージ
 */
export function getValidationMessage(
  code: ZodErrorCode,
  context?: ErrorContext
): string {
  const generator = ERROR_MESSAGE_GENERATORS[code];

  if (!generator) {
    // 未知のエラーコードの場合はデフォルトメッセージ
    return "入力内容をご確認ください";
  }

  return generator(context ?? {});
}

/**
 * すべてのエラーコードとそのデフォルトメッセージを取得する（デバッグ用）
 */
export function getAllValidationMessages(): Record<ZodErrorCode, string> {
  const messages: Partial<Record<ZodErrorCode, string>> = {};

  for (const code of Object.keys(ERROR_MESSAGE_GENERATORS) as ZodErrorCode[]) {
    messages[code] = getValidationMessage(code, {});
  }

  return messages as Record<ZodErrorCode, string>;
}
