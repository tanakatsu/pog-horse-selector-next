#!/usr/bin/env bash
set -euo pipefail

# Supabase マイグレーション push スクリプト
# Usage: ./scripts/supabase-push.sh [--dry-run] [project-ref]
#
# Options:
#   --dry-run     実際に適用せず差分のみ表示
#
# project-ref の優先順位:
#   1. コマンドライン引数
#   2. 環境変数 SUPABASE_PROJECT_REF

DRY_RUN=false
PROJECT_REF=""

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    *)
      PROJECT_REF="$arg"
      ;;
  esac
done

PROJECT_REF="${PROJECT_REF:-${SUPABASE_PROJECT_REF:-}}"

if [ -z "$PROJECT_REF" ]; then
  echo "Error: project-ref が指定されていません。"
  echo "Usage: $0 [--dry-run] <project-ref>"
  echo "       または環境変数 SUPABASE_PROJECT_REF を設定してください。"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "==> プロジェクトにリンクします..."
npx supabase link --project-ref "$PROJECT_REF"

if [ "$DRY_RUN" = true ]; then
  echo "==> [dry-run] マイグレーションの差分を確認します（適用はしません）..."
  npx supabase db push --dry-run
  echo ""
  echo "==> dry-run 完了。適用するには --dry-run なしで実行してください。"
else
  echo "==> マイグレーションをリモートDBに適用します..."
  npx supabase db push
  echo ""
  echo "==> push 完了！"
fi
