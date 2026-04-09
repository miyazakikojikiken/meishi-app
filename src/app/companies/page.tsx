'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Card, CardContent, Skeleton } from '@/components/ui/index'
import Pagination from '@/components/common/pagination'
import StatusBadge from '@/components/common/status-badge'
import { formatDate } from '@/lib/utils'
import { Building2, ChevronDown, ChevronUp, Search, Users } from 'lucide-react'

interface CompanyGroup {
  companyName: string
  companyNameKana: string | null
  contactCount: number
  contacts: {
    id: string
    fullName: string | null
    title: string | null
    department: string | null
    tel: string | null
    email: string | null
    status: string | null
    lastContactedAt: string | null
    nextAction: string | null
  }[]
}

export default function CompaniesPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<CompanyGroup[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const limit = 20

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('name', search)

      const res = await fetch(`/api/companies?${params}`)
      if (!res.ok) throw new Error('取得に失敗しました')
      const json = await res.json()
      setGroups(json.data?.data ?? [])
      setTotal(json.data?.total ?? 0)
      setTotalPages(json.data?.totalPages ?? 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  function toggleExpand(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function handleSearch() {
    setSearch(inputVal)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 size={22} />
          会社別一覧
        </h1>
        <div className="flex gap-2">
          <Input
            placeholder="会社名で検索..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-56"
          />
          <Button size="sm" onClick={handleSearch}>
            <Search size={14} className="mr-1.5" />
            検索
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {total}社
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          会社が見つかりません
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const isOpen = expanded.has(g.companyName)
            return (
              <Card key={g.companyName} className="overflow-hidden">
                {/* 会社ヘッダー行 */}
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(g.companyName)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {g.companyName}
                      </p>
                      {g.companyNameKana && (
                        <p className="text-xs text-gray-400">{g.companyNameKana}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Users size={14} />
                      {g.contactCount}名
                    </span>
                    {isOpen
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />
                    }
                  </div>
                </button>

                {/* 担当者一覧（展開時） */}
                {isOpen && (
                  <div className="border-t bg-gray-50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-100">
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-36">氏名</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-40">役職・部署</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-32">電話番号</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">メール</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-24">状況</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-24">最終接触</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.contacts.map((c) => (
                          <tr
                            key={c.id}
                            className="border-b last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/cards/${c.id}`)}
                          >
                            <td className="px-4 py-2.5 font-medium text-gray-900">
                              {c.fullName ?? '—'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                              {[c.title, c.department].filter(Boolean).join(' / ') || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">{c.tel ?? '—'}</td>
                            <td className="px-4 py-2.5 text-gray-600 max-w-[200px] truncate">
                              {c.email ?? '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                              {formatDate(c.lastContactedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {g.contacts[0]?.nextAction && (
                      <div className="px-4 py-2 border-t bg-blue-50">
                        <p className="text-xs text-blue-700">
                          次回アクション: {g.contacts[0].nextAction}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {!loading && total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
