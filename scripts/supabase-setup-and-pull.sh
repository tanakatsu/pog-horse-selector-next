#!/usr/bin/env bash
set -euo pipefail

# Supabase プロジェクトの初期セットアップ＆スキーマ取得スクリプト
# Usage: ./scripts/supabase-setup-and-pull.sh [project-ref]
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

# リモートのスキーマを取得
echo "==> リモートのスキーマを取得します..."
npx supabase db pull

echo ""
echo "==> セットアップ完了！"
