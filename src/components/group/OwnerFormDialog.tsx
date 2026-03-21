'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useOwners } from '@/hooks/useOwners'
import { createOwnerSchema, type OwnerInput } from '@/lib/validations/owner'
import { usePogStore } from '@/store/pogStore'
import type { Owner } from '@/types'
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget: Owner | null
}

export default function OwnerFormDialog({ open, onOpenChange, editTarget }: Props) {
  const { createOwner, updateOwner } = useOwners()
  const owners = usePogStore((state) => state.owners)

  // Build dynamic schema with duplicate-name check; exclude the current owner when editing
  const schema = useMemo(
    () =>
      createOwnerSchema(
        owners.map((o) => o.name),
        editTarget?.name,
      ),
    [owners, editTarget?.name],
  )

  const form = useForm<OwnerInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', no: null },
  })

  useEffect(() => {
    if (open) {
      if (editTarget) {
        form.reset({ name: editTarget.name, no: editTarget.no })
      } else {
        form.reset({ name: '', no: null })
      }
    }
  }, [open, editTarget, form])

  const onSubmit = async (data: OwnerInput) => {
    try {
      if (editTarget) {
        await updateOwner(editTarget.id, data)
      } else {
        await createOwner(data)
      }
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
          <DialogTitle>{editTarget ? 'オーナーを編集' : 'オーナーを追加'}</DialogTitle>
          <DialogDescription className="sr-only">
            {editTarget ? 'オーナー情報を編集します' : '新しいオーナーを追加します'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>オーナー名</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>番号（任意）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          field.onChange(null)
                        } else {
                          const parsed = parseInt(e.target.value, 10)
                          field.onChange(isNaN(parsed) ? null : parsed)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-[0.8rem] font-medium text-destructive">
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
