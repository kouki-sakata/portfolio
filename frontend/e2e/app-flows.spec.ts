import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type { EmployeeSummary } from "@/features/auth/types";
import { waitForToast } from "./support/helpers";
import { createAppMockServer } from "./support/mockServer";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin.user@example.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "AdminPass123!";

const NEW_EMPLOYEE = {
  firstName: "花子",
  lastName: "佐藤",
  email: "hanako.sato@example.com",
  password: "SecurePass123!",
};

const UPDATED_EMPLOYEE = {
  firstName: "太郎",
  lastName: "高橋",
};

const signIn = async (page: Page, email: string, password: string) => {
  await test.step("サインインページに移動", async () => {
    await page.goto("/signin");
    await expect(
      page.getByRole("heading", { name: /^.*サインイン.*$/ })
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

test.describe("勤怠管理の主要E2Eフロー", () => {
  test.beforeEach(({ page }) => {
    page.on("console", (message) => {
      const args = message.args();
      if (args.length === 0) {
        console.log(`[console:${message.type()}]`, message.text());
        return;
      }
      void (async () => {
        const values = await Promise.all(
          args.map(async (arg) => {
            try {
              return await arg.jsonValue();
            } catch {
              return;
            }
          })
        );
        console.log(`[console:${message.type()}]`, message.text(), values);
      })().catch(() => {
        console.log(`[console:${message.type()}]`, message.text());
      });
    });
  });

  // TODO: 出勤打刻機能のテストを修正
  // - 打刻ボタンが正しくレンダリングされない可能性
  // - mockServerの打刻APIレスポンスの設定確認が必要
  test("ホーム画面で出勤打刻が成功する", async ({ page }) => {
    const adminUser: EmployeeSummary = {
      id: 1,
      firstName: "太郎",
      lastName: "山田",
      email: ADMIN_EMAIL,
      admin: true,
    };
    const server = await createAppMockServer(page, { user: adminUser });

    await signIn(page, server.user.email, ADMIN_PASSWORD);

    await test.step("出勤打刻を実行", async () => {
      await page.getByRole("button", { name: "出勤打刻" }).click();
    });

    await test.step("成功メッセージとリクエスト内容を確認", async () => {
      await waitForToast(page, /打刻が完了/);

      const stampRequest = server.getLastStampRequest();
      expect(stampRequest).not.toBeNull();
      expect(stampRequest?.stampType).toBe("1");
      expect(stampRequest?.nightWorkFlag).toBe("0");
    });
  });

  test("管理者が従業員を登録・更新・削除できる", async ({ page }) => {
    const adminUser: EmployeeSummary = {
      id: 1,
      firstName: "太郎",
      lastName: "山田",
      email: ADMIN_EMAIL,
      admin: true,
    };

    const initialEmployees: EmployeeSummary[] = [
      {
        id: 10,
        firstName: "太郎",
        lastName: "中村",
        email: "taro.nakamura@example.com",
        admin: false,
      },
    ];

    const server = await createAppMockServer(page, {
      user: adminUser,
      initialEmployees,
      initialSessionAuthenticated: true,
    });

    await test.step("従業員管理ページに移動", async () => {
      await page.goto("/e2e/harness/employee-admin.html");
      await expect(
        page.getByRole("heading", { name: /^.*従業員管理.*$/ })
      ).toBeVisible({ timeout: 20_000 });
    });

    await test.step("新しい従業員を登録", async () => {
      await page.getByRole("button", { name: "新規登録" }).click();
      await page.getByLabel("姓").fill(NEW_EMPLOYEE.lastName);
      await page.getByLabel("名").fill(NEW_EMPLOYEE.firstName);
      await page.getByLabel("メールアドレス").fill(NEW_EMPLOYEE.email);
      await page.getByLabel("パスワード").fill(NEW_EMPLOYEE.password);
      await page.getByRole("button", { name: "登録する" }).click();

      await expect(
        page.getByText("従業員を登録しました", { exact: true }).first()
      ).toBeVisible();

      const hasNewEmployee = server
        .getEmployees()
        .some((employee) => employee.email === NEW_EMPLOYEE.email);
      expect(hasNewEmployee).toBe(true);
    });

    await test.step("既存従業員を編集", async () => {
      const originalRow = page.locator("tr", { hasText: "中村 太郎" }).first();
      await originalRow.getByRole("button", { name: "編集" }).click();

      await page.getByLabel("名").fill(UPDATED_EMPLOYEE.firstName);
      await page.getByLabel("姓").fill(UPDATED_EMPLOYEE.lastName);
      await page.getByRole("button", { name: "更新する" }).click();

      await expect(
        page.getByText("従業員情報を更新しました", { exact: true }).first()
      ).toBeVisible();

      const updated = server
        .getEmployees()
        .find((employee) => employee.id === initialEmployees[0]?.id);
      expect(updated?.firstName).toBe(UPDATED_EMPLOYEE.firstName);
      expect(updated?.lastName).toBe(UPDATED_EMPLOYEE.lastName);
    });

    await test.step("従業員を一括削除", async () => {
      // デスクトップビューを確保するため、ビューポートサイズを明示的に設定
      await page.setViewportSize({ width: 1280, height: 800 });

      // レイアウトの安定を待つ（ネットワークアイドル状態まで待機）
      await page.waitForLoadState("networkidle");

      // デスクトップビューのテーブルセクション内のチェックボックスを直接取得
      const desktopTableSection = page.locator(
        'section[aria-label="データテーブル"]'
      );
      await desktopTableSection.waitFor({ state: "visible", timeout: 5000 });

      // テーブルセクション内の最後の「行を選択」チェックボックスを取得
      const lastCheckbox = desktopTableSection.getByLabel("行を選択").last();

      // スクロールして表示されるようにする
      await lastCheckbox.scrollIntoViewIfNeeded();
      await lastCheckbox.check({ force: false });

      const deleteButton = page.getByRole("button", {
        name: /選択した\d+名を削除/,
      });
      await Promise.all([
        page.waitForEvent("dialog").then((dialog) => dialog.accept()),
        deleteButton.click(),
      ]);

      await expect(
        page.getByText(/従業員を削除しました/, { exact: false }).first()
      ).toBeVisible();

      await expect(
        page.locator("tr", { hasText: NEW_EMPLOYEE.email })
      ).toHaveCount(0);
    });
  });
});
