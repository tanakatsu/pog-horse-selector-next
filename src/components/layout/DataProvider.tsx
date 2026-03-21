'use client'

import { useEffect } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getTargetYear } from '@/lib/utils'
import { usePogStore } from '@/store/pogStore'
import type { Horse, Owner } from '@/types'

export default function DataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = getSupabaseClient()
    const year = getTargetYear()

    const init = async () => {
      usePogStore.getState().setLoading(true)
      try {
        const [ownersResult, horsesResult] = await Promise.all([
          supabase
            .from('owners')
            .select('*')
            .eq('year', year)
            .order('no', { ascending: true, nullsFirst: false }),
          supabase
            .from('horses')
            .select('*')
            .eq('year', year)
            .order('po_order_no', { ascending: true }),
        ])
        if (ownersResult.error) throw ownersResult.error
        if (horsesResult.error) throw horsesResult.error
        usePogStore.getState().setOwners((ownersResult.data ?? []) as Owner[])
        usePogStore.getState().setHorses((horsesResult.data ?? []) as Horse[])
      } catch (err) {
        usePogStore
          .getState()
          .setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      } finally {
        usePogStore.getState().setLoading(false)
      }
    }

    void init()

    const handleOwnerChange = (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => {
      const store = usePogStore.getState()
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const rec = payload.new as Record<string, unknown>
        // Defense-in-depth: confirm year matches (Realtime filter already restricts, but double-check)
        if (typeof rec['year'] !== 'number' || rec['year'] !== year) return
        if (payload.eventType === 'INSERT') {
          store.addOwner(rec as unknown as Owner)
        } else {
          store.updateOwner(rec as unknown as Owner)
        }
      } else if (payload.eventType === 'DELETE') {
        const id = (payload.old as Record<string, unknown>)['id']
        if (typeof id === 'number') store.removeOwner(id)
      }
    }

    const handleHorseChange = (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => {
      const store = usePogStore.getState()
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const rec = payload.new as Record<string, unknown>
        if (typeof rec['year'] !== 'number' || rec['year'] !== year) return
        if (payload.eventType === 'INSERT') {
          store.addHorse(rec as unknown as Horse)
        } else {
          store.updateHorse(rec as unknown as Horse)
        }
      } else if (payload.eventType === 'DELETE') {
        const id = (payload.old as Record<string, unknown>)['id']
        if (typeof id === 'number') store.removeHorse(id)
      }
    }

    const ownersChannel = supabase
      .channel('owners-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'owners', filter: `year=eq.${year}` },
        handleOwnerChange,
      )
      .subscribe()

    const horsesChannel = supabase
      .channel('horses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'horses', filter: `year=eq.${year}` },
        handleHorseChange,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(ownersChannel)
      void supabase.removeChannel(horsesChannel)
    }
  }, [])

  return <>{children}</>
}
