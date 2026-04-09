# 開発者向けスタートガイド

## ⚡ 初日の作業手順（完全版）

### Step 1: 前提確認

```bash
node -v   # 18以上
docker -v # Docker Desktop が起動していること
```

### Step 2: プロジェクト取得・セットアップ

```bash
unzip meishi-app.zip
cd meishi-app

# 環境変数設定
cp .env.example .env.local
```

`.env.local` を開いて最低限これだけ変更：

```env
JWT_SECRET="ここを32文字以上のランダム文字列に変える"
# 例: openssl rand -base64 32 の出力結果を貼る
```

### Step 3: ワンコマンド起動

```bash
bash scripts/setup.sh
```

このスクリプトが以下をすべてやってくれます：
1. PostgreSQL (Docker) 起動
2. `npm install`
3. `prisma migrate dev`
4. seedデータ投入（初期ユーザー・サンプル名刺）
5. uploadsディレクトリ作成

### Step 4: 開発サーバー起動

```bash
npm run dev
```

→ http://localhost:3000 をブラウザで開く

**ログインアカウント:**
| 種別 | メール | パスワード |
|------|-------|-----------|
| 管理者 | admin@example.com | admin1234 |
| 一般 | user@example.com | user1234 |

---

## 📁 コードを読む順番（おすすめ）

```
1. prisma/schema.prisma       # DBの全体像を把握
2. src/types/index.ts         # 共通型定義・選択肢マスタ
3. src/lib/normalize.ts       # 名寄せ・正規化ロジック
4. src/lib/duplicate-score.ts # 重複判定ロジック
5. src/app/api/cards/route.ts # 名刺APIの実装
6. src/app/cards/page.tsx     # 名刺一覧ページ
7. src/app/cards/[id]/page.tsx# 名刺詳細ページ
```

---

## 🔧 よく使うコマンド

```bash
# DB操作
npm run db:migrate    # スキーマ変更をDBに反映
npm run db:seed       # 初期データ投入（idempotent）
npm run db:studio     # Prisma Studio（GUI）起動
npm run db:reset      # 全テーブルを初期化（開発用）

# 品質チェック
npx tsc --noEmit      # 型チェック
npx next lint         # ESLint

# 本番ビルド（prisma generate 後に実行）
npm run build
npm start
```

---

## 🗄️ DBへの接続方法

```bash
# Prisma Studio（ブラウザGUI）
npm run db:studio

# psql で直接接続
docker exec -it meishi_postgres psql -U meishi_user -d meishi_db

# よく使うSQL
SELECT id, company_name, full_name, status FROM contacts LIMIT 10;
SELECT * FROM ocr_jobs ORDER BY created_at DESC LIMIT 5;
SELECT * FROM import_jobs ORDER BY created_at DESC LIMIT 5;
```

---

## 📂 ファイルストレージ

開発環境では `./uploads/` にファイルが保存されます：
```
uploads/
├── ocr/      # OCR用名刺画像
└── imports/  # Excelインポートファイル
```

本番ではS3互換ストレージ（Cloudflare R2推奨）に切り替えます。
`src/lib/storage.ts` の `saveFile` 関数を差し替えるだけです。

---

## 🔍 OCR動作確認

**APIキーなしでも動作確認できます：**

1. `/cards/ocr` にアクセス
2. 任意の画像ファイルをアップロード
3. OCR実行をクリック
4. ダミーテキストで自動的に項目が埋まる

本番用APIキーの設定：
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. Cloud Vision API を有効化
3. APIキーを作成し `.env.local` の `GOOGLE_VISION_API_KEY` に設定

---

## 📥 Excelインポートのテスト

1. 管理者でログイン
2. 左メニュー「インポート」
3. `prisma/seed.ts` に対応したExcelを用意するか、以下のダウンロードサンプルを使用

最小構成のCSVサンプル：
```csv
会社名,部署名,役職,氏名,TEL-1(1),Email(1),対応状況
株式会社テスト,営業部,部長,テスト 太郎,03-0000-0001,test@test.com,active
株式会社サンプル,開発部,エンジニア,サンプル 花子,03-0000-0002,sample@sample.com,pending
```

---

## 🐛 よくあるトラブルと対処

### `prisma generate` が失敗する
→ DBが起動しているか確認：`docker compose ps`
→ `DATABASE_URL` が `.env.local` に設定されているか確認

### ポート5432がすでに使われている
```bash
# 既存のPostgreSQLプロセスを確認
lsof -i :5432
# docker-compose.yml のポートを変更（例: 5433:5432）
# DATABASE_URL も同様に変更
```

### `npm run dev` でエラー
```bash
# ログを確認
npm run dev 2>&1 | head -30
# node_modules を再インストール
rm -rf node_modules && npm install
```

### 名刺画像が表示されない
→ `uploads/` ディレクトリが存在するか確認：`ls uploads/`
→ `/api/files/` ルートが正常か確認：`curl -I http://localhost:3000/api/files/ocr/test.jpg`

---

## 🏗️ 将来の拡張ポイント

| 機能 | 実装場所 | 難易度 |
|------|---------|--------|
| Azure OCRへの差し替え | `src/lib/ocr/google-vision.ts` の `OcrProvider` interface | ★★☆ |
| S3ストレージ切り替え | `src/lib/storage.ts` の `saveFile` | ★☆☆ |
| メール通知 | `src/lib/mailer.ts` を新規作成 | ★★☆ |
| Slack通知 | `src/lib/slack.ts` を新規作成 | ★☆☆ |
| 重複merge機能 | `src/app/api/cards/merge/route.ts` を追加 | ★★★ |
| タグ管理 | `tag` テーブル追加 + M:N関連 | ★★☆ |
