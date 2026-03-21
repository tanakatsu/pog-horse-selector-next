import { test, expect, type Page } from '@playwright/test'

async function loginAsTestUser(page: Page) {
  const email = process.env['TEST_USER_EMAIL'] ?? ''
  const password = process.env['TEST_USER_PASSWORD'] ?? ''
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/(home|group|horselist)/)
}

test.describe('馬選択（/home）', () => {
  test('TC-HOME-001: オーナー未登録時の検索無効化', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    // 注意: このテストはオーナーが0件のテストアカウントでのみ正確に動作します。
    // オーナーが登録済みの場合、検索欄が有効になりテストが失敗します。
    // 専用のクリーンなアカウントを TEST_USER_EMAIL に設定して実行してください。
    await loginAsTestUser(page)
    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()

    // オーナーが0人の状態では検索入力欄が disabled であることを確認
    const searchInput = page.getByPlaceholder('母馬名で検索...')
    await expect(searchInput).toBeDisabled()
  })

  test('TC-HOME-002: 馬カタログ検索・サジェスト表示（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'オーナー登録済み状態が必要なためスキップ')
  })

  test('TC-HOME-003: カタログから馬を登録（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-HOME-004: 手動入力で馬を登録（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-HOME-005: 母馬重複チェック（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-HOME-006: 馬名重複チェック（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-HOME-007: 指名順番の自動採番（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-HOME-008: 選択済み馬の ✔ マーク表示（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })
})
