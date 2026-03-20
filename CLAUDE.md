# CLAUDE.md

## プロジェクト概要

POGドラフト会議で参加者が競走馬を指名・管理するWebアプリ（Next.js + Supabase）。

---

## 技術スタックとファイル配置

| 役割           | 技術                                              |
| -------------- | ------------------------------------------------- |
| フレームワーク | Next.js (App Router)                              |
| DB / 認証      | Supabase (PostgreSQL + Auth + Realtime)           |
| UI             | Tailwind CSS + shadcn/ui                          |
| 状態管理       | Zustand                                           |
| フォーム       | React Hook Form + Zod                             |
| テスト         | Vitest + React Testing Library / Playwright (E2E) |

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
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
- **`createBrowserClient` はシングルトンにする**: コンポーネントごとに毎回インスタンスを生成すると Realtime 接続が重複する。`lib/supabase/client.ts` でモジュールレベルのシングルトンとして管理する。
- **パスワードリセットのコールバック**: リセットメールのリンクは `/auth/callback?next=/reset-password` を経由する。`/reset-password` に直接リダイレクトさせるとtoken交換が行われずエラーになる。
- **Server Actions は内部で認証チェックする**: Server Actions は `(protected)/layout.tsx` のガードをバイパスして直接呼び出せる公開エンドポイント。middleware 頼みにせず、Action 内で必ず `supabase.auth.getUser()` で認証・認可を確認する。
- **DataProvider では owners と horses を並列フェッチする**: `useOwners` と `useHorses` の初期フェッチは `Promise.all` で並列実行する。sequential await はウォーターフォールになり初期表示が遅くなる。
- **DataProvider の初期表示フラッシュ**: Realtime 購読前の初回フェッチが完了するまでデータが空になる。`loading` 状態を Zustand ストアで管理し、空リストとローディング中を区別してレンダリングする。
- **オーナー削除は CASCADE に任せる**: `horses.owner_id` に `ON DELETE CASCADE` を設定しているため、`owners` を削除するだけで紐付く `horses` も DB が自動削除する。アプリ側で馬を先に消す必要はない。
- **重複チェックは動的Zodスキーマ**: `mare`（母馬）と `name`（馬名）の重複チェックは既存データをZodの `refine` に渡す。編集時は自身のレコードを除外リストから外すこと。
- **年度フィルタを忘れない**: Supabaseクエリには必ず `.eq('year', getTargetYear())` を付ける。付け忘れると年度をまたいでデータが混在する。
- **CSVはBOM付きUTF-8**: `'\uFEFF'` をCSV先頭に付けないとExcelで文字化けする。
- **馬カタログは静的import**: `src/data/horse_catalogue.json` はAPIルート不要。`import catalogue from '@/data/horse_catalogue.json'` で読み込む。`noUncheckedIndexedAccess: true` の設定下では配列アクセス時に `undefined` チェックまたは `!` assertionが必要。

---

## 開発エチケット

### ブランチ命名規則

```
feature/<機能名>   # 新機能（例: feature/horse-register-dialog）
fix/<バグ内容>     # バグ修正（例: fix/duplicate-mare-check）
chore/<作業内容>   # 設定・リファクタ（例: chore/setup-eslint）
```

### コミットルール

- **コミット前に必ず通す**: `npm run type-check && npm run lint && npm run test`
- エラーが出たら修正してからコミットすること。エラーを放置してのコミットは禁止。

---

## 参考資料

- 要件定義書: Spec.md
- テスト計画書: TEST_DEFINITION.md

---

## その他

- クローン前の既存コードベースのコードを参照したいときは要求してください。必要に応じてコードスニペットを提供します。
