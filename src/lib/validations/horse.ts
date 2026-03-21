import { z } from 'zod'

export const baseHorseSchema = z.object({
  horse_id: z.string().refine((val) => val === '' || /^\d{10}$/.test(val), {
    message: '馬IDは10桁の数字で入力してください',
  }),
  name: z.string().min(2, '馬名は2文字以上で入力してください'),
  sire: z.string().min(2, '父馬名は2文字以上で入力してください'),
  mare: z.string().min(2, '母馬名は2文字以上で入力してください'),
  owner_id: z.coerce.number().int().positive('オーナーを選択してください'),
})

export type HorseFormInput = z.input<typeof baseHorseSchema>

/**
 * 既存馬名・母馬名との重複チェックを含む動的スキーマを生成する。
 * 編集時は自身のレコード (currentName / currentMare) を除外リストから外す。
 */
export function createHorseSchema(
  existingNames: string[],
  existingMares: string[],
  currentName?: string,
  currentMare?: string,
) {
  return baseHorseSchema
    .refine(
      (data) => {
        const others = currentName ? existingNames.filter((n) => n !== currentName) : existingNames
        return !others.includes(data.name)
      },
      { message: 'この馬名はすでに登録されています', path: ['name'] },
    )
    .refine(
      (data) => {
        const others = currentMare ? existingMares.filter((m) => m !== currentMare) : existingMares
        return !others.includes(data.mare)
      },
      { message: 'この母馬はすでに他の馬として指名されています', path: ['mare'] },
    )
}
