import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import StatusBadge from '@/components/common/status-badge'
import { Plus, ScanLine, Upload, Clock, CreditCard, AlertCircle, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalContacts, newThisMonth, pendingCount, recentContacts, upcomingActions] =
    await Promise.all([
      db.contact.count({ where: { deletedAt: null } }),
      db.contact.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
      db.contact.count({ where: { deletedAt: null, status: 'pending' } }),
      db.contact.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, companyName: true, fullName: true, title: true, status: true, createdAt: true },
      }),
      db.contact.findMany({
        where: { deletedAt: null, nextAction: { not: null }, status: { in: ['active', 'pending', 'negotiating'] } },
        orderBy: { lastContactedAt: 'asc' },
        take: 5,
        select: { id: true, companyName: true, fullName: true, nextAction: true, lastContactedAt: true, status: true },
      }),
    ])

  const stats = [
    { label: '名刺総数',  value: totalContacts, icon: CreditCard,    color: 'bg-blue-500',   href: '/cards' },
    { label: '今月追加',  value: newThisMonth,   icon: TrendingUp,    color: 'bg-green-500',  href: '/cards' },
    { label: '対応中',    value: pendingCount,   icon: AlertCircle,   color: 'bg-yellow-500', href: '/cards?status=pending' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ウェルカム */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            おはようございます、{session.name}さん
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/cards/ocr"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">
            <ScanLine size={14} />OCR取り込み
          </Link>
          <Link href="/cards/new"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors">
            <Plus size={14} />名刺を追加
          </Link>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center shrink-0`}>
              <s.icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 最近登録した名刺（3/5） */}
        <div className="lg:col-span-3 bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard size={16} className="text-gray-400" />最近登録した名刺
            </h2>
            <Link href="/cards" className="text-xs text-blue-600 hover:underline font-medium">
              全て見る →
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">まだ名刺が登録されていません</p>
              <Link href="/cards/new" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                最初の名刺を登録する
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentContacts.map((c: typeof recentContacts[number]) => (
                <li key={c.id}>
                  <Link href={`/cards/${c.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.companyName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[c.fullName, c.title].filter(Boolean).join(' / ') || '—'}
                      </p>
                    </div>
                    <div className="ml-3 flex items-center gap-2 shrink-0">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-gray-300">{formatDate(c.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 次回アクション（2/5） */}
        <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />次回アクション
            </h2>
          </div>
          {upcomingActions.length === 0 ? (
            <div className="py-12 text-center">
              <Clock size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">アクションはありません</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {upcomingActions.map((c: typeof upcomingActions[number]) => (
                <li key={c.id}>
                  <Link href={`/cards/${c.id}`}
                    className="block px-5 py-3 hover:bg-gray-50 transition-colors">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.companyName}
                      {c.fullName && <span className="text-gray-400 font-normal"> / {c.fullName}</span>}
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5 truncate">→ {c.nextAction}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      最終: {c.lastContactedAt ? formatDate(c.lastContactedAt) : '未接触'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">クイックアクション</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/cards/new',    icon: Plus,      label: '名刺を手動登録' },
            { href: '/cards/ocr',    icon: ScanLine,  label: 'OCR取り込み' },
            { href: '/interactions', icon: Clock,     label: 'コンタクト履歴を見る' },
            ...(session.role === 'ADMIN'
              ? [{ href: '/import', icon: Upload, label: 'Excelインポート' }]
              : []),
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium">
              <item.icon size={14} className="text-gray-400" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
