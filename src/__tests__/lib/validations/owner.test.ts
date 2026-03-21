import { describe, it, expect } from 'vitest'
import { createOwnerSchema } from '@/lib/validations/owner'

// Helper: schema with no existing owners (base case)
const schema = createOwnerSchema([])

describe('createOwnerSchema', () => {
  describe('正常系', () => {
    it('有効なオーナー名で通過する', () => {
      const result = schema.safeParse({ name: '山田太郎', no: null })
      expect(result.success).toBe(true)
    })

    it('番号あり (no=1) で通過する', () => {
      const result = schema.safeParse({ name: '山田太郎', no: 1 })
      expect(result.success).toBe(true)
    })

    it('編集時に自身の名前は重複エラーにならない', () => {
      const editSchema = createOwnerSchema(['山田太郎'], '山田太郎')
      const result = editSchema.safeParse({ name: '山田太郎', no: null })
      expect(result.success).toBe(true)
    })
  })

  describe('異常系', () => {
    it('オーナー名が空はエラーになる', () => {
      const result = schema.safeParse({ name: '', no: null })
      expect(result.success).toBe(false)
      if (!result.success) {
        const nameErrors = result.error.issues.filter((issue) => issue.path.includes('name'))
        expect(nameErrors.length).toBeGreaterThan(0)
      }
    })

    it('既存オーナー名と重複はエラーになる', () => {
      const schemaWithExisting = createOwnerSchema(['山田太郎'])
      const result = schemaWithExisting.safeParse({ name: '山田太郎', no: null })
      expect(result.success).toBe(false)
      if (!result.success) {
        const nameErrors = result.error.issues.filter((issue) => issue.path.includes('name'))
        expect(nameErrors.length).toBeGreaterThan(0)
      }
    })
  })
})
