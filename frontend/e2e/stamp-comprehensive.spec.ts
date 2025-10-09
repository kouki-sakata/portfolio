import { expect, test } from "@playwright/test";

import { createAppMockServer } from "./support/mockServer";
import { signIn, waitForToast } from "./support/helpers";
import {
  createAdminUser,
  TEST_CREDENTIALS,
  STAMP_TYPES,
  NIGHT_WORK_FLAGS,
} from "./support/factories";

test.describe("打刻機能の包括的テスト", () => {
  test("退勤打刻が正常に動作する", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);

    await test.step("退勤打刻を実行", async () => {
      // 退勤ボタンが存在することを確認（実際のUIに応じて調整が必要）
      const departureButton = page.getByRole("button", { name: /退勤/ });
      await departureButton.click();
    });

    await test.step("打刻成功を確認", async () => {
      await waitForToast(page, /打刻が完了/);

      const stampRequest = server.getLastStampRequest();
      expect(stampRequest).not.toBeNull();
      expect(stampRequest?.stampType).toBe(STAMP_TYPES.DEPARTURE);
      expect(stampRequest?.nightWorkFlag).toBe(NIGHT_WORK_FLAGS.OFF);
    });
  });

  test("外出打刻が正常に動作する", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);

    await test.step("外出打刻を実行", async () => {
      const leaveButton = page.getByRole("button", { name: /外出/ });
      await leaveButton.click();
    });

    await test.step("打刻成功を確認", async () => {
      await waitForToast(page, /打刻が完了/);

      const stampRequest = server.getLastStampRequest();
      expect(stampRequest).not.toBeNull();
      expect(stampRequest?.stampType).toBe(STAMP_TYPES.LEAVE);
    });
  });

  test("復帰打刻が正常に動作する", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);

    await test.step("復帰打刻を実行", async () => {
      const returnButton = page.getByRole("button", { name: /復帰/ });
      await returnButton.click();
    });

    await test.step("打刻成功を確認", async () => {
      await waitForToast(page, /打刻が完了/);

      const stampRequest = server.getLastStampRequest();
      expect(stampRequest).not.toBeNull();
      expect(stampRequest?.stampType).toBe(STAMP_TYPES.RETURN);
    });
  });

  test("深夜勤務フラグONで出勤打刻ができる", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);

    await test.step("深夜勤務フラグをONにして出勤打刻", async () => {
      // 深夜勤務チェックボックスをON（実際のUIに応じて調整）
      const nightWorkCheckbox = page.getByLabel(/深夜勤務/);
      await nightWorkCheckbox.check();

      const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
      await attendanceButton.click();
    });

    await test.step("深夜勤務フラグが正しく送信されることを確認", async () => {
      await waitForToast(page, /打刻が完了/);

      const stampRequest = server.getLastStampRequest();
      expect(stampRequest).not.toBeNull();
      expect(stampRequest?.stampType).toBe(STAMP_TYPES.ATTENDANCE);
      expect(stampRequest?.nightWorkFlag).toBe(NIGHT_WORK_FLAGS.ON);
    });
  });

  test("連続して同じ打刻タイプを実行した場合のエラーハンドリング", async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      stampResponse: { message: "既に打刻済みです", success: false },
    });

    await signIn(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);

    await test.step("出勤打刻を実行", async () => {
      await page.getByRole("button", { name: "出勤打刻" }).click();
      await waitForToast(page, /既に打刻済み/);
    });

    await test.step("再度出勤打刻を試みるとエラーが表示される", async () => {
      await page.getByRole("button", { name: "出勤打刻" }).click();
      await waitForToast(page, /既に打刻済み/);
    });
  });

  test("打刻時にサーバーエラーが発生した場合のエラー表示", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    // サーバーエラーをシミュレート
    server.setErrorSimulation({
      endpoint: "/home/stamps",
      method: "POST",
      status: 500,
      message: "サーバーエラーが発生しました",
    });

    await signIn(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);

    await test.step("打刻を実行してエラーを確認", async () => {
      await page.getByRole("button", { name: "出勤打刻" }).click();
      await waitForToast(page, /サーバーエラー|エラーが発生/);
    });
  });
});
