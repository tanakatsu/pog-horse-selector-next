'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useHorses } from '@/hooks/useHorses'
import { baseHorseSchema, type HorseFormInput } from '@/lib/validations/horse'
import { usePogStore, ownerHorseLastNo } from '@/store/pogStore'
import type { CatalogHorse, Owner } from '@/types'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogHorse: CatalogHorse | null
  owners: Owner[]
  /** Mare name the user explicitly confirmed despite being a duplicate (skips mare duplicate check) */
  confirmedMare?: string
}

export default function HorseRegisterDialog({
  open,
  onOpenChange,
  catalogHorse,
  owners,
  confirmedMare,
}: Props) {
  const { createHorse } = useHorses()

  // Use base schema (format/length only) in the resolver so it never goes stale.
  // Duplicate checks are performed in onSubmit against fresh store state.
  const form = useForm<HorseFormInput>({
    resolver: zodResolver(baseHorseSchema),
    defaultValues: {
      horse_id: '',
      name: '',
      sire: '',
      mare: '',
      owner_id: 0, // 0 is falsy → nothing selected; fails .positive() validation
    },
  })

  useEffect(() => {
    if (open) {
      if (catalogHorse) {
        form.reset({
          horse_id: catalogHorse.id,
          name: catalogHorse.name,
          sire: catalogHorse.sire,
          mare: catalogHorse.mare,
          owner_id: 0,
        })
      } else {
        form.reset({
          horse_id: '',
          name: '',
          sire: '',
          mare: '',
          owner_id: 0,
        })
      }
    }
  }, [open, catalogHorse, form])

  const onSubmit = async (data: HorseFormInput) => {
    try {
      // Read fresh state at submission time to avoid stale closures (C-1, C-2)
      const freshState = usePogStore.getState()
      const freshHorses = freshState.horses
      const freshLastNos = ownerHorseLastNo(freshState)

      // Duplicate name check
      if (freshHorses.some((h) => h.name === data.name)) {
        form.setError('name', { message: 'この馬名はすでに登録されています' })
        return
      }

      // Duplicate mare check — skip if user already confirmed the conflict
      if (data.mare !== confirmedMare && freshHorses.some((h) => h.mare === data.mare)) {
        form.setError('mare', { message: 'この母馬はすでに他の馬として指名されています' })
        return
      }

      const ownerId = Number(data.owner_id)
      const lastNo = freshLastNos[ownerId]
      const nextPoOrderNo = (lastNo ?? 0) + 1
      await createHorse({
        horse_id: data.horse_id === '' ? null : data.horse_id,
        name: data.name,
        sire: data.sire,
        mare: data.mare,
        owner_id: ownerId,
        po_order_no: nextPoOrderNo,
      })
      onOpenChange(false)
    } catch (err) {
      form.setError('root', {
        message: err instanceof Error ? err.message : '登録に失敗しました',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>馬を登録</DialogTitle>
          <DialogDescription className="sr-only">新しい馬を登録します</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="horse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>馬ID（任意）</FormLabel>
                  <FormControl>
                    <Input placeholder="2025105001" {...field} />
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
                    <Input placeholder="キズナの2025" {...field} />
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
                  <FormLabel>父馬</FormLabel>
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
                  <FormLabel>母馬</FormLabel>
                  <FormControl>
                    <Input placeholder="テストメア" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>オーナー</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(val)}
                      className="space-y-1"
                    >
                      {owners.map((owner) => (
                        <div key={owner.id} className="flex items-center gap-2">
                          <RadioGroupItem value={String(owner.id)} id={`owner-${owner.id}`} />
                          <Label htmlFor={`owner-${owner.id}`}>{owner.name}</Label>
                        </div>
                      ))}
                    </RadioGroup>
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
                {form.formState.isSubmitting ? '登録中...' : '登録'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
