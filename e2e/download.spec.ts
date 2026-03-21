import { test, expect } from '@playwright/test'

test.describe('CSVエクスポート（/download）', () => {
  test('TC-DOWNLOAD-001: 未認証アクセスは /login にリダイレクト', async ({ page }) => {
    await page.goto('/download')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-DOWNLOAD-001: 馬0件のときダウンロードボタンが disabled（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-DOWNLOAD-002: CSVダウンロード（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })
})
