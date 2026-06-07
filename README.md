# profile-liff-app

LINE LIFF アプリ。LINEユーザーのプロフィールを表示し、毎回ランダムな名言（英語→日本語翻訳）を表示・Supabase に記録する。

## 機能

- LINEプロフィール（アイコン・名前）の表示
- ランダム名言の取得と日本語翻訳（ZenQuotes API + MyMemory API）
- 名言履歴の保存・表示（Supabase）

## 技術スタック

| 役割 | 技術 |
|---|---|
| フロントエンド | TanStack Start + React 19 |
| スタイル | Tailwind CSS v4 |
| LINE 連携 | @line/liff |
| バックエンド API | Hono on Cloudflare Workers |
| DB | Supabase |
| ホスティング | Cloudflare Workers |
| パッケージマネージャ | pnpm (workspace) |

## プロジェクト構成

```
profile-liff-app/
├── src/
│   └── routes/
│       ├── __root.tsx
│       └── index.tsx       # プロフィール・名言・履歴画面
├── api/                    # Hono バックエンド (profile-liff-api Worker)
│   └── src/
│       ├── index.ts        # /api/quote, /api/history エンドポイント
│       └── db.ts           # Supabase クライアント
├── .env.sample             # 環境変数のテンプレート
├── vite.config.ts
├── wrangler.jsonc          # Web Worker 設定
└── pnpm-workspace.yaml
```

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数

```bash
cp .env.sample .env
```

`.env` を編集して `VITE_LIFF_ID` を設定する（LINE Developers Console > LIFFアプリ > LIFF ID）。

API の秘密情報は Cloudflare Secrets に登録する：

```bash
cd api
pnpm exec wrangler secret put SUPABASE_URL
pnpm exec wrangler secret put SUPABASE_SERVICE_KEY
```

### 3. LINE Developers 設定

1. [LINE Developers Console](https://developers.line.biz/) でプロバイダーを作成
2. LINEログインチャネルを作成
3. LIFF タブ → 追加（サイズ: Full、スコープ: `profile` / `openid`）
4. LIFF ID を `.env` に設定
5. エンドポイント URL にデプロイ後の URL を登録

### 4. ローカル開発

```bash
pnpm run dev
```

開発時は `@line/liff-mock` により LINE 未認証でも動作する。

## デプロイ

```bash
# API + Web を両方デプロイ
pnpm run deploy

# それぞれ個別に実行する場合
pnpm run deploy:api   # Cloudflare Workers (API)
pnpm run deploy:web   # Cloudflare Workers (Web)
```

### デプロイ先 URL

| | URL |
|---|---|
| Web | https://profile-liff-app.m-igamoto-chaser.workers.dev |
| API | https://profile-liff-api.m-igamoto-chaser.workers.dev |

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/quote` | ランダム名言を取得（英語 + 日本語訳） |
| POST | `/api/history` | 名言を履歴に保存 |
| GET | `/api/history/:userId` | ユーザーの名言履歴を取得（最新10件） |

## 環境変数

| 変数名 | ファイル | 説明 |
|---|---|---|
| `VITE_LIFF_ID` | `.env` | LINE LIFF ID |
| `VITE_API_BASE_URL` | `.env.development` / `.env.production` | バックエンド API の URL |
| `SUPABASE_URL` | Cloudflare Secrets | Supabase プロジェクト URL |
| `SUPABASE_SERVICE_KEY` | Cloudflare Secrets | Supabase サービスロールキー |
