/**
 * Lighthouse CI - 認証用Puppeteerスクリプト
 *
 * このスクリプトは、Lighthouse CIが各URLをテストする前に実行され、
 * 管理者アカウントでログインすることで、認証が必要なページへのアクセスを可能にします。
 *
 * @param {import('puppeteer').Browser} browser - Puppeteerブラウザインスタンス
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context - Lighthouse CI実行コンテキスト
 */
module.exports = async (browser, _context) => {
  // 環境変数から認証情報を取得（デフォルト値を設定）
  const AdminEmail = process.env.E2E_ADMIN_EMAIL || "admin.user@example.com";
  const AdminPassword = process.env.E2E_ADMIN_PASSWORD || "AdminPass123!";

  // 新しいページを開く
  const page = await browser.newPage();

  try {
    // サインインページに移動
    await page.goto("http://localhost:5173/signin", {
      waitUntil: "networkidle2",
      timeout: 10_000,
    });

    // フォーム要素が表示されるまで待機
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });

    // 認証情報を入力
    await page.type('input[name="email"]', AdminEmail);
    await page.type('input[name="password"]', AdminPassword);

    // サインインボタンをクリック
    await page.click('button[type="submit"]');

    // ナビゲーション完了を待機（ホームページへのリダイレクト）
    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 15_000,
    });
  } finally {
    // ページを閉じる（ブラウザは開いたままにする）
    await page.close();
  }
};
