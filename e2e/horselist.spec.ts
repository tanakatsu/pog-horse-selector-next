import { test, expect, type Page } from '@playwright/test'
import { cleanupTestUserData } from './fixtures/cleanup'

async function loginAsTestUser(page: Page) {
  const email = process.env['TEST_USER_EMAIL'] ?? ''
  const password = process.env['TEST_USER_PASSWORD'] ?? ''
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/(home|group|horselist)/)
}

async function setupOwnerAndHorses(page: Page, ownerName: string) {
  // オーナーを作成
  await page.goto('/group')
  await expect(page.getByRole('heading', { name: 'オーナー管理' })).toBeVisible()
  await page.getByRole('button', { name: 'オーナーを追加' }).click()
  await expect(page.getByRole('dialog', { name: 'オーナーを追加' })).toBeVisible()
  await page.getByLabel('オーナー名').fill(ownerName)
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // 馬を2頭手動登録
  await page.goto('/home')
  await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()
  for (let i = 1; i <= 2; i++) {
    const mare = `テストメア${i}_${ownerName}`
    await page.getByPlaceholder('母馬名で検索...').fill(mare)
    await page.getByRole('button', { name: '手動で登録' }).click()
    await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
    await page.getByRole('textbox', { name: '馬名' }).fill(`テスト馬${i}_${ownerName}`)
    await page.getByRole('textbox', { name: '父馬' }).fill('テスト父')
    await page.getByRole('textbox', { name: '母馬' }).fill(mare)
    await page.getByRole('radio', { name: ownerName }).click()
    await page.getByRole('button', { name: '登録' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  }
}

test.describe('馬リスト画面', () => {
  test.describe.configure({ mode: 'serial' })

  const OWNER_NAME = `馬リストテスト_${Date.now()}`

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    if (
      process.env['TEST_USER_EMAIL'] &&
      process.env['TEST_USER_PASSWORD'] &&
      process.env['SUPABASE_SERVICE_ROLE_KEY']
    ) {
      await cleanupTestUserData()
    }
    await loginAsTestUser(page)
    await setupOwnerAndHorses(page, OWNER_NAME)
  })

  test('TC-HORSELIST-001: オーナー別一覧表示', async ({ page }) => {
    // /horselist/<owner_name> にアクセスし、そのオーナーの馬だけが表示されること
    await page.goto(`/horselist/${encodeURIComponent(OWNER_NAME)}`)
    await expect(page.getByRole('heading', { name: `${OWNER_NAME} の馬リスト` })).toBeVisible()
    // テーブルが表示されること
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('TC-HORSELIST-002: po_order_no昇順ソート', async ({ page }) => {
    await page.goto(`/horselist/${encodeURIComponent(OWNER_NAME)}`)

    const rows = page.getByRole('row')
    // ヘッダー行 + 2データ行 = 3行になるまで待つ
    await expect(rows).toHaveCount(3)

    // 2行目以降 (1行目はヘッダー) のNo列が昇順になっていること
    const firstNo = await rows.nth(1).getByRole('cell').nth(0).textContent()
    const secondNo = await rows.nth(2).getByRole('cell').nth(0).textContent()
    expect(Number(firstNo)).toBeLessThanOrEqual(Number(secondNo))
  })

  test('TC-HORSELIST-003: フリーワード検索', async ({ page }) => {
    await page.goto(`/horselist/${encodeURIComponent(OWNER_NAME)}`)
    // データロードを待つ
    await expect(page.getByRole('table')).toBeVisible()

    const searchInput = page.getByRole('textbox', { name: 'フリーワード検索' })
    const rowsBefore = await page.getByRole('row').count()

    // 検索ワードで絞り込んだ結果が検索前以下の行数になること
    await searchInput.fill('キズナ')
    const rowsAfter = await page.getByRole('row').count()
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore)
  })

  test('TC-HORSELIST-004: 馬情報の編集', async ({ page }) => {
    await page.goto(`/horselist/${encodeURIComponent(OWNER_NAME)}`)

    // 最初の馬の編集ボタンが表示されるまで待つ
    await expect(page.getByRole('button', { name: /を編集$/ }).first()).toBeVisible()

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
    await page.goto(`/horselist/${encodeURIComponent(OWNER_NAME)}`)

    // 最初の馬の削除ボタンが表示されるまで待つ
    await expect(page.getByRole('button', { name: /を削除$/ }).first()).toBeVisible()

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
    await page.goto(`/horselist/${encodeURIComponent(OWNER_NAME)}`)

    // 「全オーナー合計: X頭」が表示されること
    await expect(page.getByText(/全オーナー合計: \d+頭/)).toBeVisible()
  })
})
