# POG馬選択Webアプリ クローン - 要件定義書

## Context

既存のPOG馬選択Webアプリ（Vue2+Firebase）のクローンをNext.js+Supabaseで新規作成する。
UIデザインは既存を踏襲しつつ、技術スタックを刷新し、パスワードリセット機能を追加する。

---

## 1. プロジェクト概要

- **目的**: POGドラフト会議において、参加者（オーナー）が競走馬を指名・管理するWebアプリ
- **利用シーン**: ドラフト会議の場で複数参加者がリアルタイムに馬を選択・確認
- **デプロイ先**: Vercel

---

## 2. 技術スタック（新規）

| カテゴリ               | 技術                                                    | 既存との対応              |
| ---------------------- | ------------------------------------------------------- | ------------------------- |
| フレームワーク         | Next.js (App Router)                                    | Vue.js 2 →                |
| 状態管理               | Zustand または React Context                            | Vuex →                    |
| UIライブラリ           | Tailwind CSS + shadcn/ui (Material Design風)            | Vuetify →                 |
| バックエンド/DB        | Supabase (PostgreSQL + Realtime)                        | Firebase Realtime DB →    |
| 認証                   | Supabase Auth                                           | Firebase Authentication → |
| フォームバリデーション | React Hook Form + Zod                                   | vee-validate →            |
| Linter                 | ESLint (eslint-config-next + eslint-plugin-react-hooks) | ESLint →                  |
| フォーマッター         | Prettier                                                | なし →                    |
| 型チェック             | TypeScript strict mode                                  | なし →                    |
| パッケージ管理         | npm または yarn                                         | yarn                      |
| デプロイ               | Vercel                                                  | Firebase Hosting →        |

---

## 3. 機能要件

### 3.1 認証機能

- メール/パスワードによるサインアップ
- メール/パスワードによるログイン
- ログアウト
- **パスワードリセット（新規追加）**
  - メールアドレス入力 → リセットメール送信
  - リセットリンクからパスワード再設定
- 認証済みユーザーのみデータアクセス可能
- Row Level Security (RLS) によるユーザーデータ分離

### 3.2 オーナー管理機能（/group）

- オーナー（指名者）の追加（名前・番号）
- オーナーの編集
- オーナーの削除（紐付く全指名馬も連動削除）
- オーナー一覧表示（番号順ソート）

### 3.3 馬指名機能（/home）

- 馬カタログからの検索（母馬名で前方一致サジェスション）
- サジェスション最大表示件数の設定（3/5/8/10件）
- 既選択馬のビジュアル表示（✔マーク）
- 新規馬の登録ダイアログ
  - ID（10桁数字）、馬名、父馬名、母馬名の入力
  - 指名オーナーの選択（ラジオボタン）
  - カタログ外馬の手動入力も可能
- 重複検出・警告（同一馬名、同一母馬）
- オーナー登録前は検索入力を無効化

### 3.4 馬リスト管理機能（/horselist/[owner_name]）

- オーナー別の指名馬一覧表示（DataTable）
- 指名順番（No）によるソート
- フリーワード検索
- 馬情報の編集（全フィールド + 指名順番）
- 馬の削除（確認ダイアログあり）
- 全オーナー合計の指名馬数表示

### 3.5 CSVエクスポート機能（/download）

- 全指名馬データのCSVダウンロード
- 出力フィールド: order_no, owner_name, name, sire, mare, id
- ソート順: オーナー名 → 指名順番
- 指名馬が0件の場合はボタン無効化

---

## 4. データ構造

### 4.1 馬カタログ（ローカルJSON）

```json
[
  {
    "id": "2022105006",
    "name": "ブラックモリオンの2022",
    "sire": "キズナ",
    "mare": "ブラックモリオン"
  }
]
```

- 別プログラムで生成・提供される
- アプリ内に静的ファイルとして配置

### 4.2 Supabase テーブル設計

#### `owners` テーブル

```sql
id          bigint generated always as identity primary key
user_id     uuid references auth.users not null
year        integer not null
name        text not null
no          integer not null
created_at  timestamptz default now()
```

#### `horses` テーブル

```sql
id          bigint generated always as identity primary key
user_id     uuid references auth.users not null
year        integer not null
horse_id    text              -- Netkeiba ID (10桁)
name        text not null
sire        text not null
mare        text not null
owner_id    bigint not null   -- 指名者（外部キー）
po_order_no integer not null  -- 指名順番
created_at  timestamptz default now()

-- 制約
foreign key (user_id, owner_id) references owners (user_id, id) on delete cascade
```

### 4.3 RLSポリシー

- 全テーブルで `user_id = auth.uid()` によるデータ分離
- 自分のデータのみ読み書き可能

### 4.4 年度管理

- 環境変数 `NEXT_PUBLIC_TARGET_YEAR` で対象年度を指定
- 指定なしの場合は現在年度

---

## 5. ビジネスロジック・制約条件

### 5.1 指名ルール

- オーナー登録前は馬検索入力を無効化
- 同一母馬からの馬は1頭のみ指名可能（重複排除）
- 同一馬名の馬は指名不可（重複排除）
- 新規登録時の指名順番は同一オーナー内で自動採番（連番）

### 5.2 ID バリデーション

- 10桁の数字のみ
- 先頭4桁がNetkeiba年号（2022, 2023, 2024, 2025...）

### 5.3 削除ルール

- オーナー削除 → 紐付く全馬データも連動削除（`horses.owner_id` の `ON DELETE CASCADE` により DB が自動処理）
- 削除前に確認ダイアログを表示

---

## 6. 画面構成・ルーティング

| パス                      | 画面名                 | 説明                                     |
| ------------------------- | ---------------------- | ---------------------------------------- |
| `/login`                  | ログイン               | メール/パスワードログイン                |
| `/signup`                 | サインアップ           | 新規ユーザー登録                         |
| `/forgot-password`        | パスワードリセット申請 | リセットメール送信                       |
| `/reset-password`         | パスワード再設定       | 新パスワード入力（メールリンク遷移先）   |
| `/home`                   | 馬選択                 | メイン画面。馬の検索・登録・オーナー一覧 |
| `/horselist/[owner_name]` | 馬リスト               | オーナー別指名馬一覧・編集               |
| `/group`                  | オーナー管理           | オーナーの追加・編集・削除               |
| `/download`               | CSVエクスポート        | 指名データのCSVダウンロード              |

---

## 7. UIデザイン方針

- 既存アプリ（Vuetify Material Design）のレイアウト・配色を踏襲
- AppBar: ロゴ + ナビゲーションメニュー（Home, Group, Download, Logout）
- DataTable: ソート・検索・ページネーション（10件/ページ）
- ダイアログ: 登録・編集・削除確認
- レスポンシブデザイン対応

---

## 8. 非機能要件

### 8.1 データ永続化

- Supabase PostgreSQL によるデータ管理
- Supabase Realtime による変更リアルタイム反映（任意）

### 8.2 セキュリティ

- Supabase Auth による認証
- RLS によるユーザーデータ分離（既存の課題を解消）
- 環境変数による機密情報管理

### 8.3 コード品質

- **TypeScript strict mode**: `tsconfig.json` で `"strict": true` を有効化
  - `noUncheckedIndexedAccess`, `noImplicitAny`, `strictNullChecks` を含む
- **ESLint**: `eslint-config-next` をベースに以下を追加
  - `eslint-plugin-react-hooks`: hooks のルール違反を検出
  - `@typescript-eslint/recommended`: TypeScript固有のルール
- **Prettier**: コードフォーマット統一
  - セミコロンなし、シングルクォート、末尾カンマあり
  - `.prettierrc` で設定を共有
- **CI（GitHub Actions）**: PR時に以下を自動実行
  - `tsc --noEmit`（型チェック）
  - `eslint .`（Lint）
  - `prettier --check .`（フォーマットチェック）
  - Vitestによる単体テスト

### 8.4 デプロイ

- Vercel へのCI/CD（GitHubリポジトリと連携）
- 環境変数はVercelの設定で管理

---

## 9. 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase publishable key>
NEXT_PUBLIC_TARGET_YEAR=2026
```

---

## 10. 既存との主な差分まとめ

| 項目               | 既存                 | 新規                                       |
| ------------------ | -------------------- | ------------------------------------------ |
| FW                 | Vue 2                | Next.js (App Router)                       |
| DB                 | Firebase Realtime DB | Supabase (PostgreSQL)                      |
| 認証               | Firebase Auth        | Supabase Auth                              |
| UI                 | Vuetify              | Tailwind + shadcn/ui                       |
| デプロイ           | Firebase Hosting     | Vercel                                     |
| データ分離         | なし（課題）         | RLSで解決                                  |
| パスワードリセット | なし                 | 追加                                       |
| 馬カタログ         | CSV→JSONツール内包   | 別プログラムで提供                         |
| 型チェック         | なし                 | TypeScript strict mode                     |
| Linter/Formatter   | ESLint のみ          | ESLint + Prettier                          |
| CI                 | なし                 | GitHub Actions（型チェック・Lint・テスト） |
