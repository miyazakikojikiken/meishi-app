'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CreditCard, LayoutDashboard, Clock, Download, Upload, Settings, Building2, Camera, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard, exact: true },
  { href: '/cards', label: '名刺一覧', icon: CreditCard, exact: false },
  { href: '/cards/ocr', label: 'OCR取り込み', icon: Camera, exact: true },
  { href: '/companies', label: '会社別一覧', icon: Building2, exact: false },
  { href: '/interactions', label: 'コンタクト履歴', icon: Clock, exact: false },
  { href: '/export', label: 'エクスポート', icon: Download, exact: true },
  { href: '/import', label: 'インポート', icon: Upload, adminOnly: true, exact: true },
  { href: '/admin', label: '管理設定', icon: Settings, adminOnly: true, exact: true },
]

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const isAdmin = role === 'ADMIN'
  const [isOpen, setIsOpen] = useState(false)

  const NavContent = () => (
    <>
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-gray-800">
        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <CreditCard size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm tracking-wide">名刺管理</span>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems
          .filter(item => !item.adminOnly || isAdmin)
          .map(item => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                )}
              >
                <item.icon size={16} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
      </nav>
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">v0.1.0</p>
      </div>
    </>
  )

  return (
    <>
      {/* モバイル: ハンバーガーボタン */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* モバイル: オーバーレイ */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* モバイル: スライドメニュー */}
      <aside className={cn(
        'md:hidden fixed top-0 left-0 h-full w-64 bg-gray-950 text-white flex flex-col z-50 transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent />
      </aside>

      {/* デスクトップ: 通常サイドバー */}
      <aside className="hidden md:flex w-56 min-h-screen bg-gray-950 text-white flex-col shrink-0">
        <NavContent />
      </aside>
    </>
  )
}
