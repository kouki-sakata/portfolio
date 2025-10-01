import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { resetZodErrorMap, setupZodErrorMap } from "./zod-error-map";

describe("setupZodErrorMap", () => {
  beforeEach(() => {
    setupZodErrorMap();
  });

  afterEach(() => {
    resetZodErrorMap();
  });

  describe("必須フィールドエラー", () => {
    it("required（undefined）エラーで日本語メッセージを返す", () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = schema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.at(0)?.message).toContain("必須");
      }
    });

    it("required（null）エラーで日本語メッセージを返す", () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = schema.safeParse({ name: null });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.at(0)?.message).toContain("必須");
      }
    });
  });

  describe("文字列バリデーションエラー", () => {
    it("emailバリデーションエラーで日本語メッセージを返す", () => {
      const schema = z.string().email();

      const result = schema.safeParse("invalid-email");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.at(0)?.message).toContain("メールアドレス");
        expect(result.error.issues.at(0)?.message).toContain("形式");
      }
    });

    it("urlバリデーションエラーで日本語メッセージを返す", () => {
      const schema = z.string().url();

      const result = schema.safeParse("not-a-url");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.at(0)?.message).toContain("URL");
      }
    });

    it("uuidバリデーションエラーで日本語メッセージを返す", () => {
      const schema = z.string().uuid();

      const result = schema.safeParse("not-a-uuid");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.at(0)?.message).toContain("UUID");
      }
    });
  });

  describe("数値範囲エラー", () => {
    it("minエラー（文字列）で最小値を含むメッセージを返す", () => {
      const schema = z.string().min(8);

      const result = schema.safeParse("short");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.at(0)?.message).toContain("8");
        expect(result.error.issues.at(0)?.message).toContain("以上");
      }
    });

    it("maxエラー（文字列）で最大値を含むメッセージを返す", () => {
      const schema = z.string().max(5);

      const result = schema.safeParse("toolongstring");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.at(0)?.message).toContain("5");
        expect(result.error.issues.at(0)?.message).toContain("以下");
      }
    });

    it("minエラー（数値）で最小値を含むメッセージを返す", () => {
      const schema = z.number().min(0);

      const result = schema.safeParse(-1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.at(0)?.message).toContain("0");
        expect(result.error.issues.at(0)?.message).toContain("以上");
      }
    });

    it("maxエラー（数値）で最大値を含むメッセージを返す", () => {
      const schema = z.number().max(100);

      const result = schema.safeParse(101);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.at(0)?.message).toContain("100");
        expect(result.error.issues.at(0)?.message).toContain("以下");
      }
    });
  });

  describe("カスタムエラーメッセージの優先順位", () => {
    it("スキーマレベルのカスタムメッセージが優先される", () => {
      const schema = z.string().email("カスタムエラー");

      const result = schema.safeParse("invalid");
      expect(result.success).toBe(false);
      if (!result.success) {
        // スキーマレベルのカスタムメッセージが優先されるため、
        // グローバルエラーマップのメッセージではなくカスタムメッセージが返される
        expect(result.error.issues.at(0)?.message).toBe("カスタムエラー");
      }
    });

    it("スキーマレベルのカスタムメッセージがない場合、グローバルエラーマップが適用される", () => {
      const schema = z.string().email();

      const result = schema.safeParse("invalid");
      expect(result.success).toBe(false);
      if (!result.success) {
        // グローバルエラーマップのメッセージが適用される
        expect(result.error.issues.at(0)?.message).toContain("メールアドレス");
      }
    });
  });

  describe("複数エラー", () => {
    it("複数のバリデーションエラーが全て日本語メッセージで返される", () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        age: z.number().min(18).max(120),
      });

      const result = schema.safeParse({
        email: "invalid",
        password: "short",
        age: 150,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
        expect(result.error.issues.at(0)?.message).toContain("メールアドレス");
        expect(result.error.issues.at(1)?.message).toContain("8");
        expect(result.error.issues.at(2)?.message).toContain("120");
      }
    });
  });

  describe("resetZodErrorMap", () => {
    it("エラーマップをリセットすると英語メッセージに戻る", () => {
      resetZodErrorMap();

      const schema = z.string().email();
      const result = schema.safeParse("invalid");

      expect(result.success).toBe(false);
      if (!result.success) {
        // リセット後は英語のデフォルトメッセージ
        expect(result.error.issues.at(0)?.message).not.toContain(
          "メールアドレス"
        );
        expect(result.error.issues.at(0)?.message).toContain("email");
      }
    });
  });
});
