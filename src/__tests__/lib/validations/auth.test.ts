import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth'

describe('loginSchema', () => {
  describe('正常系', () => {
    it('有効なメールアドレスとパスワードで通過する', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('異常系', () => {
    it('無効なメール形式はエラーになる', () => {
      const result = loginSchema.safeParse({
        email: 'notanemail',
        password: 'password123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const emailErrors = result.error.issues.filter((issue) => issue.path.includes('email'))
        expect(emailErrors.length).toBeGreaterThan(0)
      }
    })

    it('パスワードが5文字（短い）はエラーになる', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'pass',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const passwordErrors = result.error.issues.filter((issue) =>
          issue.path.includes('password'),
        )
        expect(passwordErrors.length).toBeGreaterThan(0)
      }
    })
  })
})

describe('signupSchema', () => {
  describe('正常系', () => {
    it('有効なメールアドレスとパスワード（一致）で通過する', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('異常系', () => {
    it('無効なメール形式はエラーになる', () => {
      const result = signupSchema.safeParse({
        email: 'notanemail',
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const emailErrors = result.error.issues.filter((issue) => issue.path.includes('email'))
        expect(emailErrors.length).toBeGreaterThan(0)
      }
    })

    it('パスワードが5文字（短い）はエラーになる', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'pass',
        confirmPassword: 'pass',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const passwordErrors = result.error.issues.filter((issue) =>
          issue.path.includes('password'),
        )
        expect(passwordErrors.length).toBeGreaterThan(0)
      }
    })

    it('パスワードが不一致はエラーになる', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const confirmErrors = result.error.issues.filter((issue) =>
          issue.path.includes('confirmPassword'),
        )
        expect(confirmErrors.length).toBeGreaterThan(0)
      }
    })
  })
})

describe('forgotPasswordSchema', () => {
  it('有効なメールアドレスで通過する', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('無効なメール形式はエラーになる', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'invalid' })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('パスワードが一致すれば通過する', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(true)
  })

  it('パスワードが不一致ならエラーになる', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpass123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmErrors = result.error.issues.filter((issue) =>
        issue.path.includes('confirmPassword'),
      )
      expect(confirmErrors.length).toBeGreaterThan(0)
    }
  })

  it('パスワードが6文字未満はエラーになる', () => {
    const result = resetPasswordSchema.safeParse({
      password: '12345',
      confirmPassword: '12345',
    })
    expect(result.success).toBe(false)
  })
})
