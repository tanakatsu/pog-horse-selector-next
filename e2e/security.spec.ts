import { test, expect, type Page } from '@playwright/test'

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/(home|group|horselist)/)
}

async function logout(page: Page) {
  // セッションをクリアするためにストレージをリセット
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.context().clearCookies()
  await page.goto('/login')
  await page.waitForURL(/\/login/)
}

test.describe('セキュリティ・RLS', () => {
  test('TC-SEC-001: ユーザーデータ分離', async ({ page }) => {
    test.skip(
      !process.env['TEST_USER_EMAIL'] ||
        !process.env['TEST_USER_PASSWORD'] ||
        !process.env['TEST_USER2_EMAIL'] ||
        !process.env['TEST_USER2_PASSWORD'],
      'TEST_USER_EMAIL / TEST_USER_PASSWORD / TEST_USER2_EMAIL / TEST_USER2_PASSWORD が未設定のためスキップ',
    )

    const user1Email = process.env['TEST_USER_EMAIL'] ?? ''
    const user1Password = process.env['TEST_USER_PASSWORD'] ?? ''
    const user2Email = process.env['TEST_USER2_EMAIL'] ?? ''
    const user2Password = process.env['TEST_USER2_PASSWORD'] ?? ''

    // ユーザーAでログインしてオーナー追加
    await loginAs(page, user1Email, user1Password)
    const ownerName = `分離テストオーナー_${Date.now()}`
    await page.goto('/group')
    await expect(page.getByRole('heading', { name: 'オーナー管理' })).toBeVisible()
    await page.getByRole('button', { name: 'オーナーを追加' }).click()
    await expect(page.getByRole('dialog', { name: 'オーナーを追加' })).toBeVisible()
    await page.getByLabel('オーナー名').fill(ownerName)
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByRole('cell', { name: ownerName })).toBeVisible()

    // ログアウト
    await logout(page)

    // ユーザーBでログイン
    await loginAs(page, user2Email, user2Password)
    await page.goto('/group')
    await expect(page.getByRole('heading', { name: 'オーナー管理' })).toBeVisible()

    // ユーザーAのオーナーがユーザーBには表示されないことを確認
    await expect(page.getByRole('cell', { name: ownerName })).not.toBeVisible()
  })

  test('TC-SEC-002: 直接APIアクセスの拒否', async ({ page }) => {
    test.skip(
      !process.env['NEXT_PUBLIC_SUPABASE_URL'],
      'NEXT_PUBLIC_SUPABASE_URL が未設定のためスキップ',
    )

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? ''

    // 認証なし（anon key なし）でSupabase REST APIに直接アクセス
    const result = await page.evaluate(async (url: string) => {
      try {
        const response = await fetch(`${url}/rest/v1/owners?select=*`, {
          headers: {
            // Authorization ヘッダーなし・apikey なし
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          return { status: response.status, count: 0, isError: true }
        }
        const data = await response.json()
        return {
          status: response.status,
          count: Array.isArray(data) ? data.length : 0,
          isError: false,
        }
      } catch {
        return { status: 0, count: 0, isError: true }
      }
    }, supabaseUrl)

    // 認証なしでは401が返ることを確認
    expect(result.status).toBe(401)
  })

  test('TC-SEC: 未認証で保護ルートにアクセスすると /login にリダイレクト', async ({ page }) => {
    for (const route of ['/home', '/group', '/download']) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    }
  })
})
