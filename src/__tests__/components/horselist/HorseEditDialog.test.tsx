import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePogStore } from '@/store/pogStore'
import type { Horse, Owner } from '@/types'

vi.mock('@/hooks/useHorses', () => ({
  useHorses: () => ({
    createHorse: vi.fn().mockResolvedValue(undefined),
    fetchHorses: vi.fn(),
    updateHorse: vi.fn().mockResolvedValue(undefined),
    deleteHorse: vi.fn(),
  }),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))

const { default: HorseEditDialog } = await import('@/components/horselist/HorseEditDialog')

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
    horse_id: null,
    name: '馬A',
    sire: '父馬',
    mare: '母馬A',
    owner_id: 1,
    po_order_no: 1,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const owner = makeOwner({ id: 1, name: 'オーナーA' })

beforeEach(() => {
  usePogStore.setState({ owners: [owner], horses: [], loading: false, error: null })
})

describe('HorseEditDialog', () => {
  it('open=true のとき対象馬の情報がフォームに表示される', async () => {
    const horse = makeHorse({ id: 1, name: '馬A', sire: '父馬', mare: '母馬A', owner_id: 1 })
    usePogStore.setState({ owners: [owner], horses: [horse] })

    render(<HorseEditDialog open={true} onOpenChange={vi.fn()} target={horse} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('馬A')).toBeInTheDocument()
      expect(screen.getByDisplayValue('父馬')).toBeInTheDocument()
      expect(screen.getByDisplayValue('母馬A')).toBeInTheDocument()
    })
  })

  it('キャンセルボタンを押すと onOpenChange(false) が呼ばれる', async () => {
    const onOpenChange = vi.fn()
    const horse = makeHorse()
    usePogStore.setState({ owners: [owner], horses: [horse] })

    render(<HorseEditDialog open={true} onOpenChange={onOpenChange} target={horse} />)

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    await userEvent.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('open 時点のスナップショットで重複チェックが行われる', async () => {
    const user = userEvent.setup()
    const horseA = makeHorse({ id: 1, name: '馬A', mare: '母馬A' })
    const horseB = makeHorse({ id: 2, name: '馬B', mare: '母馬B', po_order_no: 2 })
    usePogStore.setState({ owners: [owner], horses: [horseA, horseB] })

    render(<HorseEditDialog open={true} onOpenChange={vi.fn()} target={horseA} />)

    // open 後にストアへ新しい馬 '馬C' を追加（Realtime 更新を模擬）
    act(() => {
      const horseC = makeHorse({ id: 3, name: '馬C', mare: '母馬C', po_order_no: 3 })
      usePogStore.setState((s) => ({ horses: [...s.horses, horseC] }))
    })

    // スナップショット後に追加された '馬C' の名前は重複エラーにならない
    const nameInput = screen.getByDisplayValue('馬A')
    await user.clear(nameInput)
    await user.type(nameInput, '馬C')

    const submitButton = screen.getByRole('button', { name: '保存' })
    await user.click(submitButton)

    await waitFor(() => {
      // '馬C' はスナップショット時点では存在しないため重複エラーが出ないこと
      const errors = screen.queryAllByText('この馬名はすでに登録されています')
      expect(errors).toHaveLength(0)
    })
  })

  it('open 時点のスナップショットにある馬名は重複エラーになる', async () => {
    const user = userEvent.setup()
    const horseA = makeHorse({ id: 1, name: '馬A', mare: '母馬A' })
    const horseB = makeHorse({ id: 2, name: '馬B', mare: '母馬B', po_order_no: 2 })
    usePogStore.setState({ owners: [owner], horses: [horseA, horseB] })

    render(<HorseEditDialog open={true} onOpenChange={vi.fn()} target={horseA} />)

    // '馬B' はスナップショット時点で存在しているため重複エラーになる
    const nameInput = screen.getByDisplayValue('馬A')
    await user.clear(nameInput)
    await user.type(nameInput, '馬B')

    const submitButton = screen.getByRole('button', { name: '保存' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('この馬名はすでに登録されています')).toBeInTheDocument()
    })
  })

  it('編集対象の自身の馬名・母馬名は重複エラーにならない', async () => {
    const user = userEvent.setup()
    const horseA = makeHorse({ id: 1, name: '馬A', mare: '母馬A' })
    usePogStore.setState({ owners: [owner], horses: [horseA] })

    render(<HorseEditDialog open={true} onOpenChange={vi.fn()} target={horseA} />)

    // 自身の名前・母馬名のままで保存しても重複エラーにならないこと
    const submitButton = screen.getByRole('button', { name: '保存' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('この馬名はすでに登録されています')).not.toBeInTheDocument()
      expect(
        screen.queryByText('この母馬はすでに他の馬として指名されています'),
      ).not.toBeInTheDocument()
    })
  })

  it('ダイアログを閉じて再オープンすると新しいスナップショットが取られる', async () => {
    const user = userEvent.setup()
    const horseA = makeHorse({ id: 1, name: '馬A', mare: '母馬A' })
    usePogStore.setState({ owners: [owner], horses: [horseA] })

    const { rerender } = render(
      <HorseEditDialog open={true} onOpenChange={vi.fn()} target={horseA} />,
    )

    // 一度閉じる
    rerender(<HorseEditDialog open={false} onOpenChange={vi.fn()} target={horseA} />)

    // 閉じている間に新しい馬 '馬B' が登録される（Realtime 更新を模擬）
    act(() => {
      const horseB = makeHorse({ id: 2, name: '馬B', mare: '母馬B', po_order_no: 2 })
      usePogStore.setState((s) => ({ horses: [...s.horses, horseB] }))
    })

    // 再オープン → 馬B を含む新しいスナップショットが取られる
    rerender(<HorseEditDialog open={true} onOpenChange={vi.fn()} target={horseA} />)

    // 再オープン後のスナップショットには '馬B' が含まれるため重複エラーになる
    await waitFor(() => {
      expect(screen.getByDisplayValue('馬A')).toBeInTheDocument()
    })

    const nameInput = screen.getByDisplayValue('馬A')
    await user.clear(nameInput)
    await user.type(nameInput, '馬B')

    const submitButton = screen.getByRole('button', { name: '保存' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('この馬名はすでに登録されています')).toBeInTheDocument()
    })
  })
})
