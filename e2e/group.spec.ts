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

test.describe('オーナー管理（/group）', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)
    await page.goto('/group')
    await expect(page.getByRole('heading', { name: 'オーナー管理' })).toBeVisible()
  })

  test('TC-GROUP-001: オーナー追加', async ({ page }) => {
    const ownerName = `テストオーナー_${Date.now()}`

    await page.getByRole('button', { name: 'オーナーを追加' }).click()
    await expect(page.getByRole('dialog', { name: 'オーナーを追加' })).toBeVisible()
    await page.getByLabel('オーナー名').fill(ownerName)
    await page.getByLabel('番号（任意）').fill('1')
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByRole('cell', { name: ownerName })).toBeVisible()
  })

  test('TC-GROUP-002: オーナー編集', async ({ page }) => {
    // テスト用オーナーを自身で追加し、既存データに依存しない
    const originalName = `編集前オーナー_${Date.now()}`
    const editedName = `編集後オーナー_${Date.now()}`

    await page.getByRole('button', { name: 'オーナーを追加' }).click()
    await expect(page.getByRole('dialog', { name: 'オーナーを追加' })).toBeVisible()
    await page.getByLabel('オーナー名').fill(originalName)
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // 追加したオーナーを編集
    await page.getByRole('button', { name: `${originalName}を編集` }).click()
    await expect(page.getByRole('dialog', { name: 'オーナーを編集' })).toBeVisible()
    await page.getByLabel('オーナー名').fill(editedName)
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByRole('cell', { name: editedName })).toBeVisible()
  })

  test('TC-GROUP-003: オーナー削除（確認ダイアログ）', async ({ page }) => {
    // テスト用オーナーを自身で追加し、既存データを破壊しない
    const ownerName = `削除テスト_${Date.now()}`

    await page.getByRole('button', { name: 'オーナーを追加' }).click()
    await expect(page.getByRole('dialog', { name: 'オーナーを追加' })).toBeVisible()
    await page.getByLabel('オーナー名').fill(ownerName)
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // 削除ボタンをクリックして確認ダイアログが開くことを確認
    await page.getByRole('button', { name: `${ownerName}を削除` }).click()
    await expect(page.getByRole('dialog', { name: 'オーナーを削除' })).toBeVisible()

    // キャンセルでダイアログが閉じることを確認
    await page.getByRole('button', { name: 'キャンセル' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // 再度削除ボタンをクリックして削除実行
    await page.getByRole('button', { name: `${ownerName}を削除` }).click()
    await expect(page.getByRole('dialog', { name: 'オーナーを削除' })).toBeVisible()
    await page.getByRole('button', { name: '削除' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // 一覧からオーナーが消えることを確認
    await expect(page.getByRole('cell', { name: ownerName })).not.toBeVisible()
  })

  test('TC-GROUP-004: オーナー削除時の馬連動削除（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-GROUP-005: 番号順ソート（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'データ投入を伴うSupabaseへの実際の接続が必要なためスキップ')
  })
})
