'use client'

import { useEffect, useState } from 'react'
import { useHorses } from '@/hooks/useHorses'
import type { Horse } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: Horse | null
}

export default function HorseDeleteDialog({ open, onOpenChange, target }: Props) {
  const { deleteHorse } = useHorses()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  const handleDelete = async () => {
    if (!target) return
    setIsDeleting(true)
    setError(null)
    try {
      await deleteHorse(target.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>馬を削除</DialogTitle>
          <DialogDescription>
            {target?.name} を削除します。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-[0.8rem] font-medium text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={handleDelete}>
            削除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
