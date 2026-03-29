'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput, getAuthErrorMessage } from '@/lib/validations/auth'
import { APP_TITLE } from '@/lib/constants'
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

export default function LoginPage() {
  const router = useRouter()
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginInput) => {
    setRootError(null)
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
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
          <p className="lg:hidden text-xs font-semibold tracking-widest text-[var(--pog-green)] uppercase mb-6">
            {APP_TITLE}
          </p>
          <h1 className="font-serif text-2xl text-[var(--pog-green)] mb-8">ログイン</h1>
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
                        autoComplete="current-password"
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
                {form.formState.isSubmitting ? 'ログイン中…' : 'ログイン'}
              </Button>
            </form>
          </Form>
          <div className="flex flex-col gap-2 text-sm mt-6">
            <Link href="/forgot-password" className="text-muted-foreground hover:underline">
              パスワードをお忘れですか？
            </Link>
            <p className="text-muted-foreground">
              アカウントをお持ちでない方は{' '}
              <Link href="/signup" className="font-medium hover:underline">
                サインアップ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
