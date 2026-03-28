# POG Horse Selector

POG（Paper Owner Game）ドラフト会議で、複数の参加者がリアルタイムに競走馬を指名・管理するWebアプリです。

## 機能

- **認証** — メール/パスワードによるサインアップ・ログイン・パスワードリセット
- **馬選択** — 馬カタログから母馬名で前方一致検索し、ワンクリックで登録ダイアログを起動
- **重複チェック** — 同一馬名・同一母馬の二重指名を自動検出して警告
- **オーナー管理** — 参加者の追加・編集・削除（削除時は指名馬を連動削除）
- **馬リスト** — オーナー別の指名馬一覧・編集・削除・フリーワード検索
- **CSVエクスポート** — 全指名馬データをBOM付きUTF-8でダウンロード（Excel対応）
- **リアルタイム反映** — Supabase Realtimeによる複数端末間の即時同期

## 技術スタック

| カテゴリ | 技術 |
| --- | --- |
| フレームワーク | Next.js 16 (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui |
| 状態管理 | Zustand |
| バックエンド/DB | Supabase (PostgreSQL + Realtime) |
| 認証 | Supabase Auth |
| フォームバリデーション | React Hook Form + Zod |
| テスト（単体） | Vitest + Testing Library |
| テスト（E2E） | Playwright |
| デプロイ | Vercel |

## 前提条件

- Node.js 20以上
- npm
- Supabaseアカウント（無料プランで動作します）
- Vercelアカウント（デプロイ時）

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-username/pog-horse-selector-next.git
cd pog-horse-selector-next
npm install
```

### 2. Supabaseプロジェクトを作成

[app.supabase.com](https://app.supabase.com) にログインし、新規プロジェクトを作成します。

### 3. データベースを初期化

Supabase Dashboard の **SQL Editor** で以下のSQLを実行してください。

```sql
-- owners テーブル
CREATE TABLE public.owners (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year       INTEGER NOT NULL,
  name       TEXT NOT NULL,
  no         INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT owners_user_year_name_uniq UNIQUE (user_id, year, name),
  CONSTRAINT owners_user_id_uniq UNIQUE (user_id, id)
);

-- horses テーブル
CREATE TABLE public.horses (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year        INTEGER NOT NULL,
  horse_id    TEXT CHECK (horse_id IS NULL OR horse_id ~ '^\d{10}$'),
  name        TEXT NOT NULL,
  sire        TEXT NOT NULL,
  mare        TEXT NOT NULL,
  owner_id    BIGINT NOT NULL,
  po_order_no INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT horses_user_year_name_uniq UNIQUE (user_id, year, name),
  CONSTRAINT horses_user_year_mare_uniq UNIQUE (user_id, year, mare),
  CONSTRAINT horses_owner_fk FOREIGN KEY (user_id, owner_id)
    REFERENCES public.owners (user_id, id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_owners_user_year ON public.owners(user_id, year);
CREATE INDEX idx_horses_user_year ON public.horses(user_id, year);
CREATE INDEX idx_horses_owner_id  ON public.horses(owner_id);

-- Realtime用（変更前行データの取得に必要）
ALTER TABLE public.owners REPLICA IDENTITY FULL;
ALTER TABLE public.horses REPLICA IDENTITY FULL;

-- Realtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE public.owners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.horses;

-- Row Level Security
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners FORCE ROW LEVEL SECURITY;
CREATE POLICY "owners_select" ON public.owners FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "owners_insert" ON public.owners FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "owners_update" ON public.owners FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "owners_delete" ON public.owners FOR DELETE USING ((SELECT auth.uid()) = user_id);

ALTER TABLE public.horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horses FORCE ROW LEVEL SECURITY;
CREATE POLICY "horses_select" ON public.horses FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "horses_insert" ON public.horses FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "horses_update" ON public.horses FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "horses_delete" ON public.horses FOR DELETE USING ((SELECT auth.uid()) = user_id);
```

### 4. Supabase認証URLを設定

Supabase Dashboard > **Authentication > URL Configuration** で以下を設定します。

- **Site URL**: `http://localhost:3000`（本番環境ではVercelのURLに変更）
- **Redirect URLs**: `http://localhost:3000/auth/callback`

### 5. 環境変数を設定

`.env.local.example` をコピーして `.env.local` を作成します。

```bash
cp .env.local.example .env.local
```

`.env.local` を編集します。

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
NEXT_PUBLIC_TARGET_YEAR=2026
```

各値はSupabase Dashboard > **Project Settings > API** で確認できます。

`NEXT_PUBLIC_TARGET_YEAR` はPOGの対象年度を指定します（省略時は現在年）。

### 6. 馬カタログを配置

`src/data/horse_catalogue.json` に馬カタログデータを配置します。形式は以下の通りです。

```json
[
  {
    "id": "2024106164",
    "name": "アーモンドアイの2024",
    "sire": "キタサンブラック",
    "mare": "アーモンドアイ"
  }
]
```

| フィールド | 説明 |
| --- | --- |
| `id` | Netkeiba馬ID（10桁数字） |
| `name` | 馬名 |
| `sire` | 父馬名 |
| `mare` | 母馬名 |

カタログのフィルタリングは `TARGET_YEAR - 2` 年産まれの馬が対象です。
例: 2026年度POG → 2024年産まれ（`id` の先頭4桁が `2024`）。

> サンプルデータとして `src/data/horse_catalogue.json` が同梱されています。

### 7. 開発サーバーを起動

```bash
npm run dev
```

`http://localhost:3000` にアクセスして動作を確認してください。

## デプロイ（Vercel）

### 1. VercelにGitHubリポジトリを連携

[vercel.com](https://vercel.com) でプロジェクトを作成し、GitHubリポジトリをインポートします。

### 2. 環境変数を設定

Vercel Dashboard > **Settings > Environment Variables** に以下を追加します。

| 変数名 | 値 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable Key |
| `NEXT_PUBLIC_TARGET_YEAR` | 対象年度（例: `2026`） |

### 3. Supabase認証URLを本番用に更新

Supabase Dashboard > **Authentication > URL Configuration** を本番ドメインに変更します。

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

デプロイはGitHubへのpushで自動実行されます。

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# Lint
npm run lint
npm run lint:fix

# フォーマット
npm run format
npm run format:check

# 単体テスト
npm run test
npm run test:watch
npm run test:coverage

# E2Eテスト（.env.test が必要）
npm run test:e2e
npm run test:e2e:ui
```

### E2Eテスト用環境変数

E2Eテストを実行する場合は `.env.test.example` をコピーして `.env.test` を作成し、テスト用Supabaseプロジェクトの接続情報を設定してください。

```bash
cp .env.test.example .env.test
```

```
# Supabase接続情報（テスト用プロジェクトのURLとキーを設定）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx

# E2Eテスト対象年度
NEXT_PUBLIC_TARGET_YEAR=2026

# テストユーザー1（メインユーザー。認証・CRUD操作のテストに使用）
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=your-test-password

# テストユーザー2（別ユーザー。RLSによるデータ分離・ユーザー間アクセス制御のテストに使用）
TEST_USER2_EMAIL=test2@example.com
TEST_USER2_PASSWORD=your-test2-password
```

## 画面構成

| パス | 画面 |
| --- | --- |
| `/login` | ログイン |
| `/signup` | サインアップ |
| `/forgot-password` | パスワードリセット申請 |
| `/reset-password` | パスワード再設定 |
| `/home` | 馬選択（メイン画面） |
| `/group` | オーナー管理 |
| `/horselist/[owner_name]` | オーナー別馬リスト |
| `/download` | CSVエクスポート |

## ライセンス

[MIT License](./LICENSE)
