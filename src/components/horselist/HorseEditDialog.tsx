'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useHorses } from '@/hooks/useHorses'
import { createHorseSchema, type HorseFormInput } from '@/lib/validations/horse'
import { usePogStore } from '@/store/pogStore'
import type { Horse } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { getCatalogueYear } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: Horse | null
}

export default function HorseEditDialog({ open, onOpenChange, target }: Props) {
  const { updateHorse } = useHorses()
  const owners = usePogStore((state) => state.owners)

  const [prevOpen, setPrevOpen] = useState(false)
  const [snapshotNames, setSnapshotNames] = useState<string[]>([])
  const [snapshotMares, setSnapshotMares] = useState<string[]>([])

  // open が false→true に変わった瞬間のみスナップショットを確定する。
  // ・useEffect ではなくレンダー中に setState することで余分な commit を防ぐ
  //   （React 公式の "adjusting state when a prop changes" パターン）。
  // ・getState() で一度だけ読み取り、購読しないことで Realtime 更新の影響を受けない。
  // ・RHF v7 は _options.current.resolver を毎レンダーで更新するため、
  //   schema が変わると次の submit 時には必ず最新のスキーマで検証される。
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      const horses = usePogStore.getState().horses
      setSnapshotNames(horses.map((h) => h.name))
      setSnapshotMares(horses.map((h) => h.mare))
    }
  }

  const schema = useMemo(
    () => createHorseSchema(snapshotNames, snapshotMares, target?.name, target?.mare),
    [snapshotNames, snapshotMares, target?.name, target?.mare],
  )

  const ownerName = useMemo(() => {
    if (!target) return ''
    return owners.find((o) => o.id === target.owner_id)?.name ?? String(target.owner_id)
  }, [owners, target])

  const form = useForm<HorseFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      horse_id: '',
      name: '',
      sire: '',
      mare: '',
      owner_id: 0,
    },
  })

  useEffect(() => {
    if (open && target) {
      form.reset({
        horse_id: target.horse_id ?? '',
        name: target.name,
        sire: target.sire,
        mare: target.mare,
        owner_id: target.owner_id,
      })
    }
  }, [open, target, form])

  const onSubmit = async (data: HorseFormInput) => {
    if (!target) return
    try {
      await updateHorse(target.id, {
        horse_id: data.horse_id || null,
        name: data.name,
        sire: data.sire,
        mare: data.mare,
        owner_id: target.owner_id,
        po_order_no: target.po_order_no,
      })
      onOpenChange(false)
    } catch (err) {
      form.setError('root', {
        message: err instanceof Error ? err.message : '保存に失敗しました',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>馬情報を編集</DialogTitle>
          <DialogDescription className="sr-only">馬の情報を編集します</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">オーナー</p>
              <p className="text-sm text-muted-foreground">{ownerName}</p>
            </div>

            <FormField
              control={form.control}
              name="horse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NetkeibaID（任意）</FormLabel>
                  <FormControl>
                    <Input placeholder={`${getCatalogueYear()}105001`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>馬名</FormLabel>
                  <FormControl>
                    <Input placeholder={`キズナの${getCatalogueYear()}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>父</FormLabel>
                  <FormControl>
                    <Input placeholder="キズナ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>母</FormLabel>
                  <FormControl>
                    <Input placeholder="テストメア" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-[0.8rem] font-medium text-destructive" aria-live="polite">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
