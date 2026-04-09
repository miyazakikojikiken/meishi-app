/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['xlsx'],
  eslint: {
    // ビルド時のESLintを無効化（開発時は npm run lint で実行）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 型エラーはtscで事前確認済みのためビルド時はスキップ
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
