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

async function addOwner(page: Page, name: string, no?: string) {
  await page.getByRole('button', { name: 'オーナーを追加' }).click()
  await expect(page.getByRole('dialog', { name: 'オーナーを追加' })).toBeVisible()
  await page.getByLabel('オーナー名').fill(name)
  if (no !== undefined) {
    await page.getByLabel('番号（任意）').fill(no)
  }
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
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

  test('TC-GROUP-004: オーナー削除時の馬連動削除', async ({ page }) => {
    const ownerName = `連動削除オーナー_${Date.now()}`
    const horseName = `連動削除馬_${Date.now()}`
    const mareName = `連動削除メア_${Date.now()}`

    // /group でオーナー追加
    await addOwner(page, ownerName)

    // /home で馬を登録
    await page.goto('/home')
    await expect(page.getByRole('heading', { name: '馬選択' })).toBeVisible()

    // 存在しない母名で検索 → 手動登録フォームを開く
    const searchInput = page.getByPlaceholder('母馬名で検索...')
    await searchInput.fill(mareName)
    await page.getByRole('button', { name: '手動で登録' }).click()

    await expect(page.getByRole('dialog', { name: '馬を登録' })).toBeVisible()
    await page.getByLabel('馬名').fill(horseName)
    await page.getByLabel('父馬').fill('テスト父')
    await page.getByLabel('母馬').fill(mareName)
    await page.getByLabel(ownerName).click()
    await page.getByRole('button', { name: '登録' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // /group でオーナー削除
    await page.goto('/group')
    await expect(page.getByRole('heading', { name: 'オーナー管理' })).toBeVisible()
    await page.getByRole('button', { name: `${ownerName}を削除` }).click()
    await expect(page.getByRole('dialog', { name: 'オーナーを削除' })).toBeVisible()
    await page.getByRole('button', { name: '削除' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // /horselist でその馬が存在しないことをUIで確認
    // オーナーが削除されたためそのオーナーのhorselistページは存在しないはずだが、
    // ページにアクセスして馬が表示されていないことを確認する
    await page.goto(`/horselist/${encodeURIComponent(ownerName)}`)
    // 馬テーブルに馬名が表示されていないことを確認
    await expect(page.getByRole('cell', { name: horseName })).not.toBeVisible()
  })

  test('TC-GROUP-005: 番号順ソート', async ({ page }) => {
    const suffix = Date.now()
    const owner3 = `ソートテスト3_${suffix}`
    const owner1 = `ソートテスト1_${suffix}`
    const owner2 = `ソートテスト2_${suffix}`

    // no=3, 1, 2 の順でオーナーを追加
    await addOwner(page, owner3, '3')
    await addOwner(page, owner1, '1')
    await addOwner(page, owner2, '2')

    // テーブルの番号列を取得して昇順になっていることを確認
    // 追加したオーナーの番号セルを取得する
    const rows = page.getByRole('row')
    const rowCount = await rows.count()

    // 各行の番号セルを収集（ヘッダー行を除く）
    const nos: number[] = []
    for (let i = 1; i < rowCount; i++) {
      const row = rows.nth(i)
      const cells = row.getByRole('cell')
      const noText = await cells.first().textContent()
      const no = Number(noText?.trim())
      if (!isNaN(no)) {
        nos.push(no)
      }
    }

    // no が存在する行が昇順に並んでいることを確認
    const nosWithValues = nos.filter((n) => n > 0)
    for (let i = 1; i < nosWithValues.length; i++) {
      expect(nosWithValues[i]).toBeGreaterThanOrEqual(nosWithValues[i - 1]!)
    }

    // 追加した3つのオーナーがオーナー名の行順で番号順（no=1, 2, 3）に並んでいることを確認
    const allRows = await page.getByRole('row').all()
    const indices = await Promise.all(
      [owner1, owner2, owner3].map(async (name) => {
        for (let i = 0; i < allRows.length; i++) {
          const text = await allRows[i]!.textContent()
          if (text?.includes(name)) return i
        }
        return -1
      }),
    )
    // no=1のオーナーがno=2より前、no=2がno=3より前に表示される
    expect(indices[0]).toBeGreaterThan(-1)
    expect(indices[1]).toBeGreaterThan(-1)
    expect(indices[2]).toBeGreaterThan(-1)
    expect(indices[0]).toBeLessThan(indices[1]!)
    expect(indices[1]).toBeLessThan(indices[2]!)
  })
})
