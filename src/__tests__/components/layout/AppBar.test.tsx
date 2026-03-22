import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { APP_TITLE } from '@/lib/constants'

vi.mock('next/navigation', () => ({
  usePathname: () => '/home',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}))

vi.mock('@/store/pogStore', () => ({
  usePogStore: { getState: () => ({ clearData: vi.fn() }) },
}))

const { default: AppBar } = await import('@/components/layout/AppBar')

describe('AppBar', () => {
  it('アプリタイトルがホームへのリンクとして表示される', () => {
    render(<AppBar />)
    const titleLink = screen.getByRole('link', { name: APP_TITLE })
    expect(titleLink).toBeInTheDocument()
    expect(titleLink).toHaveAttribute('href', '/home')
  })

  it('ナビゲーションリンクが表示される', () => {
    render(<AppBar />)
    expect(screen.getByRole('link', { name: '馬選択' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'オーナー管理' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'CSVダウンロード' })).toBeInTheDocument()
  })

  it('アプリタイトルはナビゲーションリンクの前に表示される', () => {
    render(<AppBar />)
    const titleLink = screen.getByRole('link', { name: APP_TITLE })
    const nav = screen.getByRole('navigation')
    // タイトルリンクはnavより前に来るDOM位置にあること
    expect(titleLink.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
