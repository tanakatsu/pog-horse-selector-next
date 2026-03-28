'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
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
      setRootError(error.message)
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-xl font-medium">メールを送信しました</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            パスワードリセット用のメールを送信しました。メールのリンクからパスワードをリセットしてください。
          </p>
        </CardContent>
        <CardFooter className="text-sm">
          <Link href="/login" className="text-muted-foreground hover:underline">
            ログインに戻る
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h2 className="text-xl font-medium">パスワードをお忘れですか？</h2>
      </CardHeader>
      <CardContent>
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
              {form.formState.isSubmitting ? '送信中...' : 'リセットメールを送信'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-sm">
        <Link href="/login" className="text-muted-foreground hover:underline">
          ログインに戻る
        </Link>
      </CardFooter>
    </Card>
  )
}
