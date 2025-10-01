import { describe, expect, it } from "vitest";
import { getValidationMessage, type ZodErrorCode } from "./validation-messages";

describe("getValidationMessage", () => {
  describe("基本的なエラーコード", () => {
    it("invalid_type エラーの日本語メッセージを返す", () => {
      const message = getValidationMessage("invalid_type", {
        expected: "string",
        received: "number",
      });
      expect(message).toContain("string");
      expect(message).toContain("期待");
    });

    it("required エラーの日本語メッセージを返す", () => {
      const message = getValidationMessage("invalid_type", {
        expected: "string",
        received: "undefined",
      });
      expect(message).toContain("必須");
    });
  });

  describe("文字列バリデーションエラー", () => {
    it("email バリデーションエラーの日本語メッセージを返す", () => {
      const message = getValidationMessage("invalid_string", {
        validation: "email",
      });
      expect(message).toContain("メールアドレス");
      expect(message).toContain("形式");
    });

    it("url バリデーションエラーの日本語メッセージを返す", () => {
      const message = getValidationMessage("invalid_string", {
        validation: "url",
      });
      expect(message).toContain("URL");
    });

    it("uuid バリデーションエラーの日本語メッセージを返す", () => {
      const message = getValidationMessage("invalid_string", {
        validation: "uuid",
      });
      expect(message).toContain("UUID");
    });
  });

  describe("数値範囲エラー", () => {
    it("too_small エラーで最小値を含むメッセージを返す（文字列）", () => {
      const message = getValidationMessage("too_small", {
        minimum: 8,
        type: "string",
        inclusive: true,
      });
      expect(message).toContain("8");
      expect(message).toContain("以上");
    });

    it("too_small エラーで最小値を含むメッセージを返す（数値）", () => {
      const message = getValidationMessage("too_small", {
        minimum: 0,
        type: "number",
        inclusive: true,
      });
      expect(message).toContain("0");
      expect(message).toContain("以上");
    });

    it("too_big エラーで最大値を含むメッセージを返す（文字列）", () => {
      const message = getValidationMessage("too_big", {
        maximum: 255,
        type: "string",
        inclusive: true,
      });
      expect(message).toContain("255");
      expect(message).toContain("以下");
    });

    it("too_big エラーで最大値を含むメッセージを返す（数値）", () => {
      const message = getValidationMessage("too_big", {
        maximum: 100,
        type: "number",
        inclusive: true,
      });
      expect(message).toContain("100");
      expect(message).toContain("以下");
    });
  });

  describe("日付エラー", () => {
    it("invalid_date エラーの日本語メッセージを返す", () => {
      const message = getValidationMessage("invalid_date", {});
      expect(message).toContain("日付");
      expect(message).toContain("無効");
    });
  });

  describe("カスタムエラー", () => {
    it("custom エラーでパラメータなしの場合デフォルトメッセージを返す", () => {
      const message = getValidationMessage("custom", {});
      expect(message).toContain("入力内容");
      expect(message).toContain("確認");
    });

    it("custom エラーでメッセージが提供される場合そのまま返す", () => {
      const message = getValidationMessage("custom", {
        message: "カスタムエラーメッセージ",
      });
      expect(message).toBe("カスタムエラーメッセージ");
    });
  });

  describe("エッジケース", () => {
    it("未知のエラーコードの場合デフォルトメッセージを返す", () => {
      const message = getValidationMessage("unknown_code" as ZodErrorCode, {});
      expect(message).toContain("入力内容");
      expect(message).toContain("確認");
    });

    it("コンテキストがundefinedの場合でもエラーを出さない", () => {
      const message = getValidationMessage("invalid_type", undefined);
      expect(message).toBeTruthy();
      expect(typeof message).toBe("string");
    });
  });
});
