import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { APP_TITLE } from '@/lib/constants'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: null }) },
  }),
}))

const { default: LoginPage } = await import('@/app/(auth)/login/page')

describe('LoginPage', () => {
  it('アプリタイトルが表示される', () => {
    render(<LoginPage />)
    expect(screen.getByText(APP_TITLE)).toBeInTheDocument()
  })

  it('ログインフォームの見出しが表示される', () => {
    render(<LoginPage />)
    const heading = screen.getByText('ログイン', { selector: 'h1' })
    expect(heading).toBeInTheDocument()
  })

  it('アプリタイトルは見出しより前に表示される', () => {
    render(<LoginPage />)
    const appTitle = screen.getByText(APP_TITLE)
    const formTitle = screen.getByText('ログイン', { selector: 'h1' })
    expect(
      appTitle.compareDocumentPosition(formTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
