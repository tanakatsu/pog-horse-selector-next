import { createClient } from '@supabase/supabase-js'

export async function cleanupTestUserData() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
  const email = process.env['TEST_USER_EMAIL']
  const password = process.env['TEST_USER_PASSWORD']

  if (!url || !serviceRoleKey || !email || !password) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / TEST_USER_EMAIL / TEST_USER_PASSWORD が未設定です',
    )
  }

  const supabase = createClient(url, serviceRoleKey)

  // テストユーザーのIDを取得
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (authError || !authData.user) {
    throw new Error(`テストユーザーのサインインに失敗しました: ${authError?.message}`)
  }
  const userId = authData.user.id

  // owners を削除（horses は ON DELETE CASCADE で連動削除される）
  const { error: deleteError } = await supabase.from('owners').delete().eq('user_id', userId)
  if (deleteError) {
    throw new Error(`クリーンアップに失敗しました: ${deleteError.message}`)
  }
}
