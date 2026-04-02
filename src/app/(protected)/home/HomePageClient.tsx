'use client'

import { useState, useMemo, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePogStore, sortedOwners } from '@/store/pogStore'
import type { CatalogHorse } from '@/types'
import rawCatalogue from '@/data/horse_catalogue.json'
import { getCatalogueYear } from '@/lib/utils'
import HorseSearchInput from '@/components/home/HorseSearchInput'
import OwnerList from '@/components/home/OwnerList'
import HorseRegisterDialog from '@/components/home/HorseRegisterDialog'
import ConflictAlertDialog from '@/components/home/ConflictAlertDialog'

const catalogueYear = String(getCatalogueYear())
const catalogue = (rawCatalogue as CatalogHorse[]).filter((h) => h.id.startsWith(catalogueYear))

export default function HomePageClient() {
  const owners = usePogStore(useShallow(sortedOwners))
  const horses = usePogStore((state) => state.horses)

  const [registerOpen, setRegisterOpen] = useState(false)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [selectedCatalogHorse, setSelectedCatalogHorse] = useState<CatalogHorse | null>(null)
  const [conflictMareName, setConflictMareName] = useState('')

  // Memoize to avoid passing a new array reference on every render (H-1)
  const selectedMares = useMemo(() => horses.map((h) => h.mare), [horses])

  const handleSelectFromSearch = useCallback(
    (horse: CatalogHorse | null) => {
      if (horse === null) {
        setSelectedCatalogHorse(null)
        setRegisterOpen(true)
        return
      }
      if (selectedMares.includes(horse.mare)) {
        setConflictMareName(horse.mare)
        setConflictOpen(true)
      } else {
        setSelectedCatalogHorse(horse)
        setRegisterOpen(true)
      }
    },
    [selectedMares],
  )

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-balance">馬選択</h1>
      <div className="mb-6">
        <HorseSearchInput
          catalogue={catalogue}
          onSelect={handleSelectFromSearch}
          selectedMares={selectedMares}
        />
      </div>
      <OwnerList />
      <HorseRegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        catalogHorse={selectedCatalogHorse}
        owners={owners}
      />
      <ConflictAlertDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        mareName={conflictMareName}
      />
    </div>
  )
}
