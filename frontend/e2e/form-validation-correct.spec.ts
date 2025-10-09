import { expect, test } from "@playwright/test";
import { createAdminUser } from "./support/factories";
import { waitForToast } from "./support/helpers";
import { createAppMockServer } from "./support/mockServer";

test.describe("フォームバリデーション実装確認テスト", () => {
  test.beforeEach(async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
    });

    await page.goto("/admin/employees");

    // ページ読み込み待機
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "従業員管理" })).toBeVisible(
      {
        timeout: 15_000,
      }
    );

    // 新規登録フォームを開く
    await page.getByRole("button", { name: "新規登録" }).click();

    // フォーム表示を確認（heading要素で）
    await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();
  });

  test("必須項目が空の場合、エラーメッセージが表示される", async ({ page }) => {
    // 空のまま送信
    await page.getByRole("button", { name: "登録する" }).click();

    // 実際のエラーメッセージテキストで確認
    await expect(page.getByText("姓は必須です")).toBeVisible();
    await expect(page.getByText("名は必須です")).toBeVisible();
    await expect(page.getByText("メールアドレスは必須です")).toBeVisible();
    await expect(
      page.getByText("パスワードは8文字以上で入力してください")
    ).toBeVisible();
  });

  test("メールアドレス形式が不正な場合、エラーメッセージが表示される", async ({
    page,
  }) => {
    await page.getByLabel("姓").fill("テスト");
    await page.getByLabel("名").fill("太郎");
    await page.getByLabel("メールアドレス").fill("invalid-email");
    await page.getByLabel("パスワード").fill("Password123!");

    await page.getByRole("button", { name: "登録する" }).click();

    await expect(
      page.getByText("有効なメールアドレスを入力してください")
    ).toBeVisible();
  });

  test("パスワード強度が不十分な場合、エラーメッセージが表示される", async ({
    page,
  }) => {
    await page.getByLabel("姓").fill("テスト");
    await page.getByLabel("名").fill("太郎");
    await page.getByLabel("メールアドレス").fill("test@example.com");
    await page.getByLabel("パスワード").fill("weak");

    await page.getByRole("button", { name: "登録する" }).click();

    await expect(
      page.getByText("パスワードは8文字以上で入力してください")
    ).toBeVisible();
  });

  test("エラー状態のフィールドが視覚的にハイライトされる", async ({ page }) => {
    await page.getByLabel("メールアドレス").fill("invalid-email");
    await page.getByRole("button", { name: "登録する" }).click();

    const emailField = page.getByLabel("メールアドレス");

    // aria-invalid属性の確認
    await expect(emailField).toHaveAttribute("aria-invalid", "true");
  });

  test("有効な情報を入力した場合、登録が成功する", async ({ page }) => {
    await page.getByLabel("姓").fill("田中");
    await page.getByLabel("名").fill("花子");
    await page.getByLabel("メールアドレス").fill("hanako.tanaka@example.com");
    await page.getByLabel("パスワード").fill("SecurePass123!");

    await page.getByRole("button", { name: "登録する" }).click();

    await waitForToast(page, /登録しました/);
  });
});
