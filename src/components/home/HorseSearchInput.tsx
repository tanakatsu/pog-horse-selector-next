'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePogStore } from '@/store/pogStore'
import type { CatalogHorse } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

type Props = {
  catalogue: CatalogHorse[]
  onSelect: (horse: CatalogHorse | null) => void
  selectedMares: string[]
  maxSuggestions?: number
}

export default function HorseSearchInput({
  catalogue,
  onSelect,
  selectedMares,
  maxSuggestions = 10,
}: Props) {
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

  const suggestions = useMemo(
    () =>
      query
        ? catalogue
            .filter((h) => h.mare.toLowerCase().startsWith(query.toLowerCase()))
            .slice(0, maxSuggestions)
        : [],
    [query, catalogue, maxSuggestions],
  )

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
      <Command shouldFilter={false} className="shadow-none bg-transparent">
        <CommandInput
          placeholder="母馬名で検索…"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleManualEntry}
                  onMouseDown={(e) => {
                    // Prevent input blur so the onBlur timer doesn't close the list before onClick fires
                    e.preventDefault()
                  }}
                >
                  手動で登録
                </Button>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {suggestions.map((horse) => {
                  const isSelected = selectedMares.includes(horse.mare)
                  return (
                    <CommandItem
                      key={horse.id}
                      value={horse.id}
                      onSelect={() => handleSelect(horse)}
                      aria-label={isSelected ? `${horse.mare} 指名済み` : horse.mare}
                      className={cn(isSelected && 'bg-muted/60 text-muted-foreground')}
                    >
                      <span className="flex-1">
                        {horse.mare}
                        <span className="ml-2 text-muted-foreground text-xs">{horse.name}</span>
                      </span>
                      {isSelected && (
                        <span className="text-xs text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 dark:bg-amber-900/30 dark:text-amber-400">
                          指名済み
                        </span>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
      {/* top-[13px]: CommandInput wrapper has p-1(4px) + Command p-1(4px) = 8px offset, InputGroup h-8(32px) center at 24px, text-xs ~18px line-height -> (24-18/2)≈15px */}
      <span className="absolute right-3 top-[15px] text-xs text-muted-foreground/60 tabular-nums whitespace-nowrap pointer-events-none">
        {catalogue.length}頭
      </span>
    </div>
  )
}
