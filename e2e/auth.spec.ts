import { test, expect, type Page } from '@playwright/test'

async function loginAsTestUser(page: Page) {
  const email = process.env['TEST_USER_EMAIL'] ?? ''
  const password = process.env['TEST_USER_PASSWORD'] ?? ''
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/(home|group|horselist)/)
}

test.describe('認証フロー', () => {
  test('TC-AUTH-001: サインアップ', async () => {
    test.skip(true, 'ダミーメールアドレスを使うとSupabaseのSMTPエラーになるためスキップ')
  })

  test('TC-AUTH-002: ログイン', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)
    await expect(page).toHaveURL(/\/home/)
  })

  test('TC-AUTH-003: パスワード忘れメール送信', async () => {
    test.skip(true, 'Supabaseのメール送信のRate limitにより繰り返しテストできないためスキップ')
  })

  test('TC-AUTH-004: パスワードリセット', async () => {
    test.skip(true, 'メールリンク経由のトークン交換はE2Eでの検証が不可能なためスキップ')
  })

  test('TC-AUTH-005: 未認証アクセスは /login にリダイレクト', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-005: 未認証で /group は /login にリダイレクト', async ({ page }) => {
    await page.goto('/group')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-005: 未認証で /download は /login にリダイレクト', async ({ page }) => {
    await page.goto('/download')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-005: 未認証で /horselist は /login にリダイレクト', async ({ page }) => {
    await page.goto('/horselist')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-006: 認証済みユーザーの認証画面アクセス', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/home/)
  })
})
