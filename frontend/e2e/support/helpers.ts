import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * サインインヘルパー関数
 * ログインフローを実行し、ホーム画面に遷移することを確認
 */
export const signIn = async (page: Page, email: string, password: string) => {
  await page.goto("/signin");
  await expect(
    page.getByRole("heading", { name: "TeamDevelop Bravo にサインイン" })
  ).toBeVisible();

  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "サインイン" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /おはようございます/ })
  ).toBeVisible({ timeout: 15_000 });
};

/**
 * トースト通知の表示を待機する
 */
export const waitForToast = async (
  page: Page,
  message: string | RegExp,
  options?: { timeout?: number }
) => {
  // 複数マッチする場合は最初の要素を取得
  await expect(page.getByText(message, { exact: false }).first()).toBeVisible(options);
};

/**
 * アクセス拒否（403 or リダイレクト）を検証する
 */
export const expectAccessDenied = async (
  page: Page,
  targetUrl: string,
  options?: { expectRedirect?: boolean; redirectUrl?: string | RegExp }
) => {
  await page.goto(targetUrl);

  if (options?.expectRedirect) {
    const redirectUrl = options.redirectUrl ?? /\/signin/;
    await expect(page).toHaveURL(redirectUrl, { timeout: 5000 });
  } else {
    // 403エラーまたはエラーメッセージの表示を確認
    const has403 = page.getByText(/403|Forbidden|アクセスが拒否/i);
    await expect(has403).toBeVisible({ timeout: 5000 });
  }
};

/**
 * エラーメッセージが表示されることを確認する
 */
export const expectErrorMessage = async (
  page: Page,
  message: string | RegExp
) => {
  await expect(page.getByText(message, { exact: false })).toBeVisible({
    timeout: 5000,
  });
};

/**
 * ページナビゲーションを実行して完了を待つ
 */
export const navigateAndWait = async (
  page: Page,
  linkName: string,
  expectedUrl: string | RegExp,
  expectedHeading?: string | RegExp
) => {
  await page.getByRole("link", { name: linkName }).click();
  await expect(page).toHaveURL(expectedUrl);

  if (expectedHeading) {
    await expect(
      page.getByRole("heading", { name: expectedHeading })
    ).toBeVisible({ timeout: 10_000 });
  }
};

/**
 * フォームフィールドを一括入力する
 */
export const fillFormFields = async (
  page: Page,
  fields: Record<string, string>
) => {
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label).fill(value);
  }
};

/**
 * テーブル行を検索してアクション実行
 */
export const findTableRowAndClick = async (
  page: Page,
  searchText: string,
  buttonName: string
) => {
  const row = page.locator("tr", { hasText: searchText }).first();
  await row.getByRole("button", { name: buttonName }).click();
};

/**
 * ダイアログを待機して受諾する
 */
export const acceptDialog = async (page: Page, action: () => Promise<void>) => {
  await Promise.all([
    page.waitForEvent("dialog").then((dialog) => dialog.accept()),
    action(),
  ]);
};

/**
 * コンソールエラーを収集するリスナーを設定
 */
export const setupConsoleErrorListener = (page: Page): string[] => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  return errors;
};
