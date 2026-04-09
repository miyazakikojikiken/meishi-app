#!/bin/bash
# ================================================================
# 名刺管理システム セットアップスクリプト
# Usage: bash scripts/setup.sh
# ================================================================
set -e

echo "🚀 名刺管理システム セットアップ開始..."
echo ""

# 1. 環境変数チェック
if [ ! -f ".env.local" ]; then
  echo "📋 .env.local を .env.example からコピーします..."
  cp .env.example .env.local
  echo "⚠️  .env.local を編集して JWT_SECRET などを設定してください"
  echo ""
fi

# 2. PostgreSQL 起動
echo "🐘 PostgreSQL を起動します..."
docker compose up -d postgres

echo "⏳ PostgreSQL の起動を待っています..."
sleep 5

# ヘルスチェック（最大30秒待機）
for i in $(seq 1 15); do
  if docker compose exec -T postgres pg_isready -U meishi_user -d meishi_db > /dev/null 2>&1; then
    echo "✅ PostgreSQL 起動完了"
    break
  fi
  if [ $i -eq 15 ]; then
    echo "❌ PostgreSQL の起動がタイムアウトしました"
    exit 1
  fi
  sleep 2
done

echo ""

# 3. npm install
echo "📦 パッケージをインストールします..."
npm install

echo ""

# 4. Prisma マイグレーション
echo "🗄️  データベースマイグレーションを実行します..."
npx prisma migrate dev --name init

echo ""

# 5. seed
echo "🌱 初期データを投入します..."
npm run db:seed

echo ""

# 6. アップロードディレクトリ作成
echo "📁 アップロードディレクトリを作成します..."
mkdir -p uploads/ocr uploads/imports

echo ""
echo "✨ セットアップ完了！"
echo ""
echo "以下のコマンドで開発サーバーを起動してください："
echo "  npm run dev"
echo ""
echo "ブラウザで http://localhost:3000 を開き、以下でログイン："
echo "  管理者: admin@example.com / admin1234"
echo "  一般:   user@example.com  / user1234"
echo ""
