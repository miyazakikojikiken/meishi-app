import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from './sidebar'
import Header from './header'

interface AppShellProps {
  children: React.ReactNode
  /** 管理者のみ許可する場合は true */
  adminOnly?: boolean
}

/**
 * 認証チェック + Sidebar/Header を含む共通シェル。
 * 各セクションの layout.tsx からこれを呼び出す。
 */
export default async function AppShell({ children, adminOnly = false }: AppShellProps) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (adminOnly && session.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={session} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
