import { expect, test } from "@playwright/test";
import {
  createAdminUser,
  createNewsItemList,
  createTestUser,
  TEST_CREDENTIALS,
} from "./support/factories";
import { acceptDialog, signIn, waitForToast } from "./support/helpers";
import { createAppMockServer } from "./support/mockServer";

// お知らせ管理機能は未実装のため、一時的に全テストをスキップ
// TODO: お知らせ管理機能の実装完了後にtest.describeに戻す
test.describe.skip("お知らせ管理機能の包括的テスト", () => {
  test("お知らせ一覧が表示される", async ({ page }) => {
    const adminUser = createAdminUser();
    const newsItems = createNewsItemList(3, { publishedCount: 2 });

    await createAppMockServer(page, {
      user: adminUser,
      initialNewsItems: newsItems,
    });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("お知らせページに遷移", async () => {
      // お知らせリンクをクリック（実装に応じて調整）
      await page.goto("/news");
      await expect(
        page.getByRole("heading", { name: /お知らせ|ニュース/ })
      ).toBeVisible({ timeout: 10_000 });
    });

    await test.step("お知らせ一覧を確認", async () => {
      // 少なくとも1つのお知らせが表示されている
      const newsItem = page.getByText("テストニュース");
      await expect(newsItem.first()).toBeVisible();
    });
  });

  test("管理者が新しいお知らせを作成できる", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await page.goto("/news");

    await test.step("新規作成ボタンをクリック", async () => {
      await page.getByRole("button", { name: /新規作成|作成/ }).click();
    });

    await test.step("お知らせ情報を入力", async () => {
      await page.getByLabel("タイトル").fill("新しいお知らせ");
      await page.getByLabel("内容").fill("これは新しいお知らせです。");
      await page.getByLabel("カテゴリ").selectOption("general");

      await page.getByRole("button", { name: "作成する" }).click();
    });

    await test.step("作成成功を確認", async () => {
      await waitForToast(page, /作成しました|登録しました/);

      const newsItems = server.getNewsItems();
      const newItem = newsItems.find((item) => item.title === "新しいお知らせ");
      expect(newItem).toBeDefined();
      expect(newItem?.content).toBe("これは新しいお知らせです。");
    });
  });

  test("管理者がお知らせを編集できる", async ({ page }) => {
    const adminUser = createAdminUser();
    const newsItems = createNewsItemList(1);
    const server = await createAppMockServer(page, {
      user: adminUser,
      initialNewsItems: newsItems,
    });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await page.goto("/news");

    await test.step("編集ボタンをクリック", async () => {
      const editButton = page
        .locator("tr", { hasText: "テストニュース1" })
        .getByRole("button", { name: "編集" });
      await editButton.click();
    });

    await test.step("お知らせ情報を更新", async () => {
      await page.getByLabel("タイトル").fill("更新されたお知らせ");
      await page.getByLabel("内容").fill("内容が更新されました。");
      await page.getByRole("button", { name: "更新する" }).click();
    });

    await test.step("更新成功を確認", async () => {
      await waitForToast(page, /更新しました/);

      const updatedNewsItems = server.getNewsItems();
      const updatedItem = updatedNewsItems.find(
        (item) => item.title === "更新されたお知らせ"
      );
      expect(updatedItem).toBeDefined();
      expect(updatedItem?.content).toBe("内容が更新されました。");
    });
  });

  test("管理者がお知らせを削除できる", async ({ page }) => {
    const adminUser = createAdminUser();
    const newsItems = createNewsItemList(2);
    const server = await createAppMockServer(page, {
      user: adminUser,
      initialNewsItems: newsItems,
    });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await page.goto("/news");

    await test.step("削除ボタンをクリックして確認", async () => {
      const deleteButton = page
        .locator("tr", { hasText: "テストニュース1" })
        .getByRole("button", { name: "削除" });

      await acceptDialog(page, async () => {
        await deleteButton.click();
      });
    });

    await test.step("削除成功を確認", async () => {
      await waitForToast(page, /削除しました/);

      const remainingItems = server.getNewsItems();
      const deletedItem = remainingItems.find(
        (item) => item.title === "テストニュース1"
      );
      expect(deletedItem).toBeUndefined();
    });
  });

  test("管理者がお知らせの公開/非公開を切り替えられる", async ({ page }) => {
    const adminUser = createAdminUser();
    const newsItems = createNewsItemList(1, { publishedCount: 0 });
    const server = await createAppMockServer(page, {
      user: adminUser,
      initialNewsItems: newsItems,
    });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await page.goto("/news");

    await test.step("公開ステータスを切り替え", async () => {
      // 公開/非公開トグルボタンをクリック
      const statusToggle = page
        .locator("tr", { hasText: "テストニュース1" })
        .getByRole("button", { name: /公開|非公開/ });
      await statusToggle.click();
    });

    await test.step("ステータス変更を確認", async () => {
      await waitForToast(page, /更新しました|変更しました/);

      const currentNewsItems = server.getNewsItems();
      const updatedItem = currentNewsItems.find(
        (item) => item.title === "テストニュース1"
      );
      expect(updatedItem?.published).toBe(true);
    });
  });

  test("一般ユーザーはお知らせ管理画面にアクセスできない", async ({ page }) => {
    const regularUser = createTestUser();
    await createAppMockServer(page, {
      user: regularUser,
      initialSessionAuthenticated: true,
    });

    await test.step("お知らせ管理ページへのアクセスを試行", async () => {
      await page.goto("/news/admin");

      // リダイレクトまたは403エラー
      await expect(page).toHaveURL(/\/(news)?$|\/signin/, { timeout: 5000 });
    });
  });

  test("一般ユーザーは公開されたお知らせのみ閲覧できる", async ({ page }) => {
    const regularUser = createTestUser();
    const newsItems = createNewsItemList(3, { publishedCount: 2 });

    await createAppMockServer(page, {
      user: regularUser,
      initialNewsItems: newsItems,
    });

    await signIn(
      page,
      TEST_CREDENTIALS.user.email,
      TEST_CREDENTIALS.user.password
    );

    await test.step("お知らせ一覧を表示", async () => {
      await page.goto("/news");
      await expect(
        page.getByRole("heading", { name: /お知らせ|ニュース/ })
      ).toBeVisible();
    });

    await test.step("公開されたお知らせのみ表示される", async () => {
      // 公開されているお知らせが表示される
      await expect(page.getByText("テストニュース1")).toBeVisible();
      await expect(page.getByText("テストニュース2")).toBeVisible();

      // 非公開のお知らせは表示されない（テストニュース3）
      await expect(page.getByText("テストニュース3")).not.toBeVisible();
    });
  });

  test("お知らせが0件の場合、空状態メッセージが表示される", async ({
    page,
  }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      initialNewsItems: [],
    });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await page.goto("/news");

    await test.step("空状態メッセージを確認", async () => {
      await expect(
        page.getByText(/お知らせがありません|データがありません/)
      ).toBeVisible();
    });
  });

  test("お知らせ作成時のバリデーションエラーが表示される", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await page.goto("/news");

    await test.step("必須項目を空のまま送信", async () => {
      await page.getByRole("button", { name: /新規作成|作成/ }).click();

      // タイトルと内容を空のまま送信
      await page.getByRole("button", { name: "作成する" }).click();
    });

    await test.step("バリデーションエラーを確認", async () => {
      await expect(page.getByText(/必須|入力してください/).first()).toBeVisible(
        { timeout: 3000 }
      );
    });
  });
});
