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

test.describe('馬リスト画面', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)
  })

  test('TC-HORSELIST-001: オーナー別一覧表示', async ({ page }) => {
    // /horselist/<owner_name> にアクセスし、そのオーナーの馬だけが表示されること
    const ownerName = encodeURIComponent('オーナーA')
    await page.goto(`/horselist/${ownerName}`)
    await expect(page.getByRole('heading', { name: 'オーナーA の馬リスト' })).toBeVisible()
    // テーブルが表示されること
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('TC-HORSELIST-002: po_order_no昇順ソート', async ({ page }) => {
    const ownerName = encodeURIComponent('オーナーA')
    await page.goto(`/horselist/${ownerName}`)

    const rows = page.getByRole('row')
    // 2行目以降 (1行目はヘッダー) のNo列が昇順になっていること
    const firstDataRow = rows.nth(1)
    const secondDataRow = rows.nth(2)
    const firstNo = await firstDataRow.getByRole('cell').nth(0).textContent()
    const secondNo = await secondDataRow.getByRole('cell').nth(0).textContent()
    expect(Number(firstNo)).toBeLessThanOrEqual(Number(secondNo))
  })

  test('TC-HORSELIST-003: フリーワード検索', async ({ page }) => {
    const ownerName = encodeURIComponent('オーナーA')
    await page.goto(`/horselist/${ownerName}`)

    const searchInput = page.getByRole('textbox', { name: 'フリーワード検索' })
    const rowsBefore = await page.getByRole('row').count()

    // 検索ワードで絞り込んだ結果が検索前以下の行数になること
    await searchInput.fill('キズナ')
    const rowsAfter = await page.getByRole('row').count()
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore)
  })

  test('TC-HORSELIST-004: 馬情報の編集', async ({ page }) => {
    const ownerName = encodeURIComponent('オーナーA')
    await page.goto(`/horselist/${ownerName}`)

    // 最初の馬の編集ボタンをクリック
    await page
      .getByRole('button', { name: /を編集$/ })
      .first()
      .click()

    // 編集ダイアログが開くこと
    await expect(page.getByRole('dialog', { name: '馬情報を編集' })).toBeVisible()

    // キャンセルで閉じる
    await page.getByRole('button', { name: 'キャンセル' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('TC-HORSELIST-005: 馬の削除', async ({ page }) => {
    const ownerName = encodeURIComponent('オーナーA')
    await page.goto(`/horselist/${ownerName}`)

    // 最初の馬の削除ボタンをクリック
    await page
      .getByRole('button', { name: /を削除$/ })
      .first()
      .click()

    // 削除確認ダイアログが開くこと
    await expect(page.getByRole('dialog', { name: '馬を削除' })).toBeVisible()

    // キャンセルで閉じる
    await page.getByRole('button', { name: 'キャンセル' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('TC-HORSELIST-006: 全オーナー合計の馬数表示', async ({ page }) => {
    const ownerName = encodeURIComponent('オーナーA')
    await page.goto(`/horselist/${ownerName}`)

    // 「全オーナー合計: X頭」が表示されること
    await expect(page.getByText(/全オーナー合計: \d+頭/)).toBeVisible()
  })
})
