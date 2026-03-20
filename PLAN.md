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

# テスト（単体・コンポーネント）
npm install -D \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  jsdom

# テスト（E2E）
npm install -D \
  @playwright/test
npx playwright install --with-deps chromium
```

### 1-3. 環境変数

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJxxxx
NEXT_PUBLIC_TARGET_YEAR=2026
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
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- UUIDv4より断片化なし
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year       INTEGER NOT NULL,
  name       TEXT NOT NULL,
  no         INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT owners_user_year_name_uniq UNIQUE (user_id, year, name),
  -- 複合FKのターゲットとして必要なユニーク制約
  CONSTRAINT owners_user_id_uniq UNIQUE (user_id, id)
);

-- horses テーブル
CREATE TABLE public.horses (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year        INTEGER NOT NULL,
  horse_id    TEXT CHECK (horse_id IS NULL OR horse_id ~ '^\d{10}$'),  -- Netkeiba ID (10桁)
  name        TEXT NOT NULL,
  sire        TEXT NOT NULL,
  mare        TEXT NOT NULL,
  owner_id    BIGINT NOT NULL,  -- 指名者（外部キー）
  po_order_no INTEGER NOT NULL, -- 指名順番
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT horses_user_year_name_uniq UNIQUE (user_id, year, name),
  CONSTRAINT horses_user_year_mare_uniq UNIQUE (user_id, year, mare),
  -- 複合FK: user_id と owner_id が同一ユーザーのオーナーを指すことをDB レベルで保証
  CONSTRAINT horses_owner_fk FOREIGN KEY (user_id, owner_id)
    REFERENCES public.owners (user_id, id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_owners_user_year  ON public.owners(user_id, year);
CREATE INDEX idx_horses_user_year  ON public.horses(user_id, year);
CREATE INDEX idx_horses_owner_id   ON public.horses(owner_id);

-- Realtime UPDATE イベントで変更前行データを取得するために必要
ALTER TABLE public.owners REPLICA IDENTITY FULL;
ALTER TABLE public.horses REPLICA IDENTITY FULL;
```

### 3-2. RLSポリシー

```sql
-- owners
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners FORCE ROW LEVEL SECURITY;  -- テーブルオーナーにもRLSを強制
-- (SELECT auth.uid()) でラップし、全行分呼ばれるのを防ぐ（パフォーマンス最適化）
CREATE POLICY "owners_select" ON public.owners FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "owners_insert" ON public.owners FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
-- WITH CHECK がないと更新後のuser_idが検証されずデータ乗っ取りが可能になる
CREATE POLICY "owners_update" ON public.owners FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "owners_delete" ON public.owners FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- horses
ALTER TABLE public.horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horses FORCE ROW LEVEL SECURITY;  -- テーブルオーナーにもRLSを強制
-- (SELECT auth.uid()) でラップし、全行分呼ばれるのを防ぐ（パフォーマンス最適化）
CREATE POLICY "horses_select" ON public.horses FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "horses_insert" ON public.horses FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
-- WITH CHECK がないと更新後のuser_idが検証されずデータ乗っ取りが可能になる
CREATE POLICY "horses_update" ON public.horses FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "horses_delete" ON public.horses FOR DELETE USING ((SELECT auth.uid()) = user_id);
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
  "format:check": "prettier --check .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```

#### アプリ基盤

- `src/lib/supabase/client.ts` - ブラウザ用クライアント（`createBrowserClient`）
- `src/lib/supabase/server.ts` - サーバー用クライアント（`createServerClient` + cookies）
- `src/middleware.ts` - セッションリフレッシュ + 保護ルートリダイレクト
- `src/types/index.ts` - Owner, Horse, CatalogHorse 型定義
- `src/lib/utils.ts` - `getTargetYear()` ユーティリティ
- `src/app/layout.tsx`, `(auth)/layout.tsx`, `(protected)/layout.tsx` の骨格

#### ✅ Phase 1 で書くテスト

| テストファイル | 対象 |
| --- | --- |
| `src/__tests__/lib/utils.test.ts` | `getTargetYear()` の環境変数あり・なし（TEST_DEFINITION.md §2-2） |

### Phase 2: 認証機能

- `src/lib/validations/auth.ts` - Zodスキーマ
- `/login`, `/signup`, `/forgot-password`, `/reset-password` の各ページ
- `src/app/auth/callback/route.ts` - token交換 + `/reset-password` へリダイレクト
- Supabase Dashboard で Reset Password メールのリダイレクトURL設定

#### ✅ Phase 2 で書くテスト

| テストファイル | 対象 |
| --- | --- |
| `src/__tests__/lib/validations/auth.test.ts` | メール形式・パスワード長バリデーション（TEST_DEFINITION.md §2-1） |
| `e2e/auth.spec.ts` | TC-AUTH-001〜006（サインアップ・ログイン・ログアウト・パスワードリセット・未認証リダイレクト・認証済みリダイレクト） |

### Phase 3: データ層

- `src/store/pogStore.ts` - Zustandストア（owners, horses, actions, selectors）
- `src/hooks/useOwners.ts` - Supabase CRUD + Realtime購読
- `src/hooks/useHorses.ts` - 同上
- `src/components/layout/DataProvider.tsx` - 保護画面全体でデータ共有

#### ✅ Phase 3 で書くテスト

| テストファイル | 対象 |
| --- | --- |
| `src/__tests__/store/pogStore.test.ts` | `addOwner` / `removeOwner` / `addHorse` / `removeHorse` / selectors（`sortedOwners`, `ownerHorseCount`, `ownerHorseLastNo`, `clearData`）（TEST_DEFINITION.md §2-3） |

### Phase 4: オーナー管理画面 `/group`

- `src/lib/validations/owner.ts`
- `OwnerTable.tsx`, `OwnerFormDialog.tsx`, `OwnerDeleteDialog.tsx`
- `src/app/(protected)/group/page.tsx`

#### ✅ Phase 4 で書くテスト

| テストファイル | 対象 |
| --- | --- |
| `src/__tests__/lib/validations/owner.test.ts` | オーナー名の必須・空チェック（TEST_DEFINITION.md §2-1） |
| `src/__tests__/components/group/OwnerTable.test.tsx` | 一覧表示・番号順ソート・編集/削除ボタン（TEST_DEFINITION.md §3-3） |
| `e2e/group.spec.ts` | TC-GROUP-001〜005（オーナー追加・編集・削除・馬連動削除・番号順ソート） |

### Phase 5: 馬選択画面 `/home`

- `src/lib/validations/horse.ts` - 重複チェック含む動的Zodスキーマ
- `HorseSearchInput.tsx` - Popover + Command（shadcn Comboboxパターン）
- `OwnerList.tsx`, `HorseRegisterDialog.tsx`, `ConflictAlertDialog.tsx`
- `src/app/(protected)/home/page.tsx`

#### ✅ Phase 5 で書くテスト

| テストファイル | 対象 |
| --- | --- |
| `src/__tests__/lib/validations/horse.test.ts` | horse_id 桁数・形式・馬名/母馬名重複・編集時の自己除外・owner_id 必須（TEST_DEFINITION.md §2-1） |
| `src/__tests__/components/home/HorseSearchInput.test.tsx` | disabled状態・サジェスト表示・件数上限・✔マーク・ダイアログ起動（TEST_DEFINITION.md §3-1） |
| `src/__tests__/components/home/HorseRegisterDialog.test.tsx` | 自動入力・手動入力・バリデーションエラー表示・ラジオボタン・キャンセル（TEST_DEFINITION.md §3-2） |
| `e2e/home.spec.ts` | TC-HOME-001〜008（検索無効化・サジェスト・カタログ登録・手動登録・重複チェック・自動採番・✔マーク） |

### Phase 6: 馬リスト画面 `/horselist/[owner_name]`

- `HorseTable.tsx`, `HorseEditDialog.tsx`, `HorseDeleteDialog.tsx`
- `src/app/(protected)/horselist/[owner_name]/page.tsx`

#### ✅ Phase 6 で書くテスト

| テストファイル | 対象 |
| --- | --- |
| `src/__tests__/components/horselist/HorseTable.test.tsx` | 一覧表示・po_order_no昇順・フリーワード検索・ページネーション・編集/削除ボタン（TEST_DEFINITION.md §3-4） |
| `e2e/horselist.spec.ts` | TC-HORSELIST-001〜006（オーナー別表示・ソート・検索・編集・削除・合計数） |

### Phase 7: CSVエクスポート + 仕上げ

- `CsvDownloadButton.tsx` - BOM付きUTF-8（Excel文字化け対策）
- `src/app/(protected)/download/page.tsx`
- AppBarのナビゲーション実装
- レスポンシブデザイン調整

#### ✅ Phase 7 で書くテスト

| テストファイル | 対象 |
| --- | --- |
| `src/__tests__/components/download/CsvDownloadButton.test.tsx` | 0件時 disabled・1件以上で有効（TEST_DEFINITION.md §3-5） |
| `e2e/download.spec.ts` | TC-DOWNLOAD-001〜002（0件無効・CSVダウンロード・BOM/ヘッダー/ソート確認） |
| `e2e/security.spec.ts` | TC-SEC-001〜002（ユーザーデータ分離・RLS直接APIアクセス拒否） |

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
owner_id: 必須（UUIDとして検証）
```

### 5-5. オーナー削除時の連動削除

`horses.owner_id` に `ON DELETE CASCADE` を設定しているため、オーナーを削除するだけで紐付く馬も DB が自動削除する。

```typescript
// オーナーを削除するだけでOK（horses は CASCADE で自動削除）
await supabase.from("owners").delete().eq("id", ownerId);
```

### 5-6. 指名順番の自動採番

```typescript
const lastNo = ownerHorseLastNo()[selectedOwner] ?? 0;
const nextNo = lastNo + 1;
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
const bom = "\uFEFF";
const csv = bom + "order_no,owner_name,name,sire,mare,id\n" + rows.join("\n");
const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
```

---

## 6. Server / Client Component の使い分け

| ファイル                       | 種別                   | 理由                             |
| ------------------------------ | ---------------------- | -------------------------------- |
| `(protected)/layout.tsx`       | Server                 | サーバー側で認証チェック         |
| `DataProvider.tsx`             | Client                 | Realtime購読・useState が必要    |
| `HorseSearchInput.tsx`         | Client                 | onChange インタラクションが必要  |
| `OwnerTable.tsx` 等のDataTable | Client                 | 編集・削除インタラクションが必要 |
| `auth/callback/route.ts`       | Route Handler (Server) | token交換はサーバーで行う        |

**原則**: データフェッチはServer Component、インタラクションはClient Component。`"use client"` は必要最小限に。

---

## 7. Vercelデプロイ設定

1. GitHubリポジトリをVercelに連携
2. Vercel Dashboard > Settings > Environment Variables に以下を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_TARGET_YEAR`
3. Supabase Dashboard > Authentication > URL Configuration:
   - Site URL: `https://your-vercel-domain.vercel.app`
   - Redirect URLs: `https://your-vercel-domain.vercel.app/auth/callback`

---

## 8. 参照すべき既存コード

| 既存ファイル                           | 参照用途                                                     |
| -------------------------------------- | ------------------------------------------------------------ |
| `src/views/HorseSelect.vue`            | オートコンプリート・重複チェック・馬登録ダイアログのロジック |
| `src/store/index.js`                   | Vuex getterのZustand selector変換元                          |
| `src/views/Group.vue`                  | オーナーCRUD・連動削除ロジック                               |
| `src/views/HorseList.vue`              | DataTable・馬編集・削除ロジック                              |
| `src/views/Download.vue`               | CSV生成ロジック                                              |
| `src/assets/horse_catalogue_2024.json` | 馬カタログのデータ構造確認                                   |
