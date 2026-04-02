import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePogStore } from '@/store/pogStore'
import type { CatalogHorse, Horse, Owner } from '@/types'

vi.mock('@/data/horse_catalogue.json', () => ({ default: [] }))

// Mock child components to isolate HomePageClient logic
vi.mock('@/components/home/HorseSearchInput', () => ({
  default: ({ onSelect }: { onSelect: (horse: CatalogHorse | null) => void }) => (
    <div>
      <button onClick={() => onSelect(mockCatalogHorse)}>select-horse</button>
      <button onClick={() => onSelect(mockDuplicateHorse)}>select-duplicate</button>
      <button onClick={() => onSelect(null)}>manual-entry</button>
    </div>
  ),
}))
vi.mock('@/components/home/OwnerList', () => ({ default: () => <div>OwnerList</div> }))
vi.mock('@/components/home/HorseRegisterDialog', () => ({
  default: ({ open, catalogHorse }: { open: boolean; catalogHorse: CatalogHorse | null }) =>
    open ? <div data-testid="register-dialog">{catalogHorse?.name ?? 'manual'}</div> : null,
}))
vi.mock('@/components/home/ConflictAlertDialog', () => ({
  default: ({ open, mareName }: { open: boolean; mareName: string }) =>
    open ? <div data-testid="conflict-dialog">{mareName}</div> : null,
}))

const mockCatalogHorse: CatalogHorse = {
  id: '2025000001',
  name: 'テスト馬',
  sire: 'テスト父',
  mare: 'テストメア',
  sire_count: 1,
}

const mockDuplicateHorse: CatalogHorse = {
  id: '2025000002',
  name: '重複馬',
  sire: '重複父',
  mare: '重複メア',
  sire_count: 1,
}

const { default: HomePageClient } = await import('@/app/(protected)/home/HomePageClient')

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

function makeHorse(overrides: Partial<Horse> = {}): Horse {
  return {
    id: 1,
    user_id: 'user-1',
    year: 2025,
    horse_id: '2025000002',
    name: '重複馬',
    sire: '重複父',
    mare: '重複メア',
    owner_id: 1,
    po_order_no: 1,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  usePogStore.setState({ owners: [makeOwner()], horses: [], loading: false, error: null })
})

describe('HomePageClient', () => {
  it('未指名の馬を選択すると HorseRegisterDialog が開く', async () => {
    const user = userEvent.setup()
    render(<HomePageClient />)

    await user.click(screen.getByText('select-horse'))

    expect(screen.getByTestId('register-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('register-dialog')).toHaveTextContent('テスト馬')
  })

  it('手動入力（null）を選択すると catalogHorse=null で HorseRegisterDialog が開く', async () => {
    const user = userEvent.setup()
    render(<HomePageClient />)

    await user.click(screen.getByText('manual-entry'))

    expect(screen.getByTestId('register-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('register-dialog')).toHaveTextContent('manual')
  })

  it('指名済みの母馬を選択すると ConflictAlertDialog が開く', async () => {
    usePogStore.setState({
      owners: [makeOwner()],
      horses: [makeHorse()],
      loading: false,
      error: null,
    })
    const user = userEvent.setup()
    render(<HomePageClient />)

    await user.click(screen.getByText('select-duplicate'))

    expect(screen.getByTestId('conflict-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('conflict-dialog')).toHaveTextContent('重複メア')
  })
})
