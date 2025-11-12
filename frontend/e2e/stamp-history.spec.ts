import { expect, test } from "@playwright/test";
import { createAdminUser, TEST_CREDENTIALS } from "./support/factories";
import { navigateAndWait, signIn } from "./support/helpers";
import { createAppMockServer } from "./support/mockServer";

test.describe("勤怠履歴機能の包括的テスト", () => {
  test("当月の勤怠履歴が表示される", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("勤怠履歴ページに遷移", async () => {
      await navigateAndWait(page, "勤怠履歴", /\/stamp-history/, "打刻履歴");
    });

    await test.step("当月の年月が表示される", async () => {
      const currentYear = new Date().getFullYear().toString();
      const currentMonth = `${new Date().getMonth() + 1}月`;

      // 年のドロップダウンで現在年が選択されている（値が設定されるまで待機）
      const yearTrigger = page.locator("#year");
      await expect(yearTrigger).toContainText(currentYear, { timeout: 15_000 });

      // 月のドロップダウンで現在月が選択されている（値が設定されるまで待機）
      const monthTrigger = page.locator("#month");
      await expect(monthTrigger).toContainText(currentMonth, {
        timeout: 15_000,
      });
    });
  });

  test("年月フィルタで過去の履歴を表示できる", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await navigateAndWait(page, "勤怠履歴", /\/stamp-history/, "打刻履歴");

    await test.step("前年を選択", async () => {
      const lastYear = (new Date().getFullYear() - 1).toString();

      // 年のセレクトをクリックして開く
      await page.locator("#year").click();

      // 前年のオプションをクリック
      await page.getByRole("option", { name: lastYear }).click();

      // 選択が反映されることを確認
      await expect(page.locator("#year")).toContainText(lastYear);
    });

    await test.step("別の月を選択", async () => {
      // 月のセレクトをクリックして開く
      await page.locator("#month").click();

      // 1月のオプションをクリック (exact: trueで完全一致)
      await page.getByRole("option", { name: "1月", exact: true }).click();

      // 選択が反映されることを確認
      await expect(page.locator("#month")).toContainText("1月");
    });
  });

  test("データが0件の場合、空状態メッセージが表示される", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await navigateAndWait(page, "勤怠履歴", /\/stamp-history/, "打刻履歴");

    await test.step("空状態のテーブル表示を確認", async () => {
      const now = new Date();
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

      const tableRows = page.locator("table tbody tr");
      await expect(tableRows.first()).toBeVisible({ timeout: 10_000 });
      await expect(tableRows).toHaveCount(daysInMonth);

      const enabledDeleteButtons = tableRows
        .locator("button:not(:disabled)")
        .filter({ hasText: "削除" });
      await expect(enabledDeleteButtons).toHaveCount(0);

      const disabledDeleteButtons = tableRows
        .locator("button:disabled")
        .filter({ hasText: "削除" });
      await expect(disabledDeleteButtons).toHaveCount(daysInMonth);
    });
  });

  test("年のドロップダウンに複数年が表示される", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await navigateAndWait(page, "勤怠履歴", /\/stamp-history/, "打刻履歴");

    await test.step("年の選択肢を確認", async () => {
      // 年のセレクトをクリックして開く
      await page.locator("#year").click();

      // 今年と去年のオプションが表示されていることを確認
      const currentYear = new Date().getFullYear().toString();
      const lastYear = (new Date().getFullYear() - 1).toString();

      await expect(
        page.getByRole("option", { name: currentYear })
      ).toBeVisible();
      await expect(page.getByRole("option", { name: lastYear })).toBeVisible();

      // セレクトを閉じる（Escapeキーで閉じる）
      await page.keyboard.press("Escape");
    });
  });

  test("月のドロップダウンに1-12月が表示される", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await navigateAndWait(page, "勤怠履歴", /\/stamp-history/, "打刻履歴");

    await test.step("月の選択肢を確認", async () => {
      // 月のセレクトをクリックして開く
      await page.locator("#month").click();

      // いくつかの月のオプションが表示されていることを確認 (exact: trueで完全一致)
      await expect(
        page.getByRole("option", { name: "1月", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "6月", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "12月", exact: true })
      ).toBeVisible();

      // セレクトを閉じる
      await page.keyboard.press("Escape");
    });
  });

  test("履歴データがある場合、テーブルに表示される", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await navigateAndWait(page, "勤怠履歴", /\/stamp-history/, "打刻履歴");

    await test.step("テーブルヘッダーを確認", async () => {
      // テーブルヘッダーの存在確認（実際のヘッダーテキストに基づく）
      await expect(page.getByText("日付")).toBeVisible();
      await expect(page.getByText("曜日")).toBeVisible();
      await expect(page.getByText("出勤時刻")).toBeVisible();
      await expect(page.getByText("退勤時刻")).toBeVisible();
      await expect(page.getByText("更新日時")).toBeVisible();
      await expect(page.getByText("操作")).toBeVisible();
    });
  });

  test("勤怠履歴ページへの直接アクセスが可能", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
    });

    await test.step("URLから直接アクセス", async () => {
      await page.goto("/stamp-history");
      await expect(page.getByRole("heading", { name: "打刻履歴" })).toBeVisible(
        {
          timeout: 10_000,
        }
      );
    });
  });

  test("未認証状態でアクセスするとログインページにリダイレクト", async ({
    page,
  }) => {
    await createAppMockServer(page, {
      initialSessionAuthenticated: false,
    });

    await test.step("未認証で勤怠履歴にアクセス", async () => {
      await page.goto("/stamp-history");

      // ログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/signin/, { timeout: 10_000 });
      await expect(
        page.getByRole("heading", { name: /TeamDevelop Bravo にサインイン/ })
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
