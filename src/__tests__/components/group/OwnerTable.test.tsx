import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePogStore } from '@/store/pogStore'
import type { Owner } from '@/types'

// Import after mock is set up
const { default: OwnerTable } = await import('@/components/group/OwnerTable')

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

describe('OwnerTable', () => {
  it('オーナー一覧が表示される', () => {
    usePogStore.setState({
      owners: [
        makeOwner({ id: 1, name: '山田太郎', no: 1 }),
        makeOwner({ id: 2, name: '鈴木花子', no: 2 }),
      ],
    })

    render(<OwnerTable onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('山田太郎')).toBeInTheDocument()
    expect(screen.getByText('鈴木花子')).toBeInTheDocument()
  })

  it('番号順にソートされる', () => {
    usePogStore.setState({
      owners: [
        makeOwner({ id: 1, name: 'C', no: 3 }),
        makeOwner({ id: 2, name: 'A', no: 1 }),
        makeOwner({ id: 3, name: 'B', no: 2 }),
      ],
    })

    render(<OwnerTable onEdit={vi.fn()} onDelete={vi.fn()} />)

    const rows = screen.getAllByRole('row')
    // rows[0] is the header row, data rows start at index 1
    expect(rows[1]).toHaveTextContent('1')
    expect(rows[1]).toHaveTextContent('A')
    expect(rows[2]).toHaveTextContent('2')
    expect(rows[2]).toHaveTextContent('B')
    expect(rows[3]).toHaveTextContent('3')
    expect(rows[3]).toHaveTextContent('C')
  })

  it('編集ボタンをクリックすると onEdit コールバックが owner を引数に呼ばれる', () => {
    const owner = makeOwner({ id: 1, name: '山田太郎', no: 1 })
    usePogStore.setState({ owners: [owner] })

    const onEdit = vi.fn()
    render(<OwnerTable onEdit={onEdit} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '山田太郎を編集' }))

    expect(onEdit).toHaveBeenCalledWith(owner)
  })

  it('削除ボタンをクリックすると onDelete コールバックが owner を引数に呼ばれる', () => {
    const owner = makeOwner({ id: 1, name: '山田太郎', no: 1 })
    usePogStore.setState({ owners: [owner] })

    const onDelete = vi.fn()
    render(<OwnerTable onEdit={vi.fn()} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: '山田太郎を削除' }))

    expect(onDelete).toHaveBeenCalledWith(owner)
  })

  it('オーナーが0件のとき空状態メッセージが表示される', () => {
    render(<OwnerTable onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('オーナーが登録されていません')).toBeInTheDocument()
  })
})
