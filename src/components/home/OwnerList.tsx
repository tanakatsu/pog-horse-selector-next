'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { usePogStore, sortedOwners, ownerHorseCount } from '@/store/pogStore'

export default function OwnerList() {
  const owners = usePogStore(useShallow(sortedOwners))
  const horseCounts = usePogStore(useShallow(ownerHorseCount))
  const loading = usePogStore((state) => state.loading)

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8" role="status">
        読み込み中…
      </div>
    )
  }

  if (owners.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">オーナーが登録されていません</div>
    )
  }

  return (
    <ul className="space-y-2">
      {owners.map((owner) => (
        <li
          key={owner.id}
          className="group relative flex items-center gap-3 rounded-xl border border-[var(--pog-green)]/10 bg-white px-4 py-3.5 hover:bg-[var(--pog-green)]/5 hover:border-[var(--pog-green)]/25 transition-all duration-150"
        >
          {/* overlay link: 行全体をクリック可能にする */}
          <Link
            href={`/horselist/${encodeURIComponent(owner.name)}`}
            className="absolute inset-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pog-green)]"
            aria-label={`${owner.name} (${horseCounts[owner.id] ?? 0}頭)`}
          />
          {owner.no !== null && (
            <span className="pointer-events-none relative flex-shrink-0 w-7 h-7 rounded-full bg-[var(--pog-gold-subtle)] border border-[var(--pog-gold)]/30 text-[var(--pog-green)] text-xs font-bold flex items-center justify-center tabular-nums">
              {owner.no}
            </span>
          )}
          <span className="pointer-events-none relative font-medium truncate min-w-0 flex-1">
            {owner.name}
          </span>
          <span className="pointer-events-none relative text-sm text-muted-foreground">
            {horseCounts[owner.id] ?? 0} 頭
          </span>
          <ChevronRight
            aria-hidden="true"
            className="pointer-events-none relative w-4 h-4 flex-shrink-0 text-[var(--pog-green)]/25 group-hover:text-[var(--pog-gold)] transition-colors"
          />
        </li>
      ))}
    </ul>
  )
}
