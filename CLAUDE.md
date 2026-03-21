# CLAUDE.md

## プロジェクト概要

POGドラフト会議で競走馬の指名・管理を行うWebアプリ（Next.js App Router + Supabase）。

## 技術スタック

Next.js / Supabase (PostgreSQL + Auth + Realtime) / Tailwind + shadcn/ui / Zustand / React Hook Form + Zod / Vitest + Playwright

## コーディング規約

- TypeScript strict（`noUncheckedIndexedAccess`含む）、Prettier: セミコロンなし・シングルクォート・末尾カンマ
- Component: PascalCase / hook・util: camelCase
- `"use client"` は必要最小限のコンポーネントのみ

## コミット前チェック（必須）

```bash
npm run type-check && npm run lint && npm run test
```

## 技術的な罠・注意点

**Supabaseクライアント**: ServerComponent→`lib/supabase/server.ts`、ClientComponent→`lib/supabase/client.ts`（混在するとセッションがずれる）。`createBrowserClient`はモジュールレベルのシングルトンにする（Realtime接続の重複防止）。

**Server Actions**: `(protected)/layout.tsx`のガードをバイパスできる公開エンドポイント。Action内で必ず`supabase.auth.getUser()`で認証確認。

**パスワードリセット**: リセットリンクは`/auth/callback?next=/reset-password`経由必須。`/reset-password`へ直接リダイレクトするとtoken交換が行われずエラー。

**DataProvider**: `useOwners`・`useHorses`の初期フェッチは`Promise.all`で並列実行（sequential awaitはウォーターフォール）。`loading`状態をZustandで管理し、空リストとローディング中を区別。

**DBクエリ**: Supabaseクエリには必ず`.eq('year', getTargetYear())`を付ける（年度混在防止）。`horses.owner_id`は`ON DELETE CASCADE`設定済みなのでオーナー削除だけでOK。

**バリデーション**: `mare`・`name`の重複チェックはZodの`refine`に既存データを渡す。編集時は自身のレコードを除外リストから外すこと。

**その他**:

- CSVエクスポートは`'\uFEFF'`（BOM）を先頭に付ける（Excel文字化け防止）
- 馬カタログは`import catalogue from '@/data/horse_catalogue.json'`で静的import。`noUncheckedIndexedAccess`のため配列アクセスは`undefined`チェックか`!`が必要

## ブランチ命名

`feature/<機能名>` / `fix/<バグ内容>` / `chore/<作業内容>`

## 参考資料

要件定義: `docs/Spec.md` / テスト計画: `docs/TEST_DEFINITION.md` / 実装計画: `docs/PLAN.md`
