import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // xlsxなどNode.js専用モジュールをサーバー外部化
  // (Next.js 14.2以降の正しいオプション名)
  images: {
    remotePatterns: [],
  },
  // ファイルアップロードのボディサイズ上限
  experimental: {
    serverComponentsExternalPackages: ['xlsx', 'bcryptjs'],
  },
}

export default nextConfig
