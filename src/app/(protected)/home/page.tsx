'use client'

import { useState, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePogStore, sortedOwners } from '@/store/pogStore'
import type { CatalogHorse } from '@/types'
import HorseSearchInput from '@/components/home/HorseSearchInput'
import OwnerList from '@/components/home/OwnerList'
import HorseRegisterDialog from '@/components/home/HorseRegisterDialog'
import ConflictAlertDialog from '@/components/home/ConflictAlertDialog'

export default function HomePage() {
  const owners = usePogStore(useShallow(sortedOwners))
  const horses = usePogStore((state) => state.horses)

  const [registerOpen, setRegisterOpen] = useState(false)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [selectedCatalogHorse, setSelectedCatalogHorse] = useState<CatalogHorse | null>(null)
  const [pendingCatalogHorse, setPendingCatalogHorse] = useState<CatalogHorse | null>(null)
  // Mare name explicitly confirmed through ConflictAlertDialog — skips mare duplicate check in dialog
  const [confirmedMare, setConfirmedMare] = useState<string | undefined>(undefined)

  // Memoize to avoid passing a new array reference on every render (H-1)
  const selectedMares = useMemo(() => horses.map((h) => h.mare), [horses])

  function handleSelectFromSearch(horse: CatalogHorse | null) {
    if (horse === null) {
      setSelectedCatalogHorse(null)
      setConfirmedMare(undefined)
      setRegisterOpen(true)
      return
    }
    if (selectedMares.includes(horse.mare)) {
      setPendingCatalogHorse(horse)
      setConflictOpen(true)
    } else {
      setSelectedCatalogHorse(horse)
      setConfirmedMare(undefined)
      setRegisterOpen(true)
    }
  }

  function handleConflictConfirm() {
    setConflictOpen(false)
    setSelectedCatalogHorse(pendingCatalogHorse)
    setConfirmedMare(pendingCatalogHorse?.mare)
    setPendingCatalogHorse(null)
    setRegisterOpen(true)
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">馬選択</h1>
      <div className="mb-6">
        <HorseSearchInput onSelect={handleSelectFromSearch} selectedMares={selectedMares} />
      </div>
      <OwnerList />
      <HorseRegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        catalogHorse={selectedCatalogHorse}
        owners={owners}
        confirmedMare={confirmedMare}
      />
      <ConflictAlertDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        mareName={pendingCatalogHorse?.mare ?? ''}
        onConfirm={handleConflictConfirm}
      />
    </div>
  )
}
