'use client'

import { useEffect, useState } from 'react'
import { useOwners } from '@/hooks/useOwners'
import type { Owner } from '@/types'
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
  target: Owner | null
}

export default function OwnerDeleteDialog({ open, onOpenChange, target }: Props) {
  const { deleteOwner } = useOwners()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset error state when dialog is opened
  useEffect(() => {
    if (open) setError(null)
  }, [open])

  const handleDelete = async () => {
    if (!target) return
    setIsDeleting(true)
    setError(null)
    try {
      await deleteOwner(target.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  // Block closing while deletion is in progress
  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>オーナーを削除</DialogTitle>
          <DialogDescription>
            {target?.name} を削除します。関連する馬もすべて削除されます。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-[0.8rem] font-medium text-destructive" aria-live="polite">
            {error}
          </p>
        )}
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
