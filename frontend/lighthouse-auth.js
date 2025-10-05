/**
 * Lighthouse CI - 認証用Puppeteerスクリプト
 *
 * このスクリプトは、Lighthouse CIが各URLをテストする前に実行され、
 * 管理者アカウントでログインすることで、認証が必要なページへのアクセスを可能にします。
 *
 * @param {import('puppeteer').Browser} browser - Puppeteerブラウザインスタンス
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context - Lighthouse CI実行コンテキスト
 */
module.exports = async (browser, context) => {
  // 環境変数から認証情報を取得（デフォルト値を設定）
  const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin.user@example.com';
  const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'AdminPass123!';

  console.log('[Lighthouse Auth] Starting authentication flow...');

  // 新しいページを開く
  const page = await browser.newPage();

  try {
    // サインインページに移動
    await page.goto('http://localhost:4173/signin', {
      waitUntil: 'networkidle2',
      timeout: 10000,
    });

    console.log('[Lighthouse Auth] Navigated to sign-in page');

    // フォーム要素が表示されるまで待機
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });

    // 認証情報を入力
    await page.type('input[name="email"]', ADMIN_EMAIL);
    await page.type('input[name="password"]', ADMIN_PASSWORD);

    console.log('[Lighthouse Auth] Credentials entered');

    // サインインボタンをクリック
    await page.click('button[type="submit"]');

    // ナビゲーション完了を待機（ホームページへのリダイレクト）
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: 15000,
    });

    console.log('[Lighthouse Auth] Authentication successful');

    // セッションが確立されたことを確認（オプション）
    const cookies = await page.cookies();
    const hasSessionCookie = cookies.some(cookie =>
      cookie.name.includes('SESSION') || cookie.name.includes('JSESSIONID')
    );

    if (hasSessionCookie) {
      console.log('[Lighthouse Auth] Session cookie detected');
    } else {
      console.warn('[Lighthouse Auth] Warning: No session cookie found');
    }
  } catch (error) {
    console.error('[Lighthouse Auth] Authentication failed:', error.message);
    throw error;
  } finally {
    // ページを閉じる（ブラウザは開いたままにする）
    await page.close();
    console.log('[Lighthouse Auth] Authentication flow completed');
  }
};
