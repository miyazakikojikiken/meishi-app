'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CreditCard, Building2,
  History, Download, Upload, Settings, ScanLine,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
  exact?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard',    label: 'ダッシュボード', icon: LayoutDashboard, exact: true },
  { href: '/cards',        label: '名刺一覧',       icon: CreditCard },
  { href: '/cards/ocr',    label: 'OCR取り込み',    icon: ScanLine, exact: true },
  { href: '/companies',    label: '会社別一覧',     icon: Building2 },
  { href: '/interactions', label: 'コンタクト履歴', icon: History },
  { href: '/export',       label: 'エクスポート',   icon: Download, exact: true },
  { href: '/import',       label: 'インポート',     icon: Upload, adminOnly: true, exact: true },
  { href: '/admin',        label: '管理設定',       icon: Settings, adminOnly: true, exact: true },
]

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const isAdmin = role === 'ADMIN'

  return (
    <aside className="w-56 min-h-screen bg-gray-950 text-white flex flex-col shrink-0">
      {/* ロゴ */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-gray-800">
        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <CreditCard size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm tracking-wide">名刺管理</span>
      </div>

      {/* ナビ */}
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
    </aside>
  )
}
