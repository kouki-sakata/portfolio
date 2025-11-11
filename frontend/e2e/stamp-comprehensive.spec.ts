import { expect, test } from "@playwright/test";
import {
  createAdminUser,
  NIGHT_WORK_FLAGS,
  STAMP_TYPES,
  TEST_CREDENTIALS,
} from "./support/factories";
import { signIn, waitForToast } from "./support/helpers";
import { createAppMockServer } from "./support/mockServer";

test.describe("打刻機能の包括的テスト", () => {
  test("退勤打刻が正常に動作する", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("出勤打刻を実行（退勤打刻の前提条件）", async () => {
      const attendanceButton = page.getByRole("button", { name: /出勤/ });
      await attendanceButton.click();
      await waitForToast(page, /打刻が完了/);
    });

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

  test.skip("休憩開始打刻が正常に動作する", async ({ page }) => {
    // NOTE: 休憩開始ボタンはまだUIに実装されていないため、このテストはスキップ
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("休憩開始打刻を実行", async () => {
      const breakStartButton = page.getByRole("button", { name: /休憩開始/ });
      await breakStartButton.click();
    });

    await test.step("打刻成功を確認", async () => {
      await waitForToast(page, /打刻が完了/);

      const stampRequest = server.getLastStampRequest();
      expect(stampRequest).not.toBeNull();
      expect(stampRequest?.stampType).toBe(STAMP_TYPES.BREAK_START);
    });
  });

  test.skip("休憩終了打刻が正常に動作する", async ({ page }) => {
    // NOTE: 休憩終了ボタンはまだUIに実装されていないため、このテストはスキップ
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("休憩終了打刻を実行", async () => {
      const breakEndButton = page.getByRole("button", { name: /休憩終了/ });
      await breakEndButton.click();
    });

    await test.step("打刻成功を確認", async () => {
      await waitForToast(page, /打刻が完了/);

      const stampRequest = server.getLastStampRequest();
      expect(stampRequest).not.toBeNull();
      expect(stampRequest?.stampType).toBe(STAMP_TYPES.BREAK_END);
    });
  });

  test("深夜勤務フラグONで出勤打刻ができる", async ({ page }) => {
    const adminUser = createAdminUser();
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("深夜勤務フラグをONにして出勤打刻", async () => {
      // 深夜勤務チェックボックスをON（実際のUIに応じて調整）
      const nightWorkCheckbox = page.getByLabel(/夜勤扱い/);
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

  test("連続して同じ打刻タイプを実行した場合のエラーハンドリング", async ({
    page,
  }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      stampResponse: { message: "既に打刻済みです", success: false },
    });

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

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

    await signIn(
      page,
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );

    await test.step("打刻を実行してエラーを確認", async () => {
      await page.getByRole("button", { name: "出勤打刻" }).click();
      await waitForToast(page, /サーバーエラー|エラーが発生/);
    });
  });
});
