/**
 * EnhancedFormField コンポーネントのテスト
 * TDDサイクル: RED（このテストは最初失敗する）
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EnhancedFormField } from "./enhanced-form-field";

// テスト用スキーマ
const testSchema = z.object({
  username: z.string().min(3, "3文字以上で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
});

type TestFormData = z.infer<typeof testSchema>;

// テスト用コンポーネント
function TestForm() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    mode: "onTouched",
    defaultValues: {
      username: "",
      email: "",
    },
  });

  return (
    <Form {...form}>
      <form>
        <EnhancedFormField
          control={form.control}
          description="ユーザー名の入力ガイド"
          label="ユーザー名"
          name="username"
        >
          {(field) => <Input {...field} placeholder="username" />}
        </EnhancedFormField>

        <EnhancedFormField
          control={form.control}
          label="メールアドレス"
          name="email"
        >
          {(field) => (
            <Input {...field} placeholder="email@example.com" type="email" />
          )}
        </EnhancedFormField>
      </form>
    </Form>
  );
}

describe("EnhancedFormField", () => {
  describe("エラー表示", () => {
    it("エラーがある場合にエラーアイコンを表示する", async () => {
      render(<TestForm />);
      const user = userEvent.setup();

      const input = screen.getByPlaceholderText("username");

      // フィールドをタッチしてエラーをトリガー
      await user.click(input);
      await user.tab();

      // エラーアイコンが表示されることを確認
      await waitFor(() => {
        const errorIcon = screen.getByRole("img", { hidden: true });
        expect(errorIcon).toBeInTheDocument();
      });
    });

    it("エラーメッセージを表示する", async () => {
      render(<TestForm />);
      const user = userEvent.setup();

      const input = screen.getByPlaceholderText("username");

      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText("3文字以上で入力してください")
        ).toBeInTheDocument();
      });
    });

    it("エラーがない場合はエラーアイコンを表示しない", () => {
      render(<TestForm />);

      // 初期状態ではエラーアイコンなし
      const errorIcon = screen.queryByRole("img", { hidden: true });
      expect(errorIcon).not.toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("エラー時にaria-invalid=trueを設定する", async () => {
      render(<TestForm />);
      const user = userEvent.setup();

      const input = screen.getByPlaceholderText("username");

      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(input).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("エラーメッセージをaria-describedbyで関連付ける", async () => {
      render(<TestForm />);
      const user = userEvent.setup();

      const input = screen.getByPlaceholderText("username");

      await user.click(input);
      await user.tab();

      await waitFor(() => {
        const describedBy = input.getAttribute("aria-describedby");
        expect(describedBy).toBeTruthy();

        if (describedBy) {
          // aria-describedby は複数のIDをスペース区切りで含む可能性がある
          const ids = describedBy.split(" ");
          const messageId = ids.find((id) => id.includes("message"));

          if (messageId) {
            const errorMessage = document.getElementById(messageId);
            expect(errorMessage).toHaveTextContent(
              "3文字以上で入力してください"
            );
          }
        }
      });
    });
  });

  describe("視覚的フィードバック", () => {
    it("エラー時に入力フィールドに destructive スタイルを適用する", async () => {
      render(<TestForm />);
      const user = userEvent.setup();

      const input = screen.getByPlaceholderText("username");

      await user.click(input);
      await user.tab();

      await waitFor(() => {
        // border-destructive クラスまたはaria-invalid属性の存在を確認
        expect(
          input.classList.contains("border-destructive") ||
            input.getAttribute("aria-invalid") === "true"
        ).toBe(true);
      });
    });
  });

  describe("説明テキスト", () => {
    it("description propが提供されている場合、説明テキストを表示する", () => {
      render(<TestForm />);

      expect(screen.getByText("ユーザー名の入力ガイド")).toBeInTheDocument();
    });

    it("description propがない場合、説明テキストを表示しない", () => {
      render(<TestForm />);

      // email フィールドには description がない
      const emailInput = screen.getByPlaceholderText("email@example.com");
      const formItem =
        emailInput.closest('[role="group"]') || emailInput.parentElement;

      if (formItem) {
        // FormDescription要素が存在しないことを確認
        const descriptions = formItem.querySelectorAll(
          '[id$="-form-item-description"]'
        );
        expect(descriptions.length).toBe(0);
      }
    });
  });
});
