'use client'

import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { usePogStore } from '@/store/pogStore'
import type { CatalogHorse } from '@/types'
import rawCatalogue from '@/data/horse_catalogue.json'
import { getTargetYear } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const catalogue = rawCatalogue as CatalogHorse[]

type Props = {
  onSelect: (horse: CatalogHorse | null) => void
  selectedMares: string[]
  maxSuggestions?: number
}

export default function HorseSearchInput({ onSelect, selectedMares, maxSuggestions = 10 }: Props) {
  const owners = usePogStore((state) => state.owners)
  const loading = usePogStore((state) => state.loading)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up pending blur timer on unmount to avoid state updates on unmounted component
  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null) clearTimeout(blurTimerRef.current)
    }
  }, [])

  const isDisabled = owners.length === 0 || loading
  const targetYear = String(getTargetYear())
  const catalogueCount = catalogue.filter((h) => h.id.startsWith(targetYear)).length

  const suggestions = query
    ? catalogue
        .filter(
          (h) =>
            h.id.startsWith(targetYear) && h.mare.toLowerCase().startsWith(query.toLowerCase()),
        )
        .slice(0, maxSuggestions)
    : []

  const handleSelect = (horse: CatalogHorse) => {
    onSelect(horse)
    setQuery('')
    setOpen(false)
  }

  const handleManualEntry = () => {
    onSelect(null)
    setQuery('')
    setOpen(false)
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    setOpen(value.length > 0)
  }

  return (
    <div className="relative w-full max-w-md">
      <p className="text-xs text-muted-foreground mb-1">
        {targetYear}年度カタログ: {catalogueCount}頭
      </p>
      <Command shouldFilter={false} className="rounded-lg border shadow-none">
        <CommandInput
          placeholder="母馬名で検索..."
          value={query}
          onValueChange={handleInputChange}
          disabled={isDisabled}
          onFocus={() => {
            if (query.length > 0) setOpen(true)
          }}
          onBlur={() => {
            // Delay to allow click events on suggestions to fire before closing
            blurTimerRef.current = setTimeout(() => setOpen(false), 150)
          }}
        />
        {open && (
          <CommandList>
            {suggestions.length === 0 ? (
              <CommandEmpty>
                <p className="mb-2">見つかりません</p>
                <Button type="button" variant="outline" size="sm" onClick={handleManualEntry}>
                  手動で登録
                </Button>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {suggestions.map((horse) => (
                  <CommandItem
                    key={horse.id}
                    value={horse.id}
                    onSelect={() => handleSelect(horse)}
                    data-checked={selectedMares.includes(horse.mare) ? 'true' : undefined}
                  >
                    {selectedMares.includes(horse.mare) && (
                      <Check className="mr-1 size-4 shrink-0" aria-label="選択済み" />
                    )}
                    <span className="flex-1">
                      {horse.mare}
                      <span className="ml-2 text-muted-foreground text-xs">{horse.name}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  )
}
