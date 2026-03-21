import { cn, getTargetYear } from '@/lib/utils'

describe('cn()', () => {
  it('単一クラスをそのまま返す', () => {
    expect(cn('text-sm')).toBe('text-sm')
  })

  it('複数クラスを結合する', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('Tailwind の競合クラスを後勝ちでマージする', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('falsy な値を無視する', () => {
    expect(cn('text-sm', false, undefined, null, '')).toBe('text-sm')
  })
})

describe('getTargetYear()', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('環境変数 NEXT_PUBLIC_TARGET_YEAR が設定されている場合はその値を number で返す', () => {
    vi.stubEnv('NEXT_PUBLIC_TARGET_YEAR', '2025')
    expect(getTargetYear()).toBe(2025)
  })

  it('環境変数 NEXT_PUBLIC_TARGET_YEAR が未設定（undefined）の場合は現在年度を返す', () => {
    vi.stubEnv('NEXT_PUBLIC_TARGET_YEAR', undefined as unknown as string)
    expect(getTargetYear()).toBe(new Date().getFullYear())
  })

  it('環境変数 NEXT_PUBLIC_TARGET_YEAR が空文字の場合は現在年度を返す', () => {
    vi.stubEnv('NEXT_PUBLIC_TARGET_YEAR', '')
    expect(getTargetYear()).toBe(new Date().getFullYear())
  })

  it('環境変数 NEXT_PUBLIC_TARGET_YEAR が非数値文字列の場合は現在年度を返す', () => {
    vi.stubEnv('NEXT_PUBLIC_TARGET_YEAR', 'abc')
    expect(getTargetYear()).toBe(new Date().getFullYear())
  })
})
