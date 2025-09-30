import { ApiError } from "./ApiError";

/**
 * バリデーションエラーを表すクラス
 * フォーム入力値の検証エラーなどを処理します
 */
export class ValidationError extends ApiError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]>
  ) {
    super(message, status, "VALIDATION_ERROR");
    this.fieldErrors = fieldErrors;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  override getUserMessage(): string {
    const errorMessages = this.getAllErrorMessages();

    if (errorMessages.length === 0) {
      return "入力内容を確認してください。";
    }

    return `入力内容にエラーがあります:\n${errorMessages.join("\n")}`;
  }

  /**
   * すべてのエラーメッセージを配列として取得
   */
  getAllErrorMessages(): string[] {
    const messages: string[] = [];

    for (const field in this.fieldErrors) {
      if (Object.hasOwn(this.fieldErrors, field)) {
        const errors = this.fieldErrors[field];
        if (errors) {
          messages.push(...errors);
        }
      }
    }

    return messages;
  }

  /**
   * 特定のフィールドにエラーがあるかチェック
   */
  hasFieldError(field: string): boolean {
    const errors = this.fieldErrors[field];
    return errors !== undefined && errors.length > 0;
  }

  /**
   * 特定のフィールドのエラーメッセージを取得
   */
  getFieldErrors(field: string): string[] {
    return this.fieldErrors[field] || [];
  }

  /**
   * 特定のフィールドの最初のエラーメッセージを取得
   */
  getFirstFieldError(field: string): string | undefined {
    const errors = this.getFieldErrors(field);
    return errors.length > 0 ? errors[0] : undefined;
  }
}
