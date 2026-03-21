import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Horse } from '@/types'

const { default: HorseTable } = await import('@/components/horselist/HorseTable')

const mockHorses: Horse[] = [
  {
    id: 1,
    user_id: 'u1',
    year: 2025,
    horse_id: '2025000001',
    name: 'キズナの2025',
    sire: 'キズナ',
    mare: 'テスト母1',
    owner_id: 1,
    po_order_no: 3,
    created_at: '',
  },
  {
    id: 2,
    user_id: 'u1',
    year: 2025,
    horse_id: '2025000002',
    name: 'ディープの2025',
    sire: 'ディープ',
    mare: 'テスト母2',
    owner_id: 1,
    po_order_no: 1,
    created_at: '',
  },
  {
    id: 3,
    user_id: 'u1',
    year: 2025,
    horse_id: null,
    name: 'アーモンドの2025',
    sire: 'アーモンドアイ',
    mare: 'テスト母3',
    owner_id: 1,
    po_order_no: 2,
    created_at: '',
  },
]

describe('HorseTable', () => {
  it('馬一覧が表示される', () => {
    render(
      <HorseTable horses={mockHorses} totalHorseCount={3} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )

    expect(screen.getByText('キズナの2025')).toBeInTheDocument()
    expect(screen.getByText('ディープの2025')).toBeInTheDocument()
    expect(screen.getByText('アーモンドの2025')).toBeInTheDocument()
    expect(screen.getByText('キズナ')).toBeInTheDocument()
    expect(screen.getByText('テスト母1')).toBeInTheDocument()
  })

  it('po_order_no昇順で表示される', () => {
    render(
      <HorseTable horses={mockHorses} totalHorseCount={3} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )

    const rows = screen.getAllByRole('row')
    // rows[0] is the header row, data rows start at index 1
    expect(rows).toHaveLength(4) // header + 3 data rows
    expect(rows[1]!).toHaveTextContent('1')
    expect(rows[1]!).toHaveTextContent('ディープの2025')
    expect(rows[2]!).toHaveTextContent('2')
    expect(rows[2]!).toHaveTextContent('アーモンドの2025')
    expect(rows[3]!).toHaveTextContent('3')
    expect(rows[3]!).toHaveTextContent('キズナの2025')
  })

  it('フリーワード検索で絞り込まれる', () => {
    render(
      <HorseTable horses={mockHorses} totalHorseCount={3} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )

    const searchInput = screen.getByRole('textbox', { name: 'フリーワード検索' })
    fireEvent.change(searchInput, { target: { value: 'キズナ' } })

    // キズナの2025 (name contains キズナ) and キズナ (sire contains キズナ) should be visible
    // Only "キズナの2025" matches (name="キズナの2025", sire="キズナ")
    expect(screen.getByText('キズナの2025')).toBeInTheDocument()
    // ディープ and アーモンド should not be visible
    expect(screen.queryByText('ディープの2025')).not.toBeInTheDocument()
    expect(screen.queryByText('アーモンドの2025')).not.toBeInTheDocument()
  })

  it('10件を超えるとページネーションが出る', () => {
    const manyHorses: Horse[] = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      user_id: 'u1',
      year: 2025,
      horse_id: null,
      name: `馬${i + 1}`,
      sire: `父${i + 1}`,
      mare: `母${i + 1}`,
      owner_id: 1,
      po_order_no: i + 1,
      created_at: '',
    }))

    render(
      <HorseTable horses={manyHorses} totalHorseCount={11} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )

    expect(screen.getByRole('navigation', { name: 'ページネーション' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument()
  })

  it('編集・削除ボタンが各行にある', () => {
    render(
      <HorseTable horses={mockHorses} totalHorseCount={3} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: 'キズナの2025を編集' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'キズナの2025を削除' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ディープの2025を編集' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ディープの2025を削除' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'アーモンドの2025を編集' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'アーモンドの2025を削除' })).toBeInTheDocument()
  })
})
