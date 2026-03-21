import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePogStore } from '@/store/pogStore'
import type { Owner } from '@/types'

vi.mock('@/data/horse_catalogue.json', () => ({
  default: [
    { horse_id: '2025000001', name: 'テスト馬1', sire: 'テスト父1', mare: 'キズナメア' },
    { horse_id: '2025000002', name: 'テスト馬2', sire: 'テスト父2', mare: 'キズナメア2' },
    { horse_id: '2025000003', name: 'テスト馬3', sire: 'テスト父3', mare: 'キズナメア3' },
    { horse_id: '2025000004', name: 'テスト馬4', sire: 'テスト父4', mare: 'キズナメア4' },
    { horse_id: '2025000005', name: 'テスト馬5', sire: 'テスト父5', mare: 'キズナメア5' },
    { horse_id: '2025000006', name: 'テスト馬6', sire: 'テスト父6', mare: 'ディープメア' },
  ],
}))

const { default: HorseSearchInput } = await import('@/components/home/HorseSearchInput')

function makeOwner(overrides: Partial<Owner> = {}): Owner {
  return {
    id: 1,
    user_id: 'user-1',
    year: 2025,
    name: 'オーナーA',
    no: 1,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  usePogStore.setState({ owners: [], horses: [], loading: false, error: null })
})

describe('HorseSearchInput', () => {
  it('オーナー未登録時は入力欄が disabled になる', () => {
    usePogStore.setState({ owners: [] })

    render(<HorseSearchInput onSelect={vi.fn()} selectedMares={[]} />)

    const input = screen.getByPlaceholderText('母馬名で検索...')
    expect(input).toBeDisabled()
  })

  it('オーナーが登録されていると入力欄が有効になる', () => {
    usePogStore.setState({ owners: [makeOwner()] })

    render(<HorseSearchInput onSelect={vi.fn()} selectedMares={[]} />)

    const input = screen.getByPlaceholderText('母馬名で検索...')
    expect(input).not.toBeDisabled()
  })

  it('検索ワードを入力するとサジェストが表示される', async () => {
    usePogStore.setState({ owners: [makeOwner()] })
    const user = userEvent.setup()

    render(<HorseSearchInput onSelect={vi.fn()} selectedMares={[]} />)

    const input = screen.getByPlaceholderText('母馬名で検索...')
    await user.type(input, 'キズナ')

    expect(screen.getByText('キズナメア')).toBeInTheDocument()
    expect(screen.getByText('キズナメア2')).toBeInTheDocument()
  })

  it('maxSuggestionsで件数が制限される', async () => {
    usePogStore.setState({ owners: [makeOwner()] })
    const user = userEvent.setup()

    render(<HorseSearchInput onSelect={vi.fn()} selectedMares={[]} maxSuggestions={3} />)

    const input = screen.getByPlaceholderText('母馬名で検索...')
    await user.type(input, 'キズナ')

    // 5 matches exist but only 3 should show
    expect(screen.getByText('キズナメア')).toBeInTheDocument()
    expect(screen.getByText('キズナメア2')).toBeInTheDocument()
    expect(screen.getByText('キズナメア3')).toBeInTheDocument()
    expect(screen.queryByText('キズナメア4')).not.toBeInTheDocument()
    expect(screen.queryByText('キズナメア5')).not.toBeInTheDocument()
  })

  it('選択済み母馬に対してチェックマークが表示される', async () => {
    usePogStore.setState({ owners: [makeOwner()] })
    const user = userEvent.setup()

    render(<HorseSearchInput onSelect={vi.fn()} selectedMares={['キズナメア']} />)

    const input = screen.getByPlaceholderText('母馬名で検索...')
    await user.type(input, 'キズナ')

    // Check icon should appear for キズナメア (selected)
    const checkIcon = document.querySelector('svg[aria-label="選択済み"]')
    expect(checkIcon).toBeInTheDocument()
  })

  it('サジェスト項目を選択するとonSelectが呼ばれる', async () => {
    usePogStore.setState({ owners: [makeOwner()] })
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<HorseSearchInput onSelect={onSelect} selectedMares={[]} />)

    const input = screen.getByPlaceholderText('母馬名で検索...')
    await user.type(input, 'キズナ')

    const item = screen.getByText('キズナメア')
    await user.click(item)

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ horse_id: '2025000001', mare: 'キズナメア' }),
    )
  })
})
