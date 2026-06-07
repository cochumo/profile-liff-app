# Profile LIFF App

LINEアプリ内で起動し、ユーザーのプロフィール（アイコンと名前）を表示するLIFFアプリ。

## 技術スタック

- **フレームワーク**: TanStack Start
- **言語**: TypeScript
- **UI**: Tailwind CSS v4
- **SDK**: @line/liff
- **ホスティング**: Cloudflare Pages

## プロジェクト構成

```
profile-liff-app/
├── app/
│   ├── routes/
│   │   └── index.tsx       # プロフィール表示画面
│   ├── client.tsx
│   ├── router.tsx
│   └── ssr.tsx
├── public/
├── .env                    # VITE_LIFF_ID=your_liff_id
├── app.config.ts
├── package.json
└── wrangler.toml           # Cloudflare設定
```

## セットアップ手順

### 1. LINE Developers設定

1. [LINE Developers Console](https://developers.line.biz/) でプロバイダーを作成
2. 「LINEログイン」チャネルを作成
3. LIFFタブ → 「追加」でLIFFアプリを作成
   - サイズ: Full
   - スコープ: `profile` と `openid` を有効化
4. LIFF IDをコピー

### 2. プロジェクト初期化

```bash
npx create-tsrouter-app@latest profile-liff-app --framework tanstack-start --tailwind
cd profile-liff-app
npm install @line/liff
```

### 3. 環境変数

`.env` に追記:

```
VITE_LIFF_ID=your_liff_id_here
```

### 4. Cloudflareデプロイ

```bash
# Wranglerインストール
npm install -D wrangler

# ビルド
npm run build

# デプロイ
npx wrangler pages deploy dist
```

デプロイ後のURLをLINE Developers ConsoleのエンドポイントURLに登録する。

## 主要実装

### LIFF初期化とプロフィール取得

`app/routes/index.tsx` でLIFF SDKを初期化し、`liff.getProfile()` でプロフィールを取得する。

```tsx
import liff from '@line/liff'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  component: ProfilePage,
})

function ProfilePage() {
  const [profile, setProfile] = useState<{ displayName: string; pictureUrl?: string } | null>(null)

  useEffect(() => {
    liff.init({ liffId: import.meta.env.VITE_LIFF_ID }).then(async () => {
      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }
      const p = await liff.getProfile()
      setProfile({ displayName: p.displayName, pictureUrl: p.pictureUrl })
    })
  }, [])

  if (!profile) return <p>Loading...</p>

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      {profile.pictureUrl && (
        <img src={profile.pictureUrl} alt="avatar" className="w-24 h-24 rounded-full" />
      )}
      <p className="text-xl font-bold">{profile.displayName}</p>
    </div>
  )
}
```

### wrangler.toml

```toml
name = "profile-liff-app"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

## 注意点

- LIFF SDKはクライアントサイドのみで動作するため、`useEffect` 内で初期化する
- TanStack Startのサーバーサイド機能（`createServerFn` 等）でLIFF SDKを呼び出さないこと
- Cloudflare Pagesは静的ファイルとしてホストするため、SSRが必要な場合は Cloudflare Workers + `@cloudflare/vite-plugin` の構成に変更する
- 開発時は `https` が必要なため、LIFFのエンドポイントURLはlocalhostではなくCloudflare PagesのURLを使う
