import { test, expect, type Page } from '@playwright/test'
import { cleanupTestUserData } from './fixtures/cleanup'

async function loginAsTestUser(page: Page) {
  const email = process.env['TEST_USER_EMAIL'] ?? ''
  const password = process.env['TEST_USER_PASSWORD'] ?? ''
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/(home|group|horselist)/)
}

test.describe('CSVエクスポート（/download）', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async () => {
    if (
      process.env['TEST_USER_EMAIL'] &&
      process.env['TEST_USER_PASSWORD'] &&
      process.env['SUPABASE_SERVICE_ROLE_KEY']
    ) {
      await cleanupTestUserData()
    }
  })

  test('TC-DOWNLOAD-001: 未認証アクセスは /login にリダイレクト', async ({ page }) => {
    await page.goto('/download')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-DOWNLOAD-001: 馬0件のときダウンロードボタンが disabled', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    // 注意: このテストは馬が0件のアカウントでのみ正確に動作します。
    // 馬が登録済みの場合はボタンが有効になりテストが失敗します。
    await loginAsTestUser(page)
    await page.goto('/download')
    await expect(page.getByRole('heading', { name: 'データエクスポート' })).toBeVisible()

    // 読み込み完了を待つ
    await expect(page.getByText('読み込み中…')).not.toBeVisible({ timeout: 10000 })

    // ダウンロードボタンが存在することを確認
    const downloadButton = page.getByRole('button', { name: 'CSVダウンロード' })
    await expect(downloadButton).toBeVisible()

    // 馬が0件の場合はボタンが disabled
    await expect(downloadButton).toBeDisabled()
  })

  test('TC-DOWNLOAD-002: CSVダウンロード', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)

    // オーナーを追加
    const ownerName = `ダウンロードテスト_${Date.now()}`
    await page.goto('/group')
    await expect(page.getByRole('heading', { name: 'オーナー管理' })).toBeVisible()
    await page.getByRole('button', { name: 'オーナーを追加' }).click()
    await expect(page.getByRole('dialog', { name: 'オーナーを追加' })).toBeVisible()
    await page.getByLabel('オーナー名').fill(ownerName)
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // 馬を1頭登録
    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()
    const horseName = `ダウンロード馬_${Date.now()}`
    const mareName = `ダウンロードメア_${Date.now()}`
    const searchInput = page.getByPlaceholder('母馬名で検索…')
    await searchInput.fill(mareName)
    await page.getByRole('button', { name: '手動で登録' }).click()
    await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
    await page.getByLabel('馬名').fill(horseName)
    await page.getByLabel('父馬').fill('テスト父')
    await page.getByLabel('母馬').fill(mareName)
    await page.getByRole('radio', { name: ownerName }).click()
    await page.getByRole('button', { name: '登録' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // /download でダウンロードボタンをクリック → download イベントが発生することを確認
    await page.goto('/download')
    await expect(page.getByRole('heading', { name: 'データエクスポート' })).toBeVisible()

    // 読み込み完了を待つ
    await expect(page.getByText('読み込み中…')).not.toBeVisible({ timeout: 10000 })

    const downloadButton = page.getByRole('button', { name: 'CSVダウンロード' })
    await expect(downloadButton).toBeEnabled()

    // ダウンロードイベントを待機しながらボタンをクリック
    const [download] = await Promise.all([page.waitForEvent('download'), downloadButton.click()])

    // ダウンロードが発生し、ファイル名が CSV であることを確認
    expect(download.suggestedFilename()).toMatch(/\.csv$/)
  })
})
