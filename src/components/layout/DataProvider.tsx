'use client'

import { useEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getTargetYear } from '@/lib/utils'
import { usePogStore } from '@/store/pogStore'
import type { Horse, Owner } from '@/types'

interface DataProviderProps {
  children: React.ReactNode
  initialOwners: Owner[]
  initialHorses: Horse[]
}

export default function DataProvider({
  children,
  initialOwners,
  initialHorses,
}: DataProviderProps) {
  const initialized = useRef(false)
  if (!initialized.current) {
    initialized.current = true
    usePogStore.getState().setOwners(initialOwners)
    usePogStore.getState().setHorses(initialHorses)
  }

  useEffect(() => {
    const supabase = getSupabaseClient()
    const year = getTargetYear()

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
