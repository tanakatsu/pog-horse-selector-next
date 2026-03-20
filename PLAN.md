# POG馬選択Webアプリ クローン - 実装計画

## 1. プロジェクトセットアップ

### 1-1. Next.jsプロジェクト作成

```bash
npx create-next-app@latest pog-horse-selector-next \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-turbo \
  --yes

cd pog-horse-selector-next
```

### 1-2. 依存パッケージインストール

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input label card dialog table \
  form radio-group dropdown-menu alert badge popover command

# フォームバリデーション
npm install react-hook-form zod @hookform/resolvers

# 状態管理
npm install zustand

# CSV生成
npm install papaparse
npm install -D @types/papaparse

# Linter / Formatter / 型チェック
npm install -D \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-react-hooks \
  prettier \
  eslint-config-prettier
```

### 1-3. 環境変数

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
NEXT_PUBLIC_TARGET_YEAR=2025
```

---

## 2. ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx
│   ├── (auth)/                         # 認証画面グループ（AppBar不要）
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (protected)/                    # 認証必須画面グループ
│   │   ├── layout.tsx                  # AppBar + 認証チェック + DataProvider
│   │   ├── home/page.tsx
│   │   ├── horselist/[owner_name]/page.tsx
│   │   ├── group/page.tsx
│   │   └── download/page.tsx
│   └── auth/callback/route.ts          # Supabase Auth コールバック処理
│
├── components/
│   ├── layout/
│   │   ├── AppBar.tsx
│   │   └── DataProvider.tsx            # Realtimeデータ購読（Client Component）
│   ├── home/
│   │   ├── HorseSearchInput.tsx        # 母名オートコンプリート
│   │   ├── OwnerList.tsx               # オーナー一覧（指名数表示）
│   │   ├── HorseRegisterDialog.tsx     # 馬登録ダイアログ
│   │   └── ConflictAlertDialog.tsx     # 重複警告ダイアログ
│   ├── group/
│   │   ├── OwnerTable.tsx
│   │   ├── OwnerFormDialog.tsx
│   │   └── OwnerDeleteDialog.tsx
│   ├── horselist/
│   │   ├── HorseTable.tsx
│   │   ├── HorseEditDialog.tsx
│   │   └── HorseDeleteDialog.tsx
│   └── download/
│       └── CsvDownloadButton.tsx
│
├── hooks/
│   ├── useOwners.ts                    # オーナーCRUD + Realtime購読
│   └── useHorses.ts                    # 馬CRUD + Realtime購読
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # ブラウザ用クライアント
│   │   └── server.ts                   # サーバー用クライアント
│   ├── validations/
│   │   ├── auth.ts
│   │   ├── owner.ts
│   │   └── horse.ts
│   └── utils.ts                        # cn(), getTargetYear() 等
│
├── store/
│   └── pogStore.ts                     # Zustandストア
│
├── types/
│   └── index.ts                        # Owner, Horse, CatalogHorse 型定義
│
├── data/
│   └── horse_catalogue.json            # 馬カタログ静的ファイル
│
└── middleware.ts                       # 保護ルートのリダイレクト
```

---

## 3. Supabaseセットアップ

### 3-1. テーブル定義SQL

```sql
-- owners テーブル
CREATE TABLE public.owners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year        INTEGER NOT NULL,
  name        TEXT NOT NULL,
  no          INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- horses テーブル
CREATE TABLE public.horses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year        INTEGER NOT NULL,
  horse_id    TEXT,                     -- Netkeiba ID (10桁)
  name        TEXT NOT NULL,
  sire        TEXT NOT NULL,
  mare        TEXT NOT NULL,
  po_name     TEXT NOT NULL,            -- 指名者名
  po_order_no INTEGER NOT NULL,         -- 指名順番
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- インデックス
CREATE INDEX idx_owners_user_year ON public.owners(user_id, year);
CREATE INDEX idx_horses_user_year ON public.horses(user_id, year);
CREATE INDEX idx_horses_po_name   ON public.horses(user_id, year, po_name);
```

### 3-2. RLSポリシー

```sql
-- owners
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_select" ON public.owners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners_insert" ON public.owners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners_update" ON public.owners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owners_delete" ON public.owners FOR DELETE USING (auth.uid() = user_id);

-- horses
ALTER TABLE public.horses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "horses_select" ON public.horses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "horses_insert" ON public.horses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "horses_update" ON public.horses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "horses_delete" ON public.horses FOR DELETE USING (auth.uid() = user_id);
```

---

## 4. 実装フェーズ

### Phase 1: 基盤セットアップ

#### コード品質ツールの設定
- **`tsconfig.json`**: `"strict": true`, `"noUncheckedIndexedAccess": true` を追加
- **`.eslintrc.json`**: 以下の構成で設定
  ```json
  {
    "extends": [
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended",
      "prettier"
    ],
    "plugins": ["@typescript-eslint", "react-hooks"],
    "rules": {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error"
    }
  }
  ```
- **`.prettierrc`**: 以下の構成で設定
  ```json
  {
    "semi": false,
    "singleQuote": true,
    "trailingComma": "all",
    "printWidth": 100
  }
  ```
- **`package.json` scripts** に以下を追加
  ```json
  "type-check": "tsc --noEmit",
  "lint": "eslint . --ext .ts,.tsx",
  "lint:fix": "eslint . --ext .ts,.tsx --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
  ```
#### アプリ基盤
- `src/lib/supabase/client.ts` - ブラウザ用クライアント（`createBrowserClient`）
- `src/lib/supabase/server.ts` - サーバー用クライアント（`createServerClient` + cookies）
- `src/middleware.ts` - セッションリフレッシュ + 保護ルートリダイレクト
- `src/types/index.ts` - Owner, Horse, CatalogHorse 型定義
- `src/lib/utils.ts` - `getTargetYear()` ユーティリティ
- `src/app/layout.tsx`, `(auth)/layout.tsx`, `(protected)/layout.tsx` の骨格

### Phase 2: 認証機能
- `src/lib/validations/auth.ts` - Zodスキーマ
- `/login`, `/signup`, `/forgot-password`, `/reset-password` の各ページ
- `src/app/auth/callback/route.ts` - token交換 + `/reset-password` へリダイレクト
- Supabase Dashboard で Reset Password メールのリダイレクトURL設定

### Phase 3: データ層
- `src/store/pogStore.ts` - Zustandストア（owners, horses, actions, selectors）
- `src/hooks/useOwners.ts` - Supabase CRUD + Realtime購読
- `src/hooks/useHorses.ts` - 同上
- `src/components/layout/DataProvider.tsx` - 保護画面全体でデータ共有

### Phase 4: オーナー管理画面 `/group`
- `src/lib/validations/owner.ts`
- `OwnerTable.tsx`, `OwnerFormDialog.tsx`, `OwnerDeleteDialog.tsx`
- `src/app/(protected)/group/page.tsx`

### Phase 5: 馬選択画面 `/home`
- `src/lib/validations/horse.ts` - 重複チェック含む動的Zodスキーマ
- `HorseSearchInput.tsx` - Popover + Command（shadcn Comboboxパターン）
- `OwnerList.tsx`, `HorseRegisterDialog.tsx`, `ConflictAlertDialog.tsx`
- `src/app/(protected)/home/page.tsx`

### Phase 6: 馬リスト画面 `/horselist/[owner_name]`
- `HorseTable.tsx`, `HorseEditDialog.tsx`, `HorseDeleteDialog.tsx`
- `src/app/(protected)/horselist/[owner_name]/page.tsx`

### Phase 7: CSVエクスポート + 仕上げ
- `CsvDownloadButton.tsx` - BOM付きUTF-8（Excel文字化け対策）
- `src/app/(protected)/download/page.tsx`
- AppBarのナビゲーション実装
- レスポンシブデザイン調整

---

## 5. 主要実装の詳細

### 5-1. ルーティング保護（middleware.ts）

```
未認証 → /home, /group, /download, /horselist/* : /login にリダイレクト
認証済み → /login, /signup : /home にリダイレクト
```
Supabase公式パターン（`updateSession`）でセッションをリフレッシュ。

### 5-2. Zustandストアの主要selector

既存Vuexのgetterを移植：
```typescript
sortedOwners: () => owners sorted by no (数値でなければ末尾)
ownerHorseCount: () => Record<ownerName, number>
ownerHorseLastNo: () => Record<ownerName, maxPoOrderNo>
ownerHorses: () => Record<ownerName, Horse[]>
```

### 5-3. オートコンプリート検索

shadcn/ui の `Popover` + `Command` コンポーネントを使用（Comboboxパターン）。
母名前方一致フィルタ + 最大表示件数（3/5/8/10）でスライス。
選択済み馬には ✔ マーク表示（`selectedMares.includes(horse.mare)` で判定）。

### 5-4. 馬バリデーション（Zodスキーマ）

```typescript
horse_id: 10桁数字 + 先頭4桁がNetkeiba年号
name: 2文字以上 + 既存馬名との重複チェック（編集時は自身を除外）
sire: 2文字以上
mare: 2文字以上 + 既存母馬との重複チェック（編集時は自身を除外）
po_name: 必須
```

### 5-5. オーナー削除時の連動削除

```typescript
// 馬を先に削除してからオーナーを削除
await supabase.from('horses').delete().eq('po_name', ownerName).eq('year', targetYear)
await supabase.from('owners').delete().eq('id', ownerId)
```

### 5-6. 指名順番の自動採番

```typescript
const lastNo = ownerHorseLastNo()[selectedOwner] ?? 0
const nextNo = lastNo + 1
```

### 5-7. パスワードリセットフロー

```
1. /forgot-password でメール送信（supabase.auth.resetPasswordForEmail）
2. メール内リンク → /auth/callback?next=/reset-password
3. callback/route.ts でtoken交換 → /reset-password へリダイレクト
4. /reset-password でsupabase.auth.updateUser({ password })
```
Supabase Dashboard の Authentication > Email Templates でリダイレクトURL設定が必要。

### 5-8. CSVダウンロード（BOM付きUTF-8）

```typescript
const bom = '\uFEFF'
const csv = bom + 'order_no,owner_name,name,sire,mare,id\n' + rows.join('\n')
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
```

---

## 6. Server / Client Component の使い分け

| ファイル | 種別 | 理由 |
|---------|------|------|
| `(protected)/layout.tsx` | Server | サーバー側で認証チェック |
| `DataProvider.tsx` | Client | Realtime購読・useState が必要 |
| `HorseSearchInput.tsx` | Client | onChange インタラクションが必要 |
| `OwnerTable.tsx` 等のDataTable | Client | 編集・削除インタラクションが必要 |
| `auth/callback/route.ts` | Route Handler (Server) | token交換はサーバーで行う |

**原則**: データフェッチはServer Component、インタラクションはClient Component。`"use client"` は必要最小限に。

---

## 7. Vercelデプロイ設定

1. GitHubリポジトリをVercelに連携
2. Vercel Dashboard > Settings > Environment Variables に以下を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_TARGET_YEAR`
3. Supabase Dashboard > Authentication > URL Configuration:
   - Site URL: `https://your-vercel-domain.vercel.app`
   - Redirect URLs: `https://your-vercel-domain.vercel.app/auth/callback`

---

## 8. 参照すべき既存コード

| 既存ファイル | 参照用途 |
|------------|---------|
| `src/views/HorseSelect.vue` | オートコンプリート・重複チェック・馬登録ダイアログのロジック |
| `src/store/index.js` | Vuex getterのZustand selector変換元 |
| `src/views/Group.vue` | オーナーCRUD・連動削除ロジック |
| `src/views/HorseList.vue` | DataTable・馬編集・削除ロジック |
| `src/views/Download.vue` | CSV生成ロジック |
| `src/assets/horse_catalogue_2024.json` | 馬カタログのデータ構造確認 |
