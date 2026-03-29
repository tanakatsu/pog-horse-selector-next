'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  resetPasswordSchema,
  type ResetPasswordInput,
  getAuthErrorMessage,
} from '@/lib/validations/auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import BrandPanel from '@/components/auth/BrandPanel'
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    setRootError(null)
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setRootError(getAuthErrorMessage(error))
      return
    }
    router.push('/home')
    router.refresh()
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <BrandPanel />

      {/* 右: フォームエリア */}
      <div className="flex items-center justify-center bg-[var(--pog-cream)] p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-2xl text-[var(--pog-green)] mb-8">パスワードをリセット</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新しいパスワード</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="6文字以上"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>パスワード（確認）</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="パスワードを再入力"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {rootError && (
                <p className="text-sm font-medium text-destructive" aria-live="polite">
                  {rootError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? '更新中…' : 'パスワードを更新'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
