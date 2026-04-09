import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '名刺管理システム',
  description: '社内向け名刺管理アプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  )
}
