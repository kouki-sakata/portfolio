import { expect, test } from "@playwright/test";

import {
  createAdminUser,
  createNewsItemList,
  TEST_CREDENTIALS,
} from "./support/factories";
import { signIn, waitForToast } from "./support/helpers";
import { createAppMockServer } from "./support/mockServer";

test.describe("ニュース管理: バルク操作契約", () => {
  test("複数選択後に一括公開/非公開が実行できる", async ({ page }) => {
    const adminUser = createAdminUser();
    const newsItems = createNewsItemList(2, { publishedCount: 1 });
    const server = await createAppMockServer(page, {
      user: adminUser,
      initialNewsItems: newsItems,
    });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await page.goto("/news-management");

    await expect(page).toHaveURL(/news-management/);
    await page.getByRole("heading", { name: "全お知らせ一覧" }).waitFor();

    const selectAllCheckbox = page.getByRole("checkbox", { name: "全て選択" });
    await expect(selectAllCheckbox).toBeVisible();
    await selectAllCheckbox.click();

    await test.step("一括公開で全件を公開済みにする", async () => {
      await page.getByRole("button", { name: "一括公開" }).click();

      await waitForToast(page, /一括公開/);

      const latest = server.getNewsItems();
      expect(latest.every((item) => item.releaseFlag)).toBe(true);
    });

    await page.getByLabel("全て選択").click();

    await test.step("一括非公開で全件を非公開に戻す", async () => {
      await selectAllCheckbox.click(); // 既存選択を解除
      await selectAllCheckbox.click(); // 再度全選択

      await page.getByRole("button", { name: "一括非公開" }).click();

      await waitForToast(page, /一括非公開/);

      const latest = server.getNewsItems();
      expect(latest.some((item) => item.releaseFlag)).toBe(false);
    });
  });
});
