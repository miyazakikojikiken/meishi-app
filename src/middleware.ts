import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

// 認証不要のパス
const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 公開パスはスルー
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 静的ファイルはスルー
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|ico|svg|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // トークン検証
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    // APIリクエストは 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }
    // ページリクエストはログインへリダイレクト
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const user = await verifyToken(token)
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'セッションが無効です' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // 管理者専用パスのチェック
  const ADMIN_PATHS = ['/admin', '/import', '/api/admin', '/api/import']
  if (
    ADMIN_PATHS.some((p) => pathname.startsWith(p)) &&
    user.role !== 'ADMIN'
  ) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * _next/static, _next/image, favicon.ico を除くすべてのパスにマッチ
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
