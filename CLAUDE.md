# CLAUDE.md

## プロジェクト概要

POGドラフト会議で参加者が競走馬を指名・管理するWebアプリ（Next.js + Supabase）。

---

## 技術スタックとファイル配置

| 役割 | 技術 |
|-----|------|
| フレームワーク | Next.js (App Router) |
| DB / 認証 | Supabase (PostgreSQL + Auth + Realtime) |
| UI | Tailwind CSS + shadcn/ui |
| 状態管理 | Zustand |
| フォーム | React Hook Form + Zod |
| テスト | Vitest + React Testing Library / Playwright (E2E) |

### ディレクトリルール

```
src/
├── app/
│   ├── (auth)/          # 認証画面（AppBarなし）
│   ├── (protected)/     # 認証必須画面（AppBar + DataProvider）
│   └── auth/callback/   # Supabase Authコールバック (Route Handler)
├── components/          # 画面ごとにサブディレクトリを切る
├── hooks/               # useOwners, useHorses（Supabase CRUD + Realtime）
├── lib/
│   ├── supabase/        # client.ts（ブラウザ用）/ server.ts（サーバー用）
│   └── validations/     # Zodスキーマ
├── store/               # pogStore.ts（Zustand）
├── types/               # index.ts（Owner, Horse, CatalogHorse）
└── data/                # horse_catalogue.json（静的）
```

---

## コーディング規約

- **TypeScript strict mode** (`"strict": true`, `noUncheckedIndexedAccess`)
- **ESLint**: `eslint-config-next` + `eslint-plugin-react-hooks` + `@typescript-eslint/recommended`
- **Prettier**: セミコロンなし、シングルクォート、末尾カンマあり
- コンポーネントファイルは PascalCase（例: `HorseRegisterDialog.tsx`）
- フック・ユーティリティは camelCase（例: `useOwners.ts`, `getTargetYear.ts`）
- `"use client"` は必要最小限のコンポーネントのみに付与する

---

## 環境構築とコマンド

### 必須環境変数（`.env.local`）

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TARGET_YEAR=2025
```

### 定型コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run lint         # ESLint実行
npm run type-check   # tsc --noEmit
npm run format       # Prettier実行
npm run test         # Vitest（単体テスト）
npx playwright test  # E2Eテスト（要: dev起動中）
```

---

## 技術的な罠・注意点

- **Supabaseクライアントの使い分け**: Server Component では `lib/supabase/server.ts`（`createServerClient` + cookies）を、Client Component では `lib/supabase/client.ts`（`createBrowserClient`）を使う。混在させるとセッションがずれる。
- **パスワードリセットのコールバック**: リセットメールのリンクは `/auth/callback?next=/reset-password` を経由する。`/reset-password` に直接リダイレクトさせるとtoken交換が行われずエラーになる。
- **オーナー削除は馬を先に消す**: `horses` の `po_name` はオーナー名の文字列参照なので DB の CASCADE は使えない。アプリ側で `horses` を削除してから `owners` を削除する。
- **重複チェックは動的Zodスキーマ**: `mare`（母馬）と `name`（馬名）の重複チェックは既存データをZodの `refine` に渡す。編集時は自身のレコードを除外リストから外すこと。
- **年度フィルタを忘れない**: Supabaseクエリには必ず `.eq('year', getTargetYear())` を付ける。付け忘れると年度をまたいでデータが混在する。
- **CSVはBOM付きUTF-8**: `'\uFEFF'` をCSV先頭に付けないとExcelで文字化けする。
- **馬カタログは静的import**: `src/data/horse_catalogue.json` はAPIルート不要。`import catalogue from '@/data/horse_catalogue.json'` で読み込む。

---

## 開発エチケット

### ブランチ命名規則

```
feature/<機能名>   # 新機能（例: feature/horse-register-dialog）
fix/<バグ内容>     # バグ修正（例: fix/duplicate-mare-check）
chore/<作業内容>   # 設定・リファクタ（例: chore/setup-eslint）
```

### PRルール

- **PR前に必ず通す**: `npm run type-check && npm run lint && npm run test`
- PRタイトルは日本語可、変更内容が一目でわかるように
- 1 PR = 1機能・1修正（PLAN.mdのPhase単位が目安）
- CI（GitHub Actions）がすべてグリーンになってからマージする
