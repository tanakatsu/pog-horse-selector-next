import { test, expect } from '@playwright/test'

test.describe('セキュリティ・RLS', () => {
  test('TC-SEC-001: ユーザーデータ分離（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-SEC-002: 直接APIアクセスの拒否（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-SEC: 未認証で保護ルートにアクセスすると /login にリダイレクト', async ({ page }) => {
    for (const route of ['/home', '/group', '/download']) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    }
  })
})
