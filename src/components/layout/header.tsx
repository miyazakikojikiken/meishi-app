'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import type { SessionUser } from '@/types'

export default function Header({ user }: { user: SessionUser }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0 shadow-sm">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-1.5">
          <User size={14} className="text-gray-400" />
          <span className="font-medium">{user.name}</span>
          {user.role === 'ADMIN' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-lg font-semibold">
              管理者
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut size={14} />
          ログアウト
        </button>
      </div>
    </header>
  )
}
