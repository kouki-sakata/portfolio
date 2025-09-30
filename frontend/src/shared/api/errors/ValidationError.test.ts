import { describe, expect, it } from "vitest";
import { ApiError } from "./ApiError";
import { ValidationError } from "./ValidationError";

describe("ValidationError", () => {
  it("should be instance of ApiError", () => {
    const error = new ValidationError("Validation failed", 422, {});
    expect(error).toBeInstanceOf(ApiError);
  });

  it("should have status code 422", () => {
    const error = new ValidationError("Validation failed", 422, {});
    expect(error.status).toBe(422);
  });

  it("should have VALIDATION_ERROR code", () => {
    const error = new ValidationError("Validation failed", 422, {});
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("should store field errors", () => {
    const fieldErrors = {
      email: ["メールアドレスが無効です"],
      password: ["パスワードは8文字以上必要です", "英数字を含む必要があります"],
    };
    const error = new ValidationError("Validation failed", 422, fieldErrors);
    expect(error.fieldErrors).toEqual(fieldErrors);
  });

  it("should generate user-friendly message with field errors", () => {
    const fieldErrors = {
      email: ["メールアドレスが無効です"],
      password: ["パスワードは8文字以上必要です"],
    };
    const error = new ValidationError("Validation failed", 422, fieldErrors);
    const message = error.getUserMessage();
    expect(message).toContain("入力内容にエラーがあります");
    expect(message).toContain("メールアドレスが無効です");
    expect(message).toContain("パスワードは8文字以上必要です");
  });

  it("should generate user-friendly message without field errors", () => {
    const error = new ValidationError("Validation failed", 422, {});
    expect(error.getUserMessage()).toBe("入力内容を確認してください。");
  });

  it("should return all error messages as array", () => {
    const fieldErrors = {
      email: ["メールアドレスが無効です"],
      password: ["パスワードは8文字以上必要です", "英数字を含む必要があります"],
    };
    const error = new ValidationError("Validation failed", 422, fieldErrors);
    const messages = error.getAllErrorMessages();
    expect(messages).toEqual([
      "メールアドレスが無効です",
      "パスワードは8文字以上必要です",
      "英数字を含む必要があります",
    ]);
  });

  it("should check if specific field has error", () => {
    const fieldErrors = {
      email: ["メールアドレスが無効です"],
      password: ["パスワードは8文字以上必要です"],
    };
    const error = new ValidationError("Validation failed", 422, fieldErrors);
    expect(error.hasFieldError("email")).toBe(true);
    expect(error.hasFieldError("password")).toBe(true);
    expect(error.hasFieldError("name")).toBe(false);
  });

  it("should get errors for specific field", () => {
    const fieldErrors = {
      email: ["メールアドレスが無効です"],
      password: ["パスワードは8文字以上必要です", "英数字を含む必要があります"],
    };
    const error = new ValidationError("Validation failed", 422, fieldErrors);
    expect(error.getFieldErrors("password")).toEqual([
      "パスワードは8文字以上必要です",
      "英数字を含む必要があります",
    ]);
    expect(error.getFieldErrors("name")).toEqual([]);
  });

  it("should get first error for specific field", () => {
    const fieldErrors = {
      password: ["パスワードは8文字以上必要です", "英数字を含む必要があります"],
    };
    const error = new ValidationError("Validation failed", 422, fieldErrors);
    expect(error.getFirstFieldError("password")).toBe(
      "パスワードは8文字以上必要です"
    );
    expect(error.getFirstFieldError("name")).toBeUndefined();
  });
});
