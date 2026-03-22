import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePogStore } from '@/store/pogStore'
import type { Owner } from '@/types'

vi.mock('@/hooks/useHorses', () => ({
  useHorses: () => ({
    createHorse: vi.fn().mockResolvedValue(undefined),
    fetchHorses: vi.fn(),
    updateHorse: vi.fn(),
    deleteHorse: vi.fn(),
  }),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))

const { default: HorseRegisterDialog } = await import('@/components/home/HorseRegisterDialog')

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

const defaultOwners: Owner[] = [
  makeOwner({ id: 1, name: 'オーナーA', no: 1 }),
  makeOwner({ id: 2, name: 'オーナーB', no: 2 }),
  makeOwner({ id: 3, name: 'オーナーC', no: 3 }),
]

beforeEach(() => {
  usePogStore.setState({ owners: defaultOwners, horses: [], loading: false, error: null })
})

describe('HorseRegisterDialog', () => {
  it('カタログから選択時はフィールドに自動入力される', () => {
    const catalogHorse = {
      id: '2025105006',
      name: 'キズナの2025',
      sire: 'キズナ',
      mare: 'テストメア',
      sire_count: 1,
    }

    render(
      <HorseRegisterDialog
        open={true}
        onOpenChange={vi.fn()}
        catalogHorse={catalogHorse}
        owners={defaultOwners}
      />,
    )

    expect(screen.getByDisplayValue('2025105006')).toBeInTheDocument()
    expect(screen.getByDisplayValue('キズナの2025')).toBeInTheDocument()
    expect(screen.getByDisplayValue('キズナ')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テストメア')).toBeInTheDocument()
  })

  it('手動入力モードではフィールドが空になる', () => {
    render(
      <HorseRegisterDialog
        open={true}
        onOpenChange={vi.fn()}
        catalogHorse={null}
        owners={defaultOwners}
      />,
    )

    const horseIdInput = screen.getByPlaceholderText('2025105001')
    const nameInput = screen.getByPlaceholderText('キズナの2025')
    const sireInput = screen.getByPlaceholderText('キズナ')
    const mareInput = screen.getByPlaceholderText('テストメア')

    expect(horseIdInput).toHaveValue('')
    expect(nameInput).toHaveValue('')
    expect(sireInput).toHaveValue('')
    expect(mareInput).toHaveValue('')
  })

  it('バリデーションエラーが表示される', async () => {
    const user = userEvent.setup()

    render(
      <HorseRegisterDialog
        open={true}
        onOpenChange={vi.fn()}
        catalogHorse={null}
        owners={defaultOwners}
      />,
    )

    // Submit without filling in required fields
    const submitButton = screen.getByRole('button', { name: '登録' })
    await user.click(submitButton)

    await waitFor(() => {
      // At least one validation error should appear
      const errors = screen.queryAllByText(/入力してください|選択してください|以上/)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  it('オーナーラジオボタンが全員分表示される', () => {
    render(
      <HorseRegisterDialog
        open={true}
        onOpenChange={vi.fn()}
        catalogHorse={null}
        owners={defaultOwners}
      />,
    )

    expect(screen.getByText('オーナーA')).toBeInTheDocument()
    expect(screen.getByText('オーナーB')).toBeInTheDocument()
    expect(screen.getByText('オーナーC')).toBeInTheDocument()

    const radioButtons = screen.getAllByRole('radio')
    expect(radioButtons).toHaveLength(3)
  })

  it('キャンセルボタンを押すとonOpenChangeがfalseで呼ばれる', () => {
    const onOpenChange = vi.fn()

    render(
      <HorseRegisterDialog
        open={true}
        onOpenChange={onOpenChange}
        catalogHorse={null}
        owners={defaultOwners}
      />,
    )

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    fireEvent.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
