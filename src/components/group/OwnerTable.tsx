'use client'

import { Pencil, Trash2 } from 'lucide-react'
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
        <TableRow>
          <TableHead>番号</TableHead>
          <TableHead>オーナー名</TableHead>
          <TableHead>指名数</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {owners.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              オーナーが登録されていません
            </TableCell>
          </TableRow>
        ) : (
          owners.map((owner) => (
            <TableRow key={owner.id}>
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
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${owner.name}を削除`}
                    onClick={() => onDelete(owner)}
                  >
                    <Trash2 />
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
