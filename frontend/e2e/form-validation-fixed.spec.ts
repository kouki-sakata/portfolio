import { expect, test } from "@playwright/test";
import { createAdminUser } from "./support/factories";
import { createAppMockServer } from "./support/mockServer";

test.describe("フォームバリデーションの修正版テスト", () => {
  test.beforeEach(async ({ page }) => {
    const adminUser = createAdminUser();
    const _server = await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
      initialEmployees: [],
    });

    // APIレスポンスを明示的に設定
    await page.route("**/api/employees", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ employees: [] }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto("/admin/employees");

    // ページが完全に読み込まれるまで待つ
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /従業員管理/ })).toBeVisible(
      {
        timeout: 15_000,
      }
    );

    // 新規登録フォームを開く
    await page.getByRole("button", { name: "新規登録" }).click();

    // フォームが表示されるのを待つ
    await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();
    await expect(page.getByRole("button", { name: "登録する" })).toBeVisible();
  });

  test("必須項目が空の場合、エラーメッセージが表示される", async ({ page }) => {
    await test.step("空のまま送信", async () => {
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("必須項目エラーを確認", async () => {
      // FormMessageコンポーネントが生成するエラーメッセージを探す
      await expect(page.getByText("姓は必須です")).toBeVisible();
      await expect(page.getByText("名は必須です")).toBeVisible();
      await expect(page.getByText("メールアドレスは必須です")).toBeVisible();
      await expect(
        page.getByText("パスワードは8文字以上で入力してください")
      ).toBeVisible();
    });
  });

  test("メールアドレス形式が不正な場合、エラーメッセージが表示される", async ({
    page,
  }) => {
    await test.step("不正な形式のメールアドレスを入力", async () => {
      await page.getByLabel("姓").fill("テスト");
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill("invalid-email");
      await page.getByLabel("パスワード").fill("Password123!");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("メール形式エラーを確認", async () => {
      await expect(
        page.getByText("有効なメールアドレスを入力してください")
      ).toBeVisible();
    });
  });

  test("パスワード強度が不十分な場合、エラーメッセージが表示される", async ({
    page,
  }) => {
    await test.step("弱いパスワードを入力", async () => {
      await page.getByLabel("姓").fill("テスト");
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.getByLabel("パスワード").fill("weak");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("パスワード強度エラーを確認", async () => {
      await expect(
        page.getByText("パスワードは8文字以上で入力してください")
      ).toBeVisible();
    });
  });

  test("入力フィールドのリアルタイムバリデーションが動作する", async ({
    page,
  }) => {
    await test.step("メールアドレスフィールドにフォーカスして離脱", async () => {
      const emailField = page.getByLabel("メールアドレス");
      await emailField.focus();
      await emailField.fill("invalid");
      // タブキーでフィールドから離脱
      await emailField.press("Tab");
    });

    await test.step("リアルタイムエラーを確認", async () => {
      // リアルタイムバリデーションによるエラー表示
      await expect(
        page.getByText("有効なメールアドレスを入力してください")
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test("最大文字数制限が機能する", async ({ page }) => {
    await test.step("最大文字数を超える入力", async () => {
      const longText = "あ".repeat(51); // 50文字制限を超える
      await page.getByLabel("姓").fill(longText);
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.getByLabel("パスワード").fill("Password123!");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("文字数制限エラーを確認", async () => {
      await expect(
        page.getByText("姓は50文字以内で入力してください")
      ).toBeVisible();
    });
  });
});
