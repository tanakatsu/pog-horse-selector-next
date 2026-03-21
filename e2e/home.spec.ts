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

async function addOwnerOnGroupPage(page: Page, name: string) {
  await page.goto('/group')
  await expect(page.getByRole('heading', { name: 'オーナー管理' })).toBeVisible()
  await page.getByRole('button', { name: 'オーナーを追加' }).click()
  await expect(page.getByRole('dialog', { name: 'オーナーを追加' })).toBeVisible()
  await page.getByLabel('オーナー名').fill(name)
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
}

async function registerHorseManually(
  page: Page,
  opts: {
    horseName: string
    sire: string
    mare: string
    ownerName: string
  },
) {
  const searchInput = page.getByPlaceholder('母馬名で検索...')
  await searchInput.fill(opts.mare)
  await page.getByRole('button', { name: '手動で登録' }).click()
  await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
  await page.getByLabel('馬名').fill(opts.horseName)
  await page.getByLabel('父馬').fill(opts.sire)
  await page.getByLabel('母馬').fill(opts.mare)
  await page.getByLabel(opts.ownerName).click()
  await page.getByRole('button', { name: '登録' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
}

// horse_catalogue.json の先頭にある馬: 母馬名「キズナメア」、馬名「キズナの2025」
const CATALOGUE_MARE = 'キズナメア'
const CATALOGUE_HORSE_NAME = 'キズナの2025'

test.describe('馬選択（/home）', () => {
  test.describe.configure({ mode: 'serial' })

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

  test('TC-HOME-002: 馬カタログ検索・サジェスト表示', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)

    const ownerName = `カタログ検索テスト_${Date.now()}`
    await addOwnerOnGroupPage(page, ownerName)

    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()

    // カタログに存在する母馬名の先頭部分で検索
    const searchInput = page.getByPlaceholder('母馬名で検索...')
    await expect(searchInput).toBeEnabled()
    await searchInput.fill('キズナ')

    // サジェストリストが表示されることを確認
    await expect(page.getByRole('option', { name: new RegExp(CATALOGUE_MARE) })).toBeVisible()
    // カタログの馬名（キズナの2025）もサジェスト内に表示されることを確認
    await expect(page.getByText(CATALOGUE_HORSE_NAME)).toBeVisible()
  })

  test('TC-HOME-003: カタログから馬を登録', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)

    const ownerName = `カタログ登録テスト_${Date.now()}`
    await addOwnerOnGroupPage(page, ownerName)

    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()

    // 登録前のオーナーの指名数を確認
    const ownerItem = page.getByRole('listitem').filter({ hasText: ownerName })
    const beforeCount = await ownerItem.getByText(/\d+ 頭/).textContent()

    // カタログから馬を検索・選択
    const searchInput = page.getByPlaceholder('母馬名で検索...')
    await searchInput.fill('キズナ')
    await page.getByRole('option', { name: new RegExp(CATALOGUE_MARE) }).click()

    // 馬を登録ダイアログが開くことを確認
    await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
    // フォームにカタログ情報が自動入力されていることを確認
    await expect(page.getByLabel('馬名')).toHaveValue(CATALOGUE_HORSE_NAME)
    await expect(page.getByLabel('母馬')).toHaveValue(CATALOGUE_MARE)

    // オーナーを選択して登録
    await page.getByLabel(ownerName).click()
    await page.getByRole('button', { name: '登録' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // オーナーリストの指名数が増えることを確認
    const afterCountText = await ownerItem.getByText(/\d+ 頭/).textContent()
    const beforeNum = parseInt(beforeCount?.match(/\d+/)?.[0] ?? '0', 10)
    const afterNum = parseInt(afterCountText?.match(/\d+/)?.[0] ?? '0', 10)
    expect(afterNum).toBe(beforeNum + 1)
  })

  test('TC-HOME-004: 手動入力で馬を登録', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)

    const ownerName = `手動登録テスト_${Date.now()}`
    await addOwnerOnGroupPage(page, ownerName)

    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()

    const horseName = `手動登録馬_${Date.now()}`
    const mareName = `存在しないメア_${Date.now()}`

    // 存在しない母名で検索 → 「手動で登録」ボタンが表示される
    const searchInput = page.getByPlaceholder('母馬名で検索...')
    await searchInput.fill(mareName)
    await expect(page.getByText('見つかりません')).toBeVisible()
    await page.getByRole('button', { name: '手動で登録' }).click()

    await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
    await page.getByLabel('馬名').fill(horseName)
    await page.getByLabel('父馬').fill('テスト父馬')
    await page.getByLabel('母馬').fill(mareName)
    await page.getByLabel(ownerName).click()
    await page.getByRole('button', { name: '登録' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // オーナーリストに登録が反映されることを確認
    const ownerItem = page.getByRole('listitem').filter({ hasText: ownerName })
    await expect(ownerItem.getByText(/[1-9]\d* 頭/)).toBeVisible()
  })

  test('TC-HOME-005: 母馬重複チェック', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)

    const ownerName = `母馬重複テスト_${Date.now()}`
    await addOwnerOnGroupPage(page, ownerName)

    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()

    const horseName1 = `重複チェック馬1_${Date.now()}`
    const horseName2 = `重複チェック馬2_${Date.now()}`
    const mareName = `重複メア_${Date.now()}`

    // 1頭目を登録
    await registerHorseManually(page, {
      horseName: horseName1,
      sire: '父馬',
      mare: mareName,
      ownerName,
    })

    // 2頭目を同じ母馬で登録試行
    const searchInput = page.getByPlaceholder('母馬名で検索...')
    await searchInput.fill(mareName)
    await page.getByRole('button', { name: '手動で登録' }).click()

    await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
    await page.getByLabel('馬名').fill(horseName2)
    await page.getByLabel('父馬').fill('父馬')
    await page.getByLabel('母馬').fill(mareName)
    await page.getByLabel(ownerName).click()
    await page.getByRole('button', { name: '登録' }).click()

    // 母馬重複エラーメッセージを確認
    await expect(page.getByText('この母馬はすでに他の馬として指名されています')).toBeVisible()
  })

  test('TC-HOME-006: 馬名重複チェック', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)

    const ownerName = `馬名重複テスト_${Date.now()}`
    await addOwnerOnGroupPage(page, ownerName)

    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()

    const horseName = `重複馬名_${Date.now()}`
    const mareName1 = `馬名重複メア1_${Date.now()}`
    const mareName2 = `馬名重複メア2_${Date.now()}`

    // 1頭目を登録
    await registerHorseManually(page, {
      horseName,
      sire: '父馬',
      mare: mareName1,
      ownerName,
    })

    // 2頭目を同じ馬名で登録試行（母馬は別）
    const searchInput = page.getByPlaceholder('母馬名で検索...')
    await searchInput.fill(mareName2)
    await page.getByRole('button', { name: '手動で登録' }).click()

    await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
    await page.getByLabel('馬名').fill(horseName)
    await page.getByLabel('父馬').fill('父馬')
    await page.getByLabel('母馬').fill(mareName2)
    await page.getByLabel(ownerName).click()
    await page.getByRole('button', { name: '登録' }).click()

    // 馬名重複エラーメッセージを確認
    await expect(page.getByText('この馬名はすでに登録されています')).toBeVisible()
  })

  test('TC-HOME-007: 指名順番の自動採番', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)

    const ownerName = `採番テストオーナー_${Date.now()}`
    await addOwnerOnGroupPage(page, ownerName)

    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()

    const suffix = Date.now()

    // 3頭登録
    for (let i = 1; i <= 3; i++) {
      const searchInput = page.getByPlaceholder('母馬名で検索...')
      await searchInput.fill(`採番メア${i}_${suffix}`)
      await page.getByRole('button', { name: '手動で登録' }).click()
      await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
      await page.getByLabel('馬名').fill(`採番馬${i}_${suffix}`)
      await page.getByLabel('父馬').fill('父馬')
      await page.getByLabel('母馬').fill(`採番メア${i}_${suffix}`)
      await page.getByLabel(ownerName).click()
      await page.getByRole('button', { name: '登録' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
    }

    // /horselist/[owner] で po_order_no が 1, 2, 3 であることを確認
    await page.goto(`/horselist/${encodeURIComponent(ownerName)}`)
    await expect(page.getByRole('heading', { name: `${ownerName} の馬リスト` })).toBeVisible()

    // No列のセルを取得して順番を確認
    const rows = page.getByRole('row')
    const rowCount = await rows.count()
    const nos: number[] = []
    for (let i = 1; i < rowCount; i++) {
      const row = rows.nth(i)
      const cells = row.getByRole('cell')
      const noText = await cells.first().textContent()
      const no = Number(noText?.trim())
      if (!isNaN(no) && no > 0) {
        nos.push(no)
      }
    }

    // 3頭分の番号が存在し、最後の3つが 1, 2, 3 であることを確認
    // （既存データがある可能性があるため後ろ3件を確認）
    const last3 = nos.slice(-3)
    expect(last3.length).toBe(3)
    // po_order_no が連続した整数であることを確認
    expect(last3[1]).toBe((last3[0] ?? 0) + 1)
    expect(last3[2]).toBe((last3[0] ?? 0) + 2)
  })

  test('TC-HOME-008: 選択済み馬の ✔ マーク表示', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] || !process.env['TEST_USER_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定のためスキップ',
    )
    await loginAsTestUser(page)

    const ownerName = `チェックマークテスト_${Date.now()}`
    await addOwnerOnGroupPage(page, ownerName)

    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()

    const horseName = `チェックマーク馬_${Date.now()}`
    const mareName = `チェックメア_${Date.now()}`

    // 馬を登録
    await registerHorseManually(page, {
      horseName,
      sire: '父馬',
      mare: mareName,
      ownerName,
    })

    // 同じ母馬名で検索 → ✔マークが表示されることを確認
    const searchInput = page.getByPlaceholder('母馬名で検索...')
    await searchInput.fill(mareName)

    // 手動で登録したメアは catalog に存在しないので CommandEmpty が表示されるだけ
    // カタログに存在するメアでテストするために、カタログの馬を先に登録する必要がある。
    // ここでは手動登録した馬の母名は catalog にないため、
    // catalog の馬を検索して ✔ マークが表示されるシナリオを確認する。
    // まずキャンセルして、カタログの馬を登録する
    await searchInput.fill('')
    await searchInput.fill('キズナ')
    // カタログから選択して登録
    const catalogSuggestion = page.getByRole('option', { name: new RegExp(CATALOGUE_MARE) })
    await expect(catalogSuggestion).toBeVisible()

    // カタログの馬が既に選択済みかどうかを確認
    const isChecked = await catalogSuggestion.getAttribute('data-checked')
    if (isChecked !== 'true') {
      // まだ登録されていない場合は登録する
      await catalogSuggestion.click()
      await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
      await page.getByLabel(ownerName).click()
      await page.getByRole('button', { name: '登録' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
    }

    // 再度同じ母馬名で検索 → ✔マーク（選択済みアイコン）が表示されることを確認
    await searchInput.fill('キズナ')
    const checkedSuggestion = page.getByRole('option', { name: new RegExp(CATALOGUE_MARE) })
    await expect(checkedSuggestion).toBeVisible()
    // data-checked 属性か aria-label "選択済み" の Check アイコンを確認
    await expect(checkedSuggestion.getByLabel('選択済み')).toBeVisible()
  })
})
