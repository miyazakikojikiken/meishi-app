'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Badge, Skeleton } from '@/components/ui/index'
import Pagination from '@/components/common/pagination'
import { formatDate } from '@/lib/utils'
import { INTERACTION_TYPE_OPTIONS } from '@/types'
import { History, Search, RotateCcw, MapPin, ExternalLink } from 'lucide-react'

interface Interaction {
  id: string
  contactedAt: string
  interactionType: string
  title: string | null
  place: string | null
  memo: string | null
  nextAction: string | null
  status: string | null
  contact: {
    id: string
    companyName: string
    fullName: string | null
    title: string | null
    department: string | null
  }
  creator: { id: string; name: string } | null
}

const TYPE_COLORS: Record<string, string> = {
  商談: 'bg-blue-100 text-blue-800',
  訪問: 'bg-green-100 text-green-800',
  電話: 'bg-yellow-100 text-yellow-800',
  メール: 'bg-purple-100 text-purple-800',
  展示会: 'bg-orange-100 text-orange-800',
  オンライン: 'bg-cyan-100 text-cyan-800',
  その他: 'bg-gray-100 text-gray-700',
}

export default function InteractionsPage() {
  const router = useRouter()
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    companyName: '',
    type: '',
    from: '',
    to: '',
  })
  const [applied, setApplied] = useState(filters)
  const limit = 50

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (applied.companyName) params.set('company_name', applied.companyName)
      if (applied.type) params.set('type', applied.type)
      if (applied.from) params.set('from', applied.from)
      if (applied.to) params.set('to', applied.to)

      const res = await fetch(`/api/interactions?${params}`)
      if (!res.ok) throw new Error('取得失敗')
      const json = await res.json()
      setInteractions(json.data?.data ?? [])
      setTotal(json.data?.total ?? 0)
      setTotalPages(json.data?.totalPages ?? 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, applied])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSearch() {
    setApplied(filters)
    setPage(1)
  }

  function handleReset() {
    const empty = { companyName: '', type: '', from: '', to: '' }
    setFilters(empty)
    setApplied(empty)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <History size={22} />
        コンタクト履歴
      </h1>

      {/* フィルター */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">会社名</Label>
            <Input
              placeholder="会社名で絞り込み"
              value={filters.companyName}
              onChange={(e) => setFilters((p) => ({ ...p, companyName: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">区分</Label>
            <Select
              value={filters.type}
              onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="">すべて</option>
              {INTERACTION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">期間（開始）</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">期間（終了）</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSearch}>
            <Search size={14} className="mr-1.5" />
            絞り込む
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw size={14} className="mr-1.5" />
            リセット
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500">{total}件</p>

      {/* タイムライン */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : interactions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          コンタクト履歴がありません
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((h) => (
            <div
              key={h.id}
              className="bg-white border rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  {/* 日付・区分 */}
                  <div className="shrink-0 text-center">
                    <p className="text-sm font-bold text-gray-800">
                      {formatDate(h.contactedAt)}
                    </p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${
                        TYPE_COLORS[h.interactionType] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {h.interactionType}
                    </span>
                  </div>

                  {/* 本文 */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        className="text-sm font-semibold text-blue-700 hover:underline"
                        onClick={() => router.push(`/cards/${h.contact.id}`)}
                      >
                        {h.contact.companyName}
                      </button>
                      {h.contact.fullName && (
                        <span className="text-sm text-gray-600">
                          {h.contact.fullName}
                        </span>
                      )}
                      {(h.contact.title || h.contact.department) && (
                        <span className="text-xs text-gray-400">
                          {[h.contact.title, h.contact.department]
                            .filter(Boolean)
                            .join(' / ')}
                        </span>
                      )}
                    </div>

                    {h.title && (
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{h.title}</p>
                    )}
                    {h.place && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />
                        {h.place}
                      </p>
                    )}
                    {h.memo && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{h.memo}</p>
                    )}
                    {h.nextAction && (
                      <p className="text-xs text-blue-700 mt-1.5 flex items-center gap-1">
                        <span className="font-medium">→ 次回:</span> {h.nextAction}
                      </p>
                    )}
                  </div>
                </div>

                {/* 右側 */}
                <div className="flex items-center gap-2 shrink-0">
                  {h.creator && (
                    <span className="text-xs text-gray-400">{h.creator.name}</span>
                  )}
                  <button
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                    title="名刺を開く"
                    onClick={() => router.push(`/cards/${h.contact.id}`)}
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
