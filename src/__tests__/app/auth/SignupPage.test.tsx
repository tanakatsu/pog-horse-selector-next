import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { APP_TITLE } from '@/lib/constants'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    auth: { signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
  }),
}))

const { default: SignupPage } = await import('@/app/(auth)/signup/page')

describe('SignupPage', () => {
  it('アプリタイトルが表示される', () => {
    render(<SignupPage />)
    expect(screen.getByText(APP_TITLE)).toBeInTheDocument()
  })

  it('アカウント作成フォームのCardTitleが表示される', () => {
    render(<SignupPage />)
    expect(
      screen.getByText('アカウント作成', { selector: '[data-slot="card-title"]' }),
    ).toBeInTheDocument()
  })

  it('メール確認画面でもアプリタイトルが表示される', async () => {
    render(<SignupPage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123')
    await user.click(screen.getByRole('button', { name: 'アカウントを作成' }))

    expect(await screen.findByText(APP_TITLE)).toBeInTheDocument()
    expect(
      screen.getByText('確認メールを送信しました', { selector: '[data-slot="card-title"]' }),
    ).toBeInTheDocument()
  })
})
