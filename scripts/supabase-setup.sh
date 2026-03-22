#!/usr/bin/env bash
set -euo pipefail

# Supabase プロジェクトのセットアップスクリプト
# Usage: ./scripts/supabase-setup.sh [project-ref]
#
# project-ref の優先順位:
#   1. コマンドライン引数
#   2. 環境変数 SUPABASE_PROJECT_REF

PROJECT_REF="${1:-${SUPABASE_PROJECT_REF:-}}"

if [ -z "$PROJECT_REF" ]; then
  echo "Error: project-ref が指定されていません。"
  echo "Usage: $0 <project-ref>"
  echo "       または環境変数 SUPABASE_PROJECT_REF を設定してください。"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "==> Supabase セットアップを開始します (project-ref: $PROJECT_REF)"

# supabase/ ディレクトリが存在しない場合のみ init を実行
if [ ! -d "supabase" ]; then
  echo "==> supabase init を実行します..."
  npx supabase init
else
  echo "==> supabase/ ディレクトリは既に存在します。init をスキップします。"
fi

# プロジェクトにリンク
echo "==> プロジェクトにリンクします..."
npx supabase link --project-ref "$PROJECT_REF"

# ローカルにマイグレーションファイルが存在する場合はスキーマ取得をスキップ
if ls supabase/migrations/*.sql 1>/dev/null 2>&1; then
  echo "==> マイグレーションファイルが既に存在します。スキーマ取得をスキップします。"
  echo ""
  echo "==> マイグレーションをリモートDBに適用します..."
  if npx supabase db push; then
    echo ""
    echo "==> セットアップ完了！"
  else
    echo ""
    echo "==> db push が失敗しました。手動で適用してください:"
    echo "  1. マイグレーション履歴の不一致エラーが出た場合:"
    echo "     npx supabase migration repair --status applied <version>"
    echo "  2. Supabase SQL Editor で supabase/migrations/ 内の最新の *.sql を実行"
  fi
else
  echo "==> リモートのスキーマを取得します..."
  npx supabase db pull
  echo ""
  echo "==> セットアップ完了！"
  echo ""
  echo "以降のコマンド:"
  echo "  新規マイグレーション作成: npx supabase migration new <name>"
  echo "    └ supabase/migrations/<タイムスタンプ>_<name>.sql を生成します"
  echo "    └ 生成された .sql ファイルに ALTER TABLE / CREATE TABLE 等のDDLを記述してください"
  echo "    └ 記述後: npx supabase db push でリモートDBに適用"
  echo "      （失敗した場合は Supabase SQL Editor で手動実行）"
  echo "  マイグレーション一覧:     npx supabase migration list"
fi
