import { expect, Page, test } from '@playwright/test'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin.user@example.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!'

const INVALID_PASSWORD = process.env.E2E_INVALID_PASSWORD ?? 'WrongPassword!'

const SIGNIN_HEADING = 'TeamDevelop Bravo にサインイン'
const ERROR_MESSAGE = 'メールアドレスまたはパスワードが正しくありません。'

const fillCredentials = async (page: Page, email: string, password: string) => {
  await test.step('入力フォームにメールアドレスとパスワードを入力', async () => {
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByLabel('パスワード').fill(password)
  })
}

test.describe('サインイン UI フロー', () => {
  test.beforeEach(async ({ page }) => {
    const sessionResponse = page.waitForResponse(
      (response) => response.url().includes('/api/auth/session') && response.status() === 200
    )

    await page.goto('/signin')
    await expect(page.getByRole('heading', { name: SIGNIN_HEADING })).toBeVisible()
    await sessionResponse
  })

  test('有効な資格情報でサインインできる', async ({ page }) => {
    await fillCredentials(page, ADMIN_EMAIL, ADMIN_PASSWORD)

    await page.getByRole('button', { name: 'サインイン' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: /おはようございます/ })).toBeVisible({ timeout: 15_000 })
  })

  test('誤ったパスワードでエラーメッセージを表示する', async ({ page }) => {
    await fillCredentials(page, ADMIN_EMAIL, INVALID_PASSWORD)

    await page.getByRole('button', { name: 'サインイン' }).click()

    await expect(page.getByText(ERROR_MESSAGE)).toBeVisible()
    await expect(page).toHaveURL(/\/signin$/)
  })
})
