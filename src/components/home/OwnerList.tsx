'use client'

import Link from 'next/link'
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
          className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
        >
          <Link
            href={`/horselist/${encodeURIComponent(owner.name)}`}
            className="font-medium hover:underline truncate min-w-0"
          >
            {owner.no !== null && (
              <span className="mr-2 text-muted-foreground text-sm">#{owner.no}</span>
            )}
            {owner.name}
          </Link>
          <span className="text-sm text-muted-foreground">{horseCounts[owner.id] ?? 0} 頭</span>
        </li>
      ))}
    </ul>
  )
}
