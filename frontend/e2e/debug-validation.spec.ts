import { expect, test } from "@playwright/test";
import { createAdminUser } from "./support/factories";
import { createAppMockServer } from "./support/mockServer";

test.describe("バリデーション動作確認", () => {
  test("実際のバリデーションエラーを確認", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
    });

    await page.goto("/admin/employees");
    await expect(page.getByRole("heading", { name: /従業員管理/ })).toBeVisible(
      {
        timeout: 10_000,
      }
    );

    // 新規登録フォームを開く
    await page.getByRole("button", { name: "新規登録" }).click();

    // フォームが表示されるまで待つ
    await expect(page.getByRole("button", { name: "登録する" })).toBeVisible();

    // 空のまま送信してバリデーションエラーを発生させる
    await page.getByRole("button", { name: "登録する" }).click();

    // 少し待って、スクリーンショットを撮る
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "validation-errors.png", fullPage: true });

    // 実際にどんなエラーメッセージが表示されているか確認
    const errorTexts = await page
      .locator('[role="alert"], .text-destructive, [aria-invalid="true"] + *')
      .allTextContents();
    console.log("Found error messages:", errorTexts);

    // FormMessageコンポーネントが表示するエラーを探す
    const formMessages = await page
      .locator('p[id*="form-message"]')
      .allTextContents();
    console.log("FormMessage texts:", formMessages);

    // より汎用的な検索
    const possibleErrors = await page
      .locator("text=/必須|required/i")
      .allTextContents();
    console.log("Possible error texts:", possibleErrors);
  });
});
