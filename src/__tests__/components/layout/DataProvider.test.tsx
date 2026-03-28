import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Owner, Horse } from '@/types'

const mockSetOwners = vi.fn()
const mockSetHorses = vi.fn()
const mockSetLoading = vi.fn()
const mockSetError = vi.fn()
const mockAddOwner = vi.fn()
const mockUpdateOwner = vi.fn()
const mockRemoveOwner = vi.fn()
const mockAddHorse = vi.fn()
const mockUpdateHorse = vi.fn()
const mockRemoveHorse = vi.fn()

vi.mock('@/store/pogStore', () => ({
  usePogStore: {
    getState: () => ({
      setOwners: mockSetOwners,
      setHorses: mockSetHorses,
      setLoading: mockSetLoading,
      setError: mockSetError,
      addOwner: mockAddOwner,
      updateOwner: mockUpdateOwner,
      removeOwner: mockRemoveOwner,
      addHorse: mockAddHorse,
      updateHorse: mockUpdateHorse,
      removeHorse: mockRemoveHorse,
    }),
  },
}))

const mockSubscribe = vi.fn()
const mockOn = vi.fn()
const mockChannel = vi.fn()
const mockRemoveChannel = vi.fn()

mockOn.mockReturnValue({ subscribe: mockSubscribe })
mockChannel.mockReturnValue({ on: mockOn })
mockSubscribe.mockReturnValue({})

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}))

vi.mock('@/lib/utils', () => ({
  getTargetYear: () => 2026,
}))

const { default: DataProvider } = await import('@/components/layout/DataProvider')

const sampleOwners: Owner[] = [
  {
    id: 1,
    user_id: 'user-1',
    year: 2026,
    name: 'オーナーA',
    no: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
]

const sampleHorses: Horse[] = [
  {
    id: 10,
    user_id: 'user-1',
    year: 2026,
    horse_id: '2024-001',
    name: 'テスト馬',
    sire: '父',
    mare: '母',
    owner_id: 1,
    po_order_no: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
]

describe('DataProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOn.mockReturnValue({ subscribe: mockSubscribe })
    mockChannel.mockReturnValue({ on: mockOn })
    mockSubscribe.mockReturnValue({})
  })

  it('children を描画する', () => {
    render(
      <DataProvider initialOwners={sampleOwners} initialHorses={sampleHorses}>
        <span>child content</span>
      </DataProvider>,
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('initialOwners と initialHorses でストアを初期化する', () => {
    render(
      <DataProvider initialOwners={sampleOwners} initialHorses={sampleHorses}>
        <span>child</span>
      </DataProvider>,
    )
    expect(mockSetOwners).toHaveBeenCalledWith(sampleOwners)
    expect(mockSetHorses).toHaveBeenCalledWith(sampleHorses)
  })

  it('マウント時に Realtime チャンネルを登録する', () => {
    render(
      <DataProvider initialOwners={[]} initialHorses={[]}>
        <span>child</span>
      </DataProvider>,
    )
    expect(mockChannel).toHaveBeenCalledWith('owners-changes')
    expect(mockChannel).toHaveBeenCalledWith('horses-changes')
    expect(mockOn).toHaveBeenCalledTimes(2)
    expect(mockSubscribe).toHaveBeenCalledTimes(2)
  })

  it('アンマウント時に Realtime チャンネルを解除する', () => {
    const { unmount } = render(
      <DataProvider initialOwners={[]} initialHorses={[]}>
        <span>child</span>
      </DataProvider>,
    )
    unmount()
    expect(mockRemoveChannel).toHaveBeenCalledTimes(2)
  })

  it('setLoading や setError を呼ばない（SSR prefetch のため不要）', () => {
    render(
      <DataProvider initialOwners={sampleOwners} initialHorses={sampleHorses}>
        <span>child</span>
      </DataProvider>,
    )
    expect(mockSetLoading).not.toHaveBeenCalled()
    expect(mockSetError).not.toHaveBeenCalled()
  })
})
