'use client'

import { memo, useState, useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Horse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

const PAGE_SIZE = 10

type Props = {
  horses: Horse[]
  totalHorseCount: number
  onEdit: (horse: Horse) => void
  onDelete: (horse: Horse) => void
}

const HorseTable = memo(function HorseTable({ horses, totalHorseCount, onEdit, onDelete }: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => [...horses].sort((a, b) => a.po_order_no - b.po_order_no), [horses])

  const filtered = useMemo(() => {
    const normalize = (s: string) => s.normalize('NFKC').toLowerCase()
    const q = normalize(query.trim())
    if (!q) return sorted
    return sorted.filter(
      (h) =>
        normalize(h.name).includes(q) ||
        normalize(h.sire).includes(q) ||
        normalize(h.mare).includes(q),
    )
  }, [sorted, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          全オーナー合計: <span className="font-semibold text-foreground">{totalHorseCount}頭</span>
        </p>
        <p className="text-sm text-muted-foreground">
          このオーナー: <span className="font-semibold text-foreground">{horses.length}頭</span>
        </p>
      </div>

      <Input
        placeholder="馬名・父・母で検索"
        value={query}
        onChange={handleQueryChange}
        aria-label="フリーワード検索"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>馬名</TableHead>
            <TableHead>父</TableHead>
            <TableHead>母</TableHead>
            <TableHead>NetkeibaID</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {query ? '検索結果がありません' : '馬が登録されていません'}
              </TableCell>
            </TableRow>
          ) : (
            paged.map((horse) => (
              <TableRow key={horse.id}>
                <TableCell>{horse.po_order_no}</TableCell>
                <TableCell>{horse.name}</TableCell>
                <TableCell>{horse.sire}</TableCell>
                <TableCell>{horse.mare}</TableCell>
                <TableCell>{horse.horse_id ?? '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${horse.name}を編集`}
                      onClick={() => onEdit(horse)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${horse.name}を削除`}
                      onClick={() => onDelete(horse)}
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

      {filtered.length > PAGE_SIZE && (
        <nav className="flex items-center justify-center gap-2" aria-label="ページネーション">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            前へ
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            次へ
          </Button>
        </nav>
      )}
    </div>
  )
})

export default HorseTable
