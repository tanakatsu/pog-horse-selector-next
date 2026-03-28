# React / Next.js パフォーマンス改善 Issues

vercel-react-best-practices による精査結果。#1は対応済み（commit 34ff1d5）、#2は対応済み、#3は対応済み（commit d181aa4）、#4は対応済み、#5は対応済み。

---

## ✅ #1 HorseSearchInput カタログフィルタリングの useMemo 化（対応済み）

`catalogueByYear` と `suggestions` を useMemo でメモ化。毎キーストロークの全カタログ走査を排除。

---

## ✅ #2 カタログ JSON のクライアントバンドル削減（対応済み）

**優先度: HIGH**
**ファイル:** `src/components/home/HorseSearchInput.tsx:6`
**ルール:** `bundle-dynamic-imports`

```tsx
import rawCatalogue from '@/data/horse_catalogue.json'  // ← クライアントバンドルに全量追加
```

カタログが数千頭規模の場合、初期 JS バンドルサイズに直接影響する。

**改善案:**
- Server Component でフィルタ済みデータを props 経由で渡す（推奨）
- または `next/dynamic` で遅延ロード

---

## ✅ #3 HorseEditDialog: schema 変更時の form resolver 不整合（対応済み）

**優先度: HIGH**
**ファイル:** `src/components/horselist/HorseEditDialog.tsx:44-63`
**ルール:** `rerender-memo`

```tsx
const schema = useMemo(
  () => createHorseSchema(existingNames, existingMares, target?.name, target?.mare),
  [existingNames, existingMares, target?.name, target?.mare],
)

const form = useForm<HorseFormInput>({ resolver: zodResolver(schema), ... })
// useForm は初期化時の resolver をキャプチャするため、
// Realtime 更新で schema が変わっても resolver が古いままになる可能性がある
```

ダイアログを開いている間に他ユーザーが馬を登録した場合、重複チェックが古いリストを参照する。

**改善案:**
- ダイアログを open 時のみスナップショット（`existingNames`/`existingMares`）を確定させる
- または `useEffect` で schema 変化時に `form.clearErrors()` を呼ぶ

---

## ✅ #4 HorseListClient: ハンドラ関数の毎レンダー再生成（対応済み）

**優先度: MEDIUM**
**ファイル:** `src/components/horselist/HorseListClient.tsx:30-38`
**ルール:** `rerender-no-inline-components`

```tsx
// Realtime 更新のたびに HorseTable へ新しい関数参照が渡る
const handleEdit = (horse: Horse) => { ... }
const handleDelete = (horse: Horse) => { ... }
const handleEditOpenChange = (open: boolean) => { ... }
const handleDeleteOpenChange = (open: boolean) => { ... }
```

HorseTable が `React.memo` でラップされていれば、関数参照が毎回変わることで再レンダーが発生する。

**改善案:** `useCallback` でラップする

```tsx
const handleEdit = useCallback((horse: Horse) => { ... }, [])
const handleDelete = useCallback((horse: Horse) => { ... }, [])
```

---

## ✅ #5 home/page.tsx: handleSelectFromSearch の毎レンダー再生成（対応済み）

**優先度: MEDIUM**
**ファイル:** `src/app/(protected)/home/page.tsx:24-37`
**ルール:** `rerender-functional-setstate`

```tsx
// useCallback なし → horses が Realtime 更新されるたびに新しい関数参照が HorseSearchInput へ渡る
function handleSelectFromSearch(horse: CatalogHorse | null) { ... }
```

**改善案:**

```tsx
const handleSelectFromSearch = useCallback((horse: CatalogHorse | null) => {
  // selectedMares は関数内で参照するため deps に含める
  ...
}, [selectedMares])
```

---

## ⬜ #6 DataProvider: 初期データを SSR でプリフェッチ

**優先度: MEDIUM（対応コスト: 大）**
**ファイル:** `src/components/layout/DataProvider.tsx:11-43`
**ルール:** `server-parallel-fetching`

現状は `useEffect` 内で初期フェッチしており、HTML→JS ロード→データフェッチのウォーターフォールが発生。

**改善案:** `(protected)/layout.tsx`（Server Component）で初期データを取得し `DataProvider` へ props として渡す。Realtime の差分更新は DataProvider が引き続き担当する。

```tsx
// (protected)/layout.tsx (Server Component)
const [ownersResult, horsesResult] = await Promise.all([
  supabase.from('owners').select('*').eq('year', year).order('no', ...),
  supabase.from('horses').select('*').eq('year', year).order('po_order_no', ...),
])

return (
  <DataProvider initialOwners={ownersResult.data} initialHorses={horsesResult.data}>
    ...
  </DataProvider>
)
```

注意: Supabase の auth.getUser() は既に layout.tsx で呼んでいるため、同一リクエスト内でクライアントを再利用できる。
