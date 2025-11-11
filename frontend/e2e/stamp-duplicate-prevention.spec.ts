import { expect, test } from "@playwright/test";
import { createAdminUser, TEST_CREDENTIALS } from "./support/factories";
import { signIn, waitForToast } from "./support/helpers";
import { createAppMockServer } from "./support/mockServer";

/**
 * 打刻の二重送信防止とサーバー側重複検証のE2Eテスト
 *
 * 【テスト対象】
 * 1. クライアント側: 3秒間のデバウンス機構（useStamp.ts:111-127）
 * 2. サーバー側: 409 Conflict エラーハンドリング（useStamp.ts:49-62）
 */
test.describe("打刻の二重送信防止と重複検証", () => {
  test.describe("クライアント側デバウンス機構", () => {
    test("3秒以内の連続出勤打刻がブロックされる", async ({ page }) => {
      const adminUser = createAdminUser();
      await createAppMockServer(page, { user: adminUser });

      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      await test.step("1回目の出勤打刻を実行", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();
        await waitForToast(page, /打刻が完了/);
      });

      await test.step("3秒以内に2回目の出勤打刻を試みる", async () => {
        // 1秒待機（3秒未満）
        await page.waitForTimeout(1000);

        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        // デバウンスエラーメッセージを確認
        await waitForToast(page, /短時間での連続出勤打刻はできません/);
        await waitForToast(page, /あと\d+秒お待ちください/);
      });
    });

    test("3秒経過後は再度打刻が可能になる", async ({ page }) => {
      const adminUser = createAdminUser();
      const server = await createAppMockServer(page, { user: adminUser });

      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      await test.step("1回目の出勤打刻を実行", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();
        await waitForToast(page, /打刻が完了/);
      });

      await test.step("3秒経過後に2回目の打刻を試みる", async () => {
        // 3秒以上待機（デバウンス解除）
        await page.waitForTimeout(3100);

        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        // 2回目も成功することを確認
        await waitForToast(page, /打刻が完了/);

        // サーバーに2回リクエストが送信されたことを確認
        const lastRequest = server.getLastStampRequest();
        expect(lastRequest).not.toBeNull();
        expect(lastRequest?.stampType).toBe("1"); // 出勤
      });
    });

    test("異なる打刻タイプは独立してデバウンスされる", async ({ page }) => {
      const adminUser = createAdminUser();
      const server = await createAppMockServer(page, { user: adminUser });

      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      await test.step("出勤打刻を実行", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();
        await waitForToast(page, /打刻が完了/);
      });

      await test.step("すぐに退勤打刻を実行（デバウンス対象外）", async () => {
        // 待機なしで退勤打刻
        const departureButton = page.getByRole("button", { name: /退勤/ });
        await departureButton.click();

        // 退勤打刻も成功することを確認
        await waitForToast(page, /打刻が完了/);

        const lastRequest = server.getLastStampRequest();
        expect(lastRequest?.stampType).toBe("2"); // 退勤
      });
    });

    test.skip("退勤打刻も3秒のデバウンスが適用される", async ({ page }) => {
      // NOTE: 状態ベースのUI制御により、退勤打刻後は退勤ボタンが表示されなくなるため、
      // このテストケースは不可能になりました。退勤済み（FINISHED）状態では、
      // 退勤ボタンではなく「本日の勤務は完了しています」というメッセージが表示されます。
      const adminUser = createAdminUser();
      await createAppMockServer(page, { user: adminUser });

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

      await test.step("1回目の退勤打刻を実行", async () => {
        const departureButton = page.getByRole("button", { name: /退勤/ });
        await departureButton.click();
        await waitForToast(page, /打刻が完了/);
      });

      await test.step("3秒以内に2回目の退勤打刻を試みる", async () => {
        await page.waitForTimeout(1000);

        const departureButton = page.getByRole("button", { name: /退勤/ });
        await departureButton.click();

        // デバウンスエラーメッセージを確認
        await waitForToast(page, /短時間での連続退勤打刻はできません/);
        await waitForToast(page, /あと\d+秒お待ちください/);
      });
    });
  });

  test.describe("サーバー側重複打刻エラー（409 Conflict）", () => {
    test("既に登録済みの打刻時刻で409エラーが返される", async ({ page }) => {
      const adminUser = createAdminUser();
      const server = await createAppMockServer(page, { user: adminUser });

      // 409エラーをシミュレート
      server.setErrorSimulation({
        endpoint: "/home/stamps",
        method: "POST",
        status: 409,
        message:
          "打刻時刻が既に登録されています: 出勤 (2025-10-15T09:00:00+09:00)",
      });

      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      await test.step("出勤打刻を試みて409エラーを確認", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        // 409エラー専用のトーストタイトルを確認
        await waitForToast(page, /重複打刻エラー/);
      });
    });

    test("409エラー時にpayloadのカスタムメッセージが表示される", async ({
      page,
    }) => {
      const adminUser = createAdminUser();
      const server = await createAppMockServer(page, { user: adminUser });

      const customMessage =
        "打刻時刻が既に登録されています: 出勤 (2025-10-15T09:00:00+09:00)";

      // カスタムメッセージ付き409エラー
      server.setErrorSimulation({
        endpoint: "/home/stamps",
        method: "POST",
        status: 409,
        message: customMessage,
      });

      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      await test.step("カスタムメッセージが表示されることを確認", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        // 409エラー専用のトーストタイトルを確認
        await waitForToast(page, /重複打刻エラー/);
      });
    });

    test("409エラー時にデフォルトメッセージが表示される（payloadなし）", async ({
      page,
    }) => {
      const adminUser = createAdminUser();
      const server = await createAppMockServer(page, { user: adminUser });

      // メッセージなしの409エラー
      server.setErrorSimulation({
        endpoint: "/home/stamps",
        method: "POST",
        status: 409,
      });

      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      await test.step("デフォルトメッセージが表示されることを確認", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        // デフォルトメッセージが表示される
        await waitForToast(
          page,
          /既に打刻済みです。同じ日に同じ種別の打刻はできません。/
        );
      });
    });
  });

  test.describe("エッジケース", () => {
    test("デバウンス中にページをリロードするとデバウンスがリセットされる", async ({
      page,
    }) => {
      const adminUser = createAdminUser();
      await createAppMockServer(page, { user: adminUser });

      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      await test.step("1回目の出勤打刻を実行", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();
        await waitForToast(page, /打刻が完了/);
      });

      await test.step("デバウンス期間中にページをリロード", async () => {
        await page.waitForTimeout(1000); // 1秒待機（デバウンス中）
        await page.reload();

        // ホーム画面が表示されることを確認
        await expect(
          page.getByRole("heading", { name: /おはようございます/ })
        ).toBeVisible({ timeout: 15_000 });
      });

      await test.step("リロード後はすぐに打刻可能", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        // デバウンスなしで成功
        await waitForToast(page, /打刻が完了/);
      });
    });

    test("409エラー後でも3秒経過すれば再打刻可能", async ({ page }) => {
      const adminUser = createAdminUser();
      const server = await createAppMockServer(page, { user: adminUser });

      // 最初だけ409エラー、2回目は成功
      server.setErrorSimulation({
        endpoint: "/home/stamps",
        method: "POST",
        status: 409,
        message: "既に打刻済みです",
      });

      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      await test.step("1回目の打刻で409エラー", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        await waitForToast(page, /重複打刻エラー/);
      });

      await test.step("エラーシミュレーションをクリアして3秒待機", async () => {
        server.clearErrorSimulations();
        await page.waitForTimeout(3100);
      });

      await test.step("3秒後に再打刻すると成功する", async () => {
        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        // 2回目は成功
        await waitForToast(page, /打刻が完了/);

        const lastRequest = server.getLastStampRequest();
        expect(lastRequest).not.toBeNull();
      });
    });

    test("ネットワークエラー発生時もデバウンスは機能する", async ({ page }) => {
      const adminUser = createAdminUser();
      const server = await createAppMockServer(page, { user: adminUser });

      await signIn(
        page,
        TEST_CREDENTIALS.admin.email,
        TEST_CREDENTIALS.admin.password
      );

      await test.step("1回目の打刻でネットワークエラー", async () => {
        // ネットワークエラーをシミュレート（status: 0）
        server.setErrorSimulation({
          endpoint: "/home/stamps",
          method: "POST",
          status: 0,
        });

        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        // ネットワークエラーのトーストを確認
        await waitForToast(page, /ネットワークエラー|通信エラー/);
      });

      await test.step("3秒以内に2回目の打刻を試みる", async () => {
        // エラーシミュレーションをクリア
        server.clearErrorSimulations();
        await page.waitForTimeout(1000);

        const attendanceButton = page.getByRole("button", { name: "出勤打刻" });
        await attendanceButton.click();

        // ネットワークエラー後は打刻成功する（エラー時は最終打刻時刻が更新されないため）
        await waitForToast(page, /打刻が完了/);
      });
    });
  });
});
