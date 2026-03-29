'use client'

import { Pencil, Trash2, Users } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { usePogStore, sortedOwners, ownerHorseCount } from '@/store/pogStore'
import type { Owner } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

type Props = {
  onEdit: (owner: Owner) => void
  onDelete: (owner: Owner) => void
}

export default function OwnerTable({ onEdit, onDelete }: Props) {
  const owners = usePogStore(useShallow(sortedOwners))
  const horseCounts = usePogStore(useShallow(ownerHorseCount))

  return (
    <Table>
      <TableHeader>
        {/* hover:bg-[var(--pog-green)] でデフォルトの hover 変色を抑制 */}
        <TableRow className="bg-[var(--pog-green)] hover:bg-[var(--pog-green)]">
          <TableHead className="text-white/80 font-medium">番号</TableHead>
          <TableHead className="text-white/80 font-medium">オーナー名</TableHead>
          <TableHead className="text-white/80 font-medium">指名数</TableHead>
          <TableHead className="text-white/80 font-medium">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {owners.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--pog-green)]/8 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-[var(--pog-green)]/40" />
              </div>
              <p className="text-sm text-muted-foreground">オーナーが登録されていません</p>
            </TableCell>
          </TableRow>
        ) : (
          owners.map((owner) => (
            <TableRow
              key={owner.id}
              className="hover:bg-[var(--pog-gold-subtle)] transition-colors"
            >
              <TableCell>{owner.no ?? '-'}</TableCell>
              <TableCell>{owner.name}</TableCell>
              <TableCell>{horseCounts[owner.id] ?? 0}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${owner.name}を編集`}
                    onClick={() => onEdit(owner)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${owner.name}を削除`}
                    onClick={() => onDelete(owner)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
