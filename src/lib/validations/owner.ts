import { z } from 'zod'

const baseOwnerSchema = z.object({
  name: z
    .string()
    .min(1, 'オーナー名を入力してください')
    .max(50, 'オーナー名は50文字以内で入力してください'),
  no: z.number().int().positive('番号は1以上の整数で入力してください').nullable(),
})

export type OwnerInput = z.infer<typeof baseOwnerSchema>

/**
 * 既存オーナー名との重複チェックを含む動的スキーマを生成する。
 * 編集時は自身の名前 (currentName) を除外リストから外す。
 */
export function createOwnerSchema(existingNames: string[], currentName?: string) {
  return baseOwnerSchema.refine(
    (data) => {
      const others = currentName ? existingNames.filter((n) => n !== currentName) : existingNames
      return !others.includes(data.name)
    },
    { message: 'このオーナー名はすでに使用されています', path: ['name'] },
  )
}
