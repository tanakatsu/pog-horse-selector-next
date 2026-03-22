import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockGetUser = vi.fn()
const mockSetOwners = vi.fn()

// thenable なチェーンオブジェクトを生成する
function makeChain(resolveValue: unknown) {
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain['then'] = (onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve(resolveValue).then(onFulfilled)
  chain['catch'] = (onRejected: (e: unknown) => unknown) =>
    Promise.resolve(resolveValue).catch(onRejected)
  return chain
}

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/lib/utils', () => ({
  getTargetYear: () => 2026,
}))

vi.mock('@/store/pogStore', () => ({
  usePogStore: (selector: (s: { setOwners: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ setOwners: mockSetOwners }),
}))

import { useOwners } from '@/hooks/useOwners'

describe('useOwners', () => {
  let fetchChain: ReturnType<typeof makeChain>
  let mutateChain: ReturnType<typeof makeChain>

  beforeEach(() => {
    vi.clearAllMocks()
    fetchChain = makeChain({ data: [], error: null })
    mutateChain = makeChain({ error: null })
  })

  describe('createOwner', () => {
    it('user_id・year を含めて INSERT し fetchOwners を呼ぶ', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-uuid-123' } } })
      mockFrom.mockReturnValueOnce(mutateChain).mockReturnValue(fetchChain)

      const { result } = renderHook(() => useOwners())

      await act(async () => {
        await result.current.createOwner({ name: '山田太郎', no: 1 })
      })

      expect(mutateChain['insert']).toHaveBeenCalledWith({
        name: '山田太郎',
        no: 1,
        year: 2026,
        user_id: 'user-uuid-123',
      })
      expect(fetchChain['select']).toHaveBeenCalledWith('*')
    })

    it('未認証の場合は例外をスローする', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const { result } = renderHook(() => useOwners())

      await expect(
        act(async () => {
          await result.current.createOwner({ name: '山田太郎', no: null })
        }),
      ).rejects.toThrow('Not authenticated')
    })

    it('Supabase がエラーを返した場合は例外をスローする', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-uuid-123' } } })
      mockFrom.mockReturnValueOnce(makeChain({ error: { message: 'DB error' } }))

      const { result } = renderHook(() => useOwners())

      await expect(
        act(async () => {
          await result.current.createOwner({ name: '山田太郎', no: null })
        }),
      ).rejects.toEqual({ message: 'DB error' })
    })
  })

  describe('updateOwner', () => {
    it('year・id で絞り込んで UPDATE し fetchOwners を呼ぶ', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-uuid-123' } } })
      mockFrom.mockReturnValueOnce(mutateChain).mockReturnValue(fetchChain)

      const { result } = renderHook(() => useOwners())

      await act(async () => {
        await result.current.updateOwner(42, { name: '鈴木花子', no: 2 })
      })

      expect(mutateChain['update']).toHaveBeenCalledWith({ name: '鈴木花子', no: 2 })
      expect(mutateChain['eq']).toHaveBeenCalledWith('id', 42)
      expect(mutateChain['eq']).toHaveBeenCalledWith('year', 2026)
      expect(fetchChain['select']).toHaveBeenCalledWith('*')
    })

    it('未認証の場合は例外をスローする', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const { result } = renderHook(() => useOwners())

      await expect(
        act(async () => {
          await result.current.updateOwner(42, { name: '鈴木花子', no: 2 })
        }),
      ).rejects.toThrow('Not authenticated')
    })

    it('Supabase がエラーを返した場合は例外をスローする', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-uuid-123' } } })
      mockFrom.mockReturnValueOnce(makeChain({ error: { message: 'update error' } }))

      const { result } = renderHook(() => useOwners())

      await expect(
        act(async () => {
          await result.current.updateOwner(42, { name: '鈴木花子', no: 2 })
        }),
      ).rejects.toEqual({ message: 'update error' })
    })
  })

  describe('deleteOwner', () => {
    it('year・id で絞り込んで DELETE し fetchOwners を呼ぶ', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-uuid-123' } } })
      mockFrom.mockReturnValueOnce(mutateChain).mockReturnValue(fetchChain)

      const { result } = renderHook(() => useOwners())

      await act(async () => {
        await result.current.deleteOwner(42)
      })

      expect(mutateChain['delete']).toHaveBeenCalled()
      expect(mutateChain['eq']).toHaveBeenCalledWith('id', 42)
      expect(mutateChain['eq']).toHaveBeenCalledWith('year', 2026)
      expect(fetchChain['select']).toHaveBeenCalledWith('*')
    })

    it('未認証の場合は例外をスローする', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const { result } = renderHook(() => useOwners())

      await expect(
        act(async () => {
          await result.current.deleteOwner(42)
        }),
      ).rejects.toThrow('Not authenticated')
    })

    it('Supabase がエラーを返した場合は例外をスローする', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-uuid-123' } } })
      mockFrom.mockReturnValueOnce(makeChain({ error: { message: 'delete error' } }))

      const { result } = renderHook(() => useOwners())

      await expect(
        act(async () => {
          await result.current.deleteOwner(42)
        }),
      ).rejects.toEqual({ message: 'delete error' })
    })
  })

  describe('fetchOwners', () => {
    it('year で絞り込んで SELECT し no 昇順で並べ setOwners を呼ぶ', async () => {
      const data = [{ id: 1, name: 'A' }]
      fetchChain = makeChain({ data, error: null })
      mockFrom.mockReturnValue(fetchChain)

      const { result } = renderHook(() => useOwners())

      await act(async () => {
        await result.current.fetchOwners()
      })

      expect(fetchChain['select']).toHaveBeenCalledWith('*')
      expect(fetchChain['eq']).toHaveBeenCalledWith('year', 2026)
      expect(fetchChain['order']).toHaveBeenCalledWith('no', { ascending: true, nullsFirst: false })
      expect(mockSetOwners).toHaveBeenCalledWith(data)
    })

    it('Supabase がエラーを返した場合は例外をスローする', async () => {
      mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fetch error' } }))

      const { result } = renderHook(() => useOwners())

      await expect(
        act(async () => {
          await result.current.fetchOwners()
        }),
      ).rejects.toEqual({ message: 'fetch error' })
    })
  })
})
