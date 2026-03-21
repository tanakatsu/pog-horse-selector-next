import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(6, 'パスワードは6文字以上で入力してください')
  .max(72, 'パスワードは72文字以内で入力してください')

export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: passwordSchema,
})

export const signupSchema = z
  .object({
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/** Supabaseの認証エラーをユーザー向けの汎用メッセージに変換する（ユーザー列挙攻撃防止） */
export function getAuthErrorMessage(error: { message: string }): string {
  if (
    error.message.includes('Invalid login credentials') ||
    error.message.includes('invalid_credentials')
  ) {
    return 'メールアドレスまたはパスワードが正しくありません'
  }
  if (error.message.includes('Email not confirmed')) {
    return 'メールアドレスの確認が完了していません。確認メールをご確認ください'
  }
  if (error.message.includes('User already registered')) {
    return 'このメールアドレスはすでに登録されています'
  }
  return '認証エラーが発生しました。しばらくしてから再度お試しください'
}
