import { describe, it, expect } from 'vitest'
import { createHorseSchema } from '@/lib/validations/horse'

// base schema with no existing data
const schema = createHorseSchema([], [])

const validBase = {
  horse_id: '2025105006',
  name: 'キズナの2025',
  sire: 'キズナ',
  mare: 'テストメア',
  owner_id: 1,
}

describe('createHorseSchema', () => {
  describe('horse_id', () => {
    it('有効な10桁のhorse_idで通過する', () => {
      const result = schema.safeParse({ ...validBase, horse_id: '2025105006' })
      expect(result.success).toBe(true)
    })

    it('horse_idが空文字で通過する', () => {
      const result = schema.safeParse({ ...validBase, horse_id: '' })
      expect(result.success).toBe(true)
    })

    it('horse_idが9桁はエラーになる', () => {
      const result = schema.safeParse({ ...validBase, horse_id: '202510500' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('horse_id'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })

    it('horse_idが11桁はエラーになる', () => {
      const result = schema.safeParse({ ...validBase, horse_id: '20251050060' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('horse_id'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })

    it('horse_idに数字以外が含まれるとエラーになる', () => {
      const result = schema.safeParse({ ...validBase, horse_id: '2025ABCDEF' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('horse_id'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })
  })

  describe('name', () => {
    it('馬名が1文字はエラーになる', () => {
      const result = schema.safeParse({ ...validBase, name: 'ア' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('name'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })

    it('馬名が2文字で通過する', () => {
      const result = schema.safeParse({ ...validBase, name: 'アア' })
      expect(result.success).toBe(true)
    })

    it('既存の馬名と重複するとエラーになる', () => {
      const schemaWithExisting = createHorseSchema(['キズナの2025'], [])
      const result = schemaWithExisting.safeParse({ ...validBase, name: 'キズナの2025' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('name'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })

    it('編集時に自身の馬名は重複エラーにならない', () => {
      const schemaWithSelf = createHorseSchema(['キズナの2025'], [], 'キズナの2025')
      const result = schemaWithSelf.safeParse({ ...validBase, name: 'キズナの2025' })
      expect(result.success).toBe(true)
    })
  })

  describe('mare', () => {
    it('母馬名が1文字はエラーになる', () => {
      const result = schema.safeParse({ ...validBase, mare: 'ア' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('mare'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })

    it('既存の母馬名と重複するとエラーになる', () => {
      const schemaWithExisting = createHorseSchema([], ['テストメア'])
      const result = schemaWithExisting.safeParse({ ...validBase, mare: 'テストメア' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('mare'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })

    it('編集時に自身の母馬名は重複エラーにならない', () => {
      const schemaWithSelf = createHorseSchema([], ['テストメア'], undefined, 'テストメア')
      const result = schemaWithSelf.safeParse({ ...validBase, mare: 'テストメア' })
      expect(result.success).toBe(true)
    })
  })

  describe('horse_id (undefined)', () => {
    it('horse_idがundefinedはエラーになる', () => {
      const { horse_id: _removed, ...rest } = validBase
      const result = schema.safeParse(rest)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('horse_id'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })
  })

  describe('sire', () => {
    it('父馬名が1文字はエラーになる', () => {
      const result = schema.safeParse({ ...validBase, sire: 'ア' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('sire'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })

    it('父馬名が2文字で通過する', () => {
      const result = schema.safeParse({ ...validBase, sire: 'アア' })
      expect(result.success).toBe(true)
    })
  })

  describe('owner_id', () => {
    it('owner_idが空文字はエラーになる', () => {
      const result = schema.safeParse({ ...validBase, owner_id: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter((i) => i.path.includes('owner_id'))
        expect(errors.length).toBeGreaterThan(0)
      }
    })

    it('owner_idが文字列の "1" はcoerceで通過する', () => {
      const result = schema.safeParse({ ...validBase, owner_id: '1' })
      expect(result.success).toBe(true)
    })

    it('owner_idが正の整数で通過する', () => {
      const result = schema.safeParse({ ...validBase, owner_id: 5 })
      expect(result.success).toBe(true)
    })
  })
})
