import { test, expect } from '@playwright/test'

test.describe('認証フロー', () => {
  test('TC-AUTH-001: サインアップ（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-AUTH-002: ログイン（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-AUTH-003: パスワード忘れメール送信（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-AUTH-004: パスワードリセット（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })

  test('TC-AUTH-005: 未認証アクセスは /login にリダイレクト', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-005: 未認証で /group は /login にリダイレクト', async ({ page }) => {
    await page.goto('/group')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-005: 未認証で /download は /login にリダイレクト', async ({ page }) => {
    await page.goto('/download')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-005: 未認証で /horselist は /login にリダイレクト', async ({ page }) => {
    await page.goto('/horselist')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-006: 認証済みユーザーの認証画面アクセス（Supabase接続が必要なためスキップ）', async () => {
    test.skip(true, 'Supabaseへの実際の接続が必要なためスキップ')
  })
})
