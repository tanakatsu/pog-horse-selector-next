'use client'

import { useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getTargetYear } from '@/lib/utils'
import { usePogStore } from '@/store/pogStore'
import type { Owner } from '@/types'

export function useOwners() {
  const setOwners = usePogStore((state) => state.setOwners)

  const fetchOwners = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('year', getTargetYear())
      .order('no', { ascending: true, nullsFirst: false })

    if (error) throw error
    setOwners((data ?? []) as Owner[])
  }, [setOwners])

  const createOwner = useCallback(
    async (data: { name: string; no: number | null }): Promise<void> => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('owners').insert({
        ...data,
        year: getTargetYear(),
        user_id: user.id,
      })
      if (error) throw error
      await fetchOwners()
    },
    [fetchOwners],
  )

  const updateOwner = useCallback(
    async (id: number, data: { name: string; no: number | null }): Promise<void> => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('owners')
        .update(data)
        .eq('id', id)
        .eq('year', getTargetYear())
      if (error) throw error
      await fetchOwners()
    },
    [fetchOwners],
  )

  const deleteOwner = useCallback(
    async (id: number): Promise<void> => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('owners')
        .delete()
        .eq('id', id)
        .eq('year', getTargetYear())
      if (error) throw error
      await fetchOwners()
    },
    [fetchOwners],
  )

  return { fetchOwners, createOwner, updateOwner, deleteOwner }
}
