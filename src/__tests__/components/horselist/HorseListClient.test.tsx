import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePogStore } from '@/store/pogStore'
import type { Horse, Owner } from '@/types'

vi.mock('@/components/horselist/HorseEditDialog', () => ({
  default: () => null,
}))
vi.mock('@/components/horselist/HorseDeleteDialog', () => ({
  default: () => null,
}))

const { default: HorseListClient } = await import('@/components/horselist/HorseListClient')

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
    horse_id: 'horse-1',
    name: 'テスト馬',
    sire: '父馬',
    mare: '母馬',
    owner_id: 1,
    po_order_no: 1,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  usePogStore.setState({ owners: [], horses: [], loading: false, error: null })
})

// console.error のスパイを各テストで設定し、無限ループエラーが出ていないことを確認する
let consoleErrorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  const calls = consoleErrorSpy.mock.calls
  const hasInfiniteLoop = calls.some(
    (args: unknown[]) =>
      typeof args[0] === 'string' && args[0].includes('Maximum update depth exceeded'),
  )
  expect(hasInfiniteLoop, '無限ループエラー（Maximum update depth exceeded）が発生している').toBe(
    false,
  )
  consoleErrorSpy.mockRestore()
})

describe('HorseListClient', () => {
  it('馬が0頭のオーナーでも無限ループなくレンダーされる', () => {
    const owner = makeOwner({ id: 1, name: 'オーナーA' })
    usePogStore.setState({ owners: [owner], horses: [] })

    render(<HorseListClient ownerName="オーナーA" />)
  })

  it('存在しないオーナー名でも無限ループなくレンダーされる', () => {
    usePogStore.setState({ owners: [], horses: [] })

    render(<HorseListClient ownerName="存在しないオーナー" />)
  })

  it('馬が複数頭いるオーナーの馬一覧を表示する', () => {
    const owner = makeOwner({ id: 1, name: 'オーナーA' })
    const horses = [
      makeHorse({ id: 1, owner_id: 1, name: '馬A', po_order_no: 1 }),
      makeHorse({ id: 2, owner_id: 1, name: '馬B', po_order_no: 2 }),
    ]
    usePogStore.setState({ owners: [owner], horses })

    render(<HorseListClient ownerName="オーナーA" />)

    expect(screen.getByText('馬A')).toBeInTheDocument()
    expect(screen.getByText('馬B')).toBeInTheDocument()
  })

  it('他のオーナーの馬は表示しない', () => {
    const ownerA = makeOwner({ id: 1, name: 'オーナーA' })
    const ownerB = makeOwner({ id: 2, name: 'オーナーB' })
    const horses = [
      makeHorse({ id: 1, owner_id: 1, name: '馬A', po_order_no: 1 }),
      makeHorse({ id: 2, owner_id: 2, name: '馬B', po_order_no: 1 }),
    ]
    usePogStore.setState({ owners: [ownerA, ownerB], horses })

    render(<HorseListClient ownerName="オーナーA" />)

    expect(screen.getByText('馬A')).toBeInTheDocument()
    expect(screen.queryByText('馬B')).not.toBeInTheDocument()
  })
})
