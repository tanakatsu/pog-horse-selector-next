'use client'

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
  mareName: string
  onConfirm: () => void
}

export default function ConflictAlertDialog({ open, onOpenChange, mareName, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>母馬の重複確認</DialogTitle>
          <DialogDescription>
            母馬「{mareName}」はすでに他の馬の母として指名されています。このまま登録しますか？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            続ける
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
