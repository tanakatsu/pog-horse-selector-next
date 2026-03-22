'use client'

import { useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getTargetYear } from '@/lib/utils'
import { usePogStore } from '@/store/pogStore'
import type { Horse } from '@/types'

type HorseInput = Omit<Horse, 'id' | 'user_id' | 'year' | 'created_at'>

export function useHorses() {
  const setHorses = usePogStore((state) => state.setHorses)

  const fetchHorses = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('horses')
      .select('*')
      .eq('year', getTargetYear())
      .order('po_order_no', { ascending: true })

    if (error) throw error
    setHorses((data ?? []) as Horse[])
  }, [setHorses])

  const createHorse = useCallback(
    async (data: HorseInput): Promise<void> => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('horses').insert({
        ...data,
        year: getTargetYear(),
        user_id: user.id,
      })
      if (error) throw error
      await fetchHorses()
    },
    [fetchHorses],
  )

  const updateHorse = useCallback(
    async (id: number, data: HorseInput): Promise<void> => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('horses')
        .update(data)
        .eq('id', id)
        .eq('year', getTargetYear())
      if (error) throw error
      await fetchHorses()
    },
    [fetchHorses],
  )

  const deleteHorse = useCallback(
    async (id: number): Promise<void> => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('horses')
        .delete()
        .eq('id', id)
        .eq('year', getTargetYear())
      if (error) throw error
      await fetchHorses()
    },
    [fetchHorses],
  )

  return { fetchHorses, createHorse, updateHorse, deleteHorse }
}
