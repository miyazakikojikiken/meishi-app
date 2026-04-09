# 名刺管理システム

社内向け名刺管理Webアプリケーション。

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| DB | PostgreSQL 16 |
| ORM | Prisma 5 |
| UI | shadcn/ui風 + Tailwind CSS |
| 認証 | JWT（jose） |
| OCR | Google Cloud Vision API |
| インポート | xlsx |
| バリデーション | Zod |

---

## ローカル起動手順

### 前提条件

- Node.js 18以上
- Docker & Docker Compose（PostgreSQL用）
- Git

---

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd meishi-app
```

---

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を開いて以下を設定：

```env
# DB（Docker Compose の設定と合わせる）
DATABASE_URL="postgresql://meishi_user:meishi_password@localhost:5432/meishi_db"

# JWT シークレット（必ず変更すること）
JWT_SECRET="your-super-secret-jwt-key"

# アプリURL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google Cloud Vision API（任意・未設定でもダミーデータで動作確認可）
GOOGLE_VISION_API_KEY="your-api-key"

# アップロード先（デフォルトはプロジェクトルート/uploads）
UPLOAD_DIR="./uploads"
```

---

### 3. PostgreSQL 起動（Docker）

```bash
docker compose up -d postgres
```

起動確認：

```bash
docker compose ps
# postgres が healthy になるまで待つ
```

---

### 4. 依存パッケージのインストール

```bash
npm install
```

---

### 5. Prisma マイグレーション

```bash
# DBスキーマ適用
npx prisma migrate dev --name init

# Prismaクライアント生成（migrateで自動実行されるが念のため）
npx prisma generate
```

---

### 6. seed データの投入

```bash
npm run db:seed
```

初期ユーザー：

| 種別 | メール | パスワード |
|---|---|---|
| 管理者 | admin@example.com | admin1234 |
| 一般 | user@example.com | user1234 |

---

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く。

---

### 8. アップロードディレクトリの作成（初回）

```bash
mkdir -p uploads/ocr uploads/imports
```

---

## 環境変数 一覧

| 変数名 | 必須 | 説明 |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL 接続URL |
| `JWT_SECRET` | ✅ | JWT署名シークレット（32文字以上推奨）|
| `NEXT_PUBLIC_APP_URL` | ✅ | アプリのベースURL |
| `GOOGLE_VISION_API_KEY` | — | Google Cloud Vision API キー（未設定でもダミーモードで動作）|
| `UPLOAD_DIR` | — | ファイルアップロード先（デフォルト: `./uploads`）|

---

## OCR設定方法

### Google Cloud Vision API キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. 「Cloud Vision API」を有効化
3. 「認証情報」→「APIキーを作成」
4. `.env.local` の `GOOGLE_VISION_API_KEY` に設定

### APIキー未設定時の動作

`GOOGLE_VISION_API_KEY` が未設定の場合、ダミーテキストでOCR処理をシミュレートします。  
UI・フロー全体の動作確認はAPIキーなしで可能です。

---

## Excelインポート方法

1. 管理者アカウント（admin@example.com）でログイン
2. 左メニュー「インポート」をクリック
3. Excel（.xlsx/.xls）またはCSV（.csv）を選択
4. 重複ポリシーを選択：
   - **スキップ**：既存データと重複する行は無視
   - **上書き**：既存データを更新
5. 「インポート実行」ボタンをクリック
6. 完了後、成功/スキップ/エラー件数を確認

### 対応列名（名刺台帳シート）

| 列名 | 必須 | DBフィールド |
|---|---|---|
| 会社名 | ✅ | companyName |
| 部署名 | — | department |
| 役職 | — | title |
| 氏名 | — | fullName |
| 'TEL-1(1)' または 電話番号 | — | tel |
| 'Email(1)' または メールアドレス | — | email |
| 携帯電話(1) | — | mobile |
| 対応状況 | — | status |
| 次回アクション | — | nextAction |
| 最終接触日 | — | lastContactedAt |
| コンタクト日 | — | → interaction_histories |
| 区分 | — | → interaction_histories |
| コンタクトメモ | — | → interaction_histories |

---

## よく使うコマンド

```bash
# 開発サーバー起動
npm run dev

# DB マイグレーション
npm run db:migrate

# seed データ投入
npm run db:seed

# Prisma Studio（DB GUI）
npm run db:studio

# DB リセット（全データ削除・再マイグレーション）
npm run db:reset

# ビルド
npm run build

# 本番起動
npm start
```

---

## ディレクトリ構成

```
meishi-app/
├── docker-compose.yml
├── package.json
├── prisma/
│   ├── schema.prisma      # DBスキーマ
│   └── seed.ts            # 初期データ
├── uploads/               # アップロードファイル（.gitignore推奨）
│   ├── ocr/               # OCR用画像
│   └── imports/           # インポート用Excel
└── src/
    ├── app/
    │   ├── api/            # Route Handlers (REST API)
    │   │   ├── auth/       # ログイン・ログアウト
    │   │   ├── cards/      # 名刺 CRUD + OCR
    │   │   ├── companies/  # 会社別一覧
    │   │   ├── interactions/ # コンタクト履歴
    │   │   ├── import/     # Excelインポート
    │   │   ├── export/     # CSV/Excelエクスポート
    │   │   └── files/      # 静的ファイル配信
    │   ├── cards/          # 名刺関連ページ
    │   ├── companies/      # 会社別一覧ページ
    │   ├── interactions/   # 履歴ページ
    │   ├── import/         # インポートページ
    │   ├── export/         # エクスポートページ
    │   ├── dashboard/      # ダッシュボード
    │   └── login/          # ログインページ
    ├── components/
    │   ├── ui/             # 基本UIコンポーネント
    │   ├── layout/         # Sidebar, Header
    │   ├── cards/          # 名刺関連コンポーネント
    │   ├── ocr/            # OCR関連コンポーネント
    │   └── common/         # 共通コンポーネント
    ├── lib/
    │   ├── db.ts           # Prismaクライアント
    │   ├── auth.ts         # JWT認証
    │   ├── normalize.ts    # 正規化ユーティリティ
    │   ├── duplicate-score.ts # 重複判定
    │   ├── storage.ts      # ファイルストレージ
    │   ├── api-response.ts # APIレスポンスヘルパー
    │   ├── utils.ts        # 汎用ユーティリティ
    │   ├── ocr/
    │   │   └── google-vision.ts # OCRラッパー
    │   └── import/
    │       └── excel-import.ts  # Excelインポート処理
    └── types/
        └── index.ts        # 共通型定義
```

---

## 本番デプロイ（self-host）

### Docker Compose + Nginx 構成

```bash
# 1. ビルド
npm run build

# 2. 環境変数を本番用に設定
cp .env.example .env.production
# JWT_SECRET を openssl rand -base64 32 で生成した値に変更

# 3. DB マイグレーション（本番）
DATABASE_URL="..." npx prisma migrate deploy

# 4. seed（初回のみ）
npm run db:seed

# 5. PM2 で起動
npm install -g pm2
pm2 start npm --name meishi-app -- start
pm2 save && pm2 startup
```

### Nginx 設定例

```nginx
server {
    listen 443 ssl;
    server_name meishi.yourdomain.com;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### バックアップ

```bash
# DB バックアップ（cron で毎日実行）
pg_dump -U meishi_user meishi_db | gzip > /backup/meishi_$(date +%Y%m%d).sql.gz

# uploads ディレクトリのバックアップ
rsync -av ./uploads/ /backup/uploads/
```

---

## トラブルシューティング

### DB 接続エラー

```bash
# PostgreSQL が起動しているか確認
docker compose ps

# ログ確認
docker compose logs postgres
```

### Prisma エラー

```bash
# クライアント再生成
npx prisma generate

# スキーマとDBの差分確認
npx prisma migrate status
```

### アップロードディレクトリが見つからない

```bash
mkdir -p uploads/ocr uploads/imports
```

### OCR が動かない

- `GOOGLE_VISION_API_KEY` が `.env.local` に設定されているか確認
- Google Cloud Console で Vision API が有効になっているか確認
- APIキー未設定の場合はダミーモードで動作（コンソールに警告が出る）

---

## セキュリティ注意事項

- 本番環境では `JWT_SECRET` を必ず変更すること
- `uploads/` ディレクトリは Web 公開しないこと（API 経由でのみ配信）
- 社内ネットワーク外からのアクセスは Nginx で IP 制限を推奨
- Google Cloud Vision API キーは IP 制限を設定すること

---

## ライセンス

MIT
