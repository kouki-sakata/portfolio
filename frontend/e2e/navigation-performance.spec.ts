import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type { EmployeeSummary } from "@/features/auth/types";
import { createAppMockServer } from "./support/mockServer";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin.user@example.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "AdminPass123!";

/**
 * サインインヘルパー関数
 */
const signIn = async (page: Page, email: string, password: string) => {
  await test.step("サインインページに移動", async () => {
    await page.goto("/signin");
    await expect(
      page.getByRole("heading", { name: "TeamDevelop Bravo にサインイン" })
    ).toBeVisible();
  });

  await test.step("資格情報を入力してサインイン", async () => {
    await page.getByLabel("メールアドレス").fill(email);
    await page.getByLabel("パスワード").fill(password);
    await page.getByRole("button", { name: "サインイン" }).click();
  });

  await test.step("ホーム画面の読み込みを待機", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: /おはようございます/ })
    ).toBeVisible({ timeout: 15_000 });
  });
};

test.describe("ナビゲーションパフォーマンステスト", () => {
  test.beforeEach(async ({ page }) => {
    const adminUser: EmployeeSummary = {
      id: 1,
      firstName: "太郎",
      lastName: "山田",
      email: ADMIN_EMAIL,
      admin: true,
    };

    await createAppMockServer(page, { user: adminUser });
  });

  test("サイドバーナビゲーション: ホーム → 勤怠履歴が素早く切り替わる", async ({
    page,
  }) => {
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Performance timing APIを使用して計測
    const navigationStart = Date.now();

    // 勤怠履歴へナビゲーション
    await page.getByRole("link", { name: "勤怠履歴" }).click();

    // URLが変わることを確認
    await expect(page).toHaveURL(/\/stamp-history/);

    // ページコンテンツが表示されることを確認
    await expect(page.getByRole("heading", { name: "打刻履歴" })).toBeVisible({
      timeout: 5000,
    });

    const navigationEnd = Date.now();
    const navigationTime = navigationEnd - navigationStart;

    // ナビゲーションが1秒以内に完了することを確認（目標: 300ms、現実的: 1000ms）
    expect(navigationTime).toBeLessThan(1000);

    console.log(`ホーム → 勤怠履歴のナビゲーション時間: ${navigationTime}ms`);
  });

  test("サイドバーナビゲーション: 勤怠履歴 → ホームが素早く切り替わる", async ({
    page,
  }) => {
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // まず勤怠履歴へ移動
    await page.getByRole("link", { name: "勤怠履歴" }).click();
    await expect(page).toHaveURL(/\/stamp-history/);
    await expect(page.getByRole("heading", { name: "打刻履歴" })).toBeVisible();

    // ホームへ戻る際の時間を計測
    const navigationStart = Date.now();

    await page.getByRole("link", { name: "ホーム" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: /おはようございます/ })
    ).toBeVisible({
      timeout: 5000,
    });

    const navigationEnd = Date.now();
    const navigationTime = navigationEnd - navigationStart;

    expect(navigationTime).toBeLessThan(1000);

    console.log(`勤怠履歴 → ホームのナビゲーション時間: ${navigationTime}ms`);
  });

  test("サイドバーナビゲーション: ホーム → 社員管理が素早く切り替わる", async ({
    page,
  }) => {
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    const navigationStart = Date.now();

    await page.getByRole("link", { name: "社員管理" }).click();

    await expect(page).toHaveURL(/\/admin\/employees/);
    await expect(page.getByRole("heading", { name: "従業員管理" })).toBeVisible(
      {
        timeout: 5000,
      }
    );

    const navigationEnd = Date.now();
    const navigationTime = navigationEnd - navigationStart;

    expect(navigationTime).toBeLessThan(1000);

    console.log(`ホーム → 社員管理のナビゲーション時間: ${navigationTime}ms`);
  });

  test("ブラウザの戻るボタンが正常に動作する", async ({ page }) => {
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // ホーム → 勤怠履歴
    await page.getByRole("link", { name: "勤怠履歴" }).click();
    await expect(page).toHaveURL(/\/stamp-history/);

    // ブラウザの戻るボタン
    await page.goBack();

    // ホームに戻ることを確認
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: /おはようございます/ })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("ブラウザの進むボタンが正常に動作する", async ({ page }) => {
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // ホーム → 勤怠履歴
    await page.getByRole("link", { name: "勤怠履歴" }).click();
    await expect(page).toHaveURL(/\/stamp-history/);

    // ブラウザの戻るボタン
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);

    // ブラウザの進むボタン
    await page.goForward();

    // 勤怠履歴に戻ることを確認
    await expect(page).toHaveURL(/\/stamp-history/);
    await expect(page.getByRole("heading", { name: "打刻履歴" })).toBeVisible();
  });

  test("ページナビゲーション中にコンソールエラーが発生しない", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    // コンソールエラーを監視
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // 複数のページ間をナビゲーション
    await page.getByRole("link", { name: "勤怠履歴" }).click();
    await expect(page).toHaveURL(/\/stamp-history/);

    await page.getByRole("link", { name: "ホーム" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("link", { name: "社員管理" }).click();
    await expect(page).toHaveURL(/\/admin\/employees/);

    // コンソールエラーがないことを確認
    // Note: "Maximum update depth exceeded" エラーが修正されていることを確認
    const criticalErrors = consoleErrors.filter(
      (error) =>
        error.includes("Maximum update depth exceeded") ||
        error.includes("Failed to fetch") ||
        error.includes("Network error")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
