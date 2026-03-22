'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mareName: string
}

export default function ConflictAlertDialog({ open, onOpenChange, mareName }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>母馬の重複エラー</AlertDialogTitle>
          <AlertDialogDescription>
            母馬「{mareName}」はすでに他の馬の母として指名されているので登録できません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
