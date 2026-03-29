'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
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

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setRootError(null)
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: window.location.origin + '/auth/callback?next=/reset-password',
    })
    if (error) {
      setRootError(getAuthErrorMessage(error))
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen w-full grid lg:grid-cols-2">
        <BrandPanel />
        <div className="flex items-center justify-center bg-[var(--pog-cream)] p-8">
          <div className="w-full max-w-sm">
            <h1 className="font-serif text-2xl text-[var(--pog-green)] mb-4">
              メールを送信しました
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              パスワードリセット用のメールを送信しました。メールのリンクからパスワードをリセットしてください。
            </p>
            <Link href="/login" className="text-sm text-muted-foreground hover:underline">
              ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center bg-[var(--pog-cream)] p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-2xl text-[var(--pog-green)] mb-8">
            パスワードをお忘れですか？
          </h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        autoComplete="email"
                        spellCheck={false}
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
                {form.formState.isSubmitting ? '送信中…' : 'リセットメールを送信'}
              </Button>
            </form>
          </Form>
          <div className="mt-6">
            <Link href="/login" className="text-sm text-muted-foreground hover:underline">
              ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
