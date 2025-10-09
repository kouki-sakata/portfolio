import { expect, test } from "@playwright/test";
import { createAdminUser, TEST_CREDENTIALS } from "./support/factories";
import {
  setupConsoleErrorListener,
  signIn,
  waitForToast,
} from "./support/helpers";
import { createAppMockServer } from "./support/mockServer";

test.describe("エラーハンドリングの包括的テスト", () => {
  // TODO: ネットワークエラー時のトースト通知表示テストを修正
  // - mockServerのsetErrorSimulationが正しく動作していない可能性
  // - トースト通知の表示タイミングや条件を再確認する必要がある
  // NOTE: トースト通知はまだUIに実装されていないため、このテストはスキップ
  test.skip("ネットワークエラー時にトースト通知が表示される", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("ネットワークエラーをシミュレート", async () => {
      // 打刻APIにネットワークエラーを設定
      server.setErrorSimulation({
        endpoint: "/home/stamps",
        method: "POST",
        status: 0,
        message: "Network error",
      });

      await page.getByRole("button", { name: "出勤打刻" }).click();
    });

    await test.step("エラートースト表示を確認", async () => {
      await waitForToast(page, /ネットワークエラー|通信エラー|接続に失敗/);
    });
  });

  // TODO: サーバーエラー（500）時のエラーメッセージ表示テストを修正
  // - エラーシミュレーション後のトースト通知が期待通り表示されない
  // - エラーメッセージの検証パターンを見直す必要がある
  test("サーバーエラー（500）時に適切なエラーメッセージが表示される", async ({
    page,
  }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("サーバーエラーをシミュレート", async () => {
      server.setErrorSimulation({
        endpoint: "/home/stamps",
        method: "POST",
        status: 500,
        message: "Internal Server Error",
      });

      await page.getByRole("button", { name: "出勤打刻" }).click();
    });

    await test.step("エラーメッセージ表示を確認", async () => {
      await waitForToast(page, /サーバーエラー|エラーが発生|しばらくしてから/);
    });
  });

  test("バリデーションエラー時にフィールド下にエラーが表示される", async ({
    page,
  }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
    });

    await test.step("従業員管理ページに遷移", async () => {
      await page.goto("/admin/employees");
      await expect(
        page.getByRole("heading", { name: "従業員管理" })
      ).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("必須項目を空のまま送信", async () => {
      await page.getByRole("button", { name: "新規登録" }).click();

      // メールアドレスとパスワードを空のまま登録ボタンをクリック
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("バリデーションエラーメッセージを確認", async () => {
      // フィールド下にエラーメッセージが表示される
      await expect(
        page.getByText(/必須|入力してください|required/i).first()
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test("不正なメールアドレス形式でバリデーションエラーが表示される", async ({
    page,
  }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
    });

    await page.goto("/admin/employees");
    await page.getByRole("button", { name: "新規登録" }).click();

    await test.step("不正なメールアドレスを入力", async () => {
      await page.getByLabel("姓").fill("テスト");
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill("invalid-email");
      await page.getByLabel("パスワード").fill("Password123!");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("メール形式エラーを確認", async () => {
      await expect(
        page.getByText("有効なメールアドレスを入力してください")
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test("存在しないリソースへのアクセスで404エラーページが表示される", async ({
    page,
  }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
    });

    await test.step("存在しないページにアクセス", async () => {
      await page.goto("/non-existent-page");

      // 404エラーページのコンテンツを確認（SPAは200を返すため内容で判定）
      await expect(page.getByText("404")).toBeVisible();
      await expect(page.getByText(/ページが見つかりません/)).toBeVisible();
    });
  });

  test("APIタイムアウト時にエラーハンドリングされる", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("タイムアウトをシミュレート", async () => {
      // 長時間レスポンスしないエンドポイント（実装依存）
      server.setErrorSimulation({
        endpoint: "/home/stamps",
        method: "POST",
        status: 408,
        message: "Request Timeout",
      });

      await page.getByRole("button", { name: "出勤打刻" }).click();
    });

    await test.step("タイムアウトエラーメッセージを確認", async () => {
      await waitForToast(page, /タイムアウト|時間切れ|timeout/i);
    });
  });

  test("重複メールアドレスで409エラーが表示される", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
    });

    await page.goto("/admin/employees");
    await page.getByRole("button", { name: "新規登録" }).click();

    await test.step("既存のメールアドレスで登録試行", async () => {
      server.setErrorSimulation({
        endpoint: "/employees",
        method: "POST",
        status: 409,
        message: "Email already exists",
      });

      await page.getByLabel("姓").fill("テスト");
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill("existing@example.com");
      await page.getByLabel("パスワード").fill("Password123!");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("重複エラーメッセージを確認", async () => {
      await waitForToast(page, /既に登録|重複|already exists/i);
    });
  });

  test("コンソールエラーが発生しないことを確認", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, { user: adminUser });

    const consoleErrors = setupConsoleErrorListener(page);

    await test.step("通常のフローを実行", async () => {
      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      // 複数のページをナビゲート
      await page.getByRole("link", { name: "勤怠履歴" }).click();
      await expect(page).toHaveURL(/\/stamp-history/);

      await page.getByRole("link", { name: "ホーム" }).click();
      await expect(page).toHaveURL(/\/$/);
    });

    await test.step("クリティカルなコンソールエラーがないことを確認", () => {
      const criticalErrors = consoleErrors.filter(
        (error) =>
          error.includes("Maximum update depth exceeded") ||
          error.includes("Failed to fetch") ||
          error.includes("Uncaught")
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  // TODO: フォーム送信中のローディング状態表示テストを実装
  // - 現在の実装にはローディングインジケーターがない
  // - isPending状態を利用したボタン無効化/ローディング表示の実装が必要
  test.skip("フォーム送信中のローディング状態が表示される", async ({
    page,
  }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
    });

    await page.goto("/admin/employees");
    await page.getByRole("button", { name: "新規登録" }).click();

    await test.step("フォーム送信時のローディング状態を確認", async () => {
      await page.getByLabel("姓").fill("テスト");
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.getByLabel("パスワード").fill("Password123!");

      const submitButton = page.getByRole("button", { name: "登録する" });
      await submitButton.click();

      // ローディングインジケーターまたはボタン無効化を確認
      const isDisabled = await submitButton.isDisabled().catch(() => false);
      const hasLoadingIndicator = await page
        .locator('[data-loading="true"], [aria-busy="true"]')
        .isVisible()
        .catch(() => false);

      expect(isDisabled || hasLoadingIndicator).toBe(true);
    });
  });

  test("APIエラー後もアプリケーションが操作可能", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("エラーを発生させる", async () => {
      server.setErrorSimulation({
        endpoint: "/home/stamps",
        method: "POST",
        status: 500,
        message: "Server error",
      });

      await page.getByRole("button", { name: "出勤打刻" }).click();
      await waitForToast(page, /エラー/i);
    });

    await test.step("エラー後も他の操作が可能", async () => {
      // エラーシミュレーションをクリア
      server.clearErrorSimulations();

      // ナビゲーションが正常に動作
      await page.getByRole("link", { name: "勤怠履歴" }).click();
      await expect(page).toHaveURL(/\/stamp-history/);
      await expect(
        page.getByRole("heading", { name: "打刻履歴" })
      ).toBeVisible();
    });
  });
});
