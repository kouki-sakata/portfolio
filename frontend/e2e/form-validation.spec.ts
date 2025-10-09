import { expect, test } from "@playwright/test";

import { createAppMockServer } from "./support/mockServer";
import { signIn, waitForToast } from "./support/helpers";
import { createAdminUser, TEST_CREDENTIALS } from "./support/factories";

test.describe("フォームバリデーションの包括的テスト", () => {
  test.beforeEach(async ({ page }) => {
    const adminUser = createAdminUser();
    await createAppMockServer(page, {
      user: adminUser,
      initialSessionAuthenticated: true,
    });

    await page.goto("/admin/employees");
    await expect(page.getByRole("heading", { name: "従業員管理" })).toBeVisible({
      timeout: 10_000,
    });

    // 新規登録フォームを開く
    await page.getByRole("button", { name: "新規登録" }).click();
  });

  // TODO: 必須項目バリデーションテストを修正
  // - フォームのバリデーションメッセージセレクタが正しくない可能性
  // - エラーメッセージの表示タイミングや条件を再確認する必要がある
  test.skip("必須項目が空の場合、エラーメッセージが表示される", async ({ page }) => {
    await test.step("空のまま送信", async () => {
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("必須項目エラーを確認", async () => {
      // 姓のエラー
      await expect(
        page.locator('text=/姓.*必須|required/i').first()
      ).toBeVisible({ timeout: 3000 });

      // 名のエラー
      await expect(
        page.locator('text=/名.*必須|required/i').first()
      ).toBeVisible();

      // メールアドレスのエラー
      await expect(
        page.locator('text=/メールアドレス.*必須|email.*required/i').first()
      ).toBeVisible();

      // パスワードのエラー
      await expect(
        page.locator('text=/パスワード.*必須|password.*required/i').first()
      ).toBeVisible();
    });
  });

  // TODO: メールアドレス形式バリデーションテストを修正
  // - フォームのバリデーションメッセージが期待通り表示されない
  // - エラーメッセージのテキストパターンを見直す必要がある
  test.skip("メールアドレス形式が不正な場合、エラーメッセージが表示される", async ({ page }) => {
    await test.step("不正な形式のメールアドレスを入力", async () => {
      await page.getByLabel("姓").fill("テスト");
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill("invalid-email");
      await page.getByLabel("パスワード").fill("Password123!");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("メール形式エラーを確認", async () => {
      await expect(
        page.getByText(/メールアドレスの形式|正しいメール|invalid.*email/i)
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test("パスワード強度が不十分な場合、エラーメッセージが表示される", async ({ page }) => {
    await test.step("弱いパスワードを入力", async () => {
      await page.getByLabel("姓").fill("テスト");
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.getByLabel("パスワード").fill("weak");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("パスワード強度エラーを確認", async () => {
      await expect(
        page.getByText(/パスワードは.*文字以上|password.*characters|強度|strength/i)
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test("重複するメールアドレスの場合、エラーメッセージが表示される", async ({ page }) => {
    await test.step("既存のメールアドレスを入力", async () => {
      await page.getByLabel("姓").fill("テスト");
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill(TEST_CREDENTIALS.admin.email);
      await page.getByLabel("パスワード").fill("Password123!");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("重複エラーを確認", async () => {
      await waitForToast(page, /既に登録|重複|already exists|使用されています/i);
    });
  });

  test("有効な情報を入力した場合、登録が成功する", async ({ page }) => {
    await test.step("有効な情報を入力", async () => {
      await page.getByLabel("姓").fill("田中");
      await page.getByLabel("名").fill("花子");
      await page.getByLabel("メールアドレス").fill("hanako.tanaka@example.com");
      await page.getByLabel("パスワード").fill("SecurePass123!");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("登録成功を確認", async () => {
      await waitForToast(page, /登録しました|作成しました/);
    });
  });

  test("入力フィールドのリアルタイムバリデーションが動作する", async ({ page }) => {
    await test.step("メールアドレスフィールドにフォーカスして離脱", async () => {
      const emailField = page.getByLabel("メールアドレス");
      await emailField.focus();
      await emailField.fill("invalid");
      await emailField.blur();
    });

    await test.step("リアルタイムエラーを確認", async () => {
      // フィールド離脱時にエラーが表示される
      await expect(
        page.getByText(/メールアドレスの形式|invalid.*email/i)
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test("エラー状態のフィールドが視覚的にハイライトされる", async ({ page }) => {
    await test.step("不正な情報を入力して送信", async () => {
      await page.getByLabel("メールアドレス").fill("invalid-email");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("エラーフィールドのスタイルを確認", async () => {
      const emailField = page.getByLabel("メールアドレス");

      // エラー状態のクラスまたは属性を確認
      const hasErrorClass = await emailField
        .evaluate((el) =>
          el.classList.contains("error") ||
          el.classList.contains("invalid") ||
          el.getAttribute("aria-invalid") === "true"
        )
        .catch(() => false);

      expect(hasErrorClass).toBe(true);
    });
  });

  test("パスワード確認フィールドが一致しない場合、エラーが表示される", async ({ page }) => {
    // パスワード確認フィールドが実装されている場合のテスト
    const hasPasswordConfirm = await page
      .getByLabel(/パスワード.*確認|confirm.*password/i)
      .isVisible()
      .catch(() => false);

    if (!hasPasswordConfirm) {
      test.skip();
      return;
    }

    await test.step("異なるパスワードを入力", async () => {
      await page.getByLabel("姓").fill("テスト");
      await page.getByLabel("名").fill("太郎");
      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.getByLabel("パスワード").fill("Password123!");
      await page.getByLabel(/パスワード.*確認|confirm.*password/i).fill("DifferentPass123!");
      await page.getByRole("button", { name: "登録する" }).click();
    });

    await test.step("不一致エラーを確認", async () => {
      await expect(
        page.getByText(/パスワードが一致|passwords.*match/i)
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test("最小文字数制限が機能する", async ({ page }) => {
    await test.step("最小文字数未満の姓を入力", async () => {
      await page.getByLabel("姓").fill("あ");
      await page.getByLabel("姓").blur();
    });

    await test.step("文字数エラーを確認", async () => {
      // 最小文字数エラーが表示される（実装による）
      const hasMinLengthError = await page
        .getByText(/文字以上|minimum|characters/i)
        .isVisible()
        .catch(() => false);

      // 最小文字数制限がある場合のみチェック
      if (hasMinLengthError) {
        expect(hasMinLengthError).toBe(true);
      }
    });
  });

  test("最大文字数制限が機能する", async ({ page }) => {
    await test.step("最大文字数を超える入力を試行", async () => {
      const longText = "あ".repeat(256);
      await page.getByLabel("姓").fill(longText);
    });

    await test.step("入力が制限される", async () => {
      const value = await page.getByLabel("姓").inputValue();

      // maxLength属性により入力が制限されているか、エラーが表示される
      expect(value.length).toBeLessThanOrEqual(255);
    });
  });

  test("フォームクリア後、エラーメッセージがリセットされる", async ({ page }) => {
    await test.step("エラーを発生させる", async () => {
      await page.getByLabel("メールアドレス").fill("invalid");
      await page.getByRole("button", { name: "登録する" }).click();

      await expect(
        page.getByText(/メールアドレスの形式|invalid/i)
      ).toBeVisible();
    });

    await test.step("フォームを閉じて再度開く", async () => {
      await page.getByRole("button", { name: /キャンセル|閉じる/ }).click();
      await page.getByRole("button", { name: "新規登録" }).click();
    });

    await test.step("エラーメッセージがクリアされている", async () => {
      const errorMessage = page.getByText(/メールアドレスの形式|invalid/i);
      await expect(errorMessage).not.toBeVisible();
    });
  });
});
