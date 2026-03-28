'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupInput, getAuthErrorMessage } from '@/lib/validations/auth'
import { APP_TITLE } from '@/lib/constants'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
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

export default function SignupPage() {
  const router = useRouter()
  const [rootError, setRootError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: SignupInput) => {
    setRootError(null)
    const supabase = getSupabaseClient()
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setRootError(getAuthErrorMessage(error))
      return
    }
    if (signUpData.session) {
      router.push('/home')
      router.refresh()
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
            {APP_TITLE}
          </p>
          <CardTitle className="text-xl font-medium">確認メールを送信しました</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ご登録のメールアドレスに確認メールを送信しました。
            メール内のリンクをクリックして登録を完了してください。
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
        <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          {APP_TITLE}
        </p>
        <CardTitle className="text-xl font-medium">アカウント作成</CardTitle>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード</FormLabel>
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
              {form.formState.isSubmitting ? '登録中...' : 'アカウントを作成'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-sm">
        <p className="text-muted-foreground">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="font-medium hover:underline">
            ログイン
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
