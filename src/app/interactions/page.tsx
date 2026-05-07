'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Skeleton } from '@/components/ui/index'
import Pagination from '@/components/common/pagination'
import { formatDate } from '@/lib/utils'
import { INTERACTION_TYPE_OPTIONS } from '@/types'
import { History, Search, RotateCcw, MapPin, ExternalLink, ChevronDown, ChevronUp, Users } from 'lucide-react'

interface Interaction {
  id: string
  contactedAt: string
  interactionType: string
  title: string | null
  place: string | null
  memo: string | null
  participants: string | null
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
  商談: 'bg-blue-100 text-blue-700 border-blue-200',
  訪問: 'bg-green-100 text-green-700 border-green-200',
  電話: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  メール: 'bg-purple-100 text-purple-700 border-purple-200',
  展示会: 'bg-orange-100 text-orange-700 border-orange-200',
  オンライン: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  その他: 'bg-gray-100 text-gray-600 border-gray-200',
}

function InteractionCard({ h }: { h: Interaction }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const isLong = (h.memo?.length ?? 0) > 80
  const typeColor = TYPE_COLORS[h.interactionType] ?? TYPE_COLORS['その他']

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-gray-800">{formatDate(h.contactedAt)}</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${typeColor}`}>
            {h.interactionType}
          </span>
          <button
            className="text-sm font-semibold text-blue-700 hover:underline"
            onClick={() => router.push(`/cards/${h.contact.id}`)}
          >
            {h.contact.companyName}
          </button>
          {h.contact.fullName && (
            <span className="text-sm text-gray-600">{h.contact.fullName}</span>
          )}
          {(h.contact.title || h.contact.department) && (
            <span className="text-xs text-gray-400">
              {[h.contact.title, h.contact.department].filter(Boolean).join(' / ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {h.creator && (
            <span className="text-xs text-gray-400">{h.creator.name}</span>
          )}
          <button
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
            onClick={() => router.push(`/cards/${h.contact.id}`)}
            title="名刺を開く"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* 本文 */}
      <div className="px-4 py-3 space-y-2">
        {h.title && (
          <p className="text-sm font-semibold text-gray-800">{h.title}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {h.place && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={11} className="text-gray-400" />
              {h.place}
            </p>
          )}
          {h.participants && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Users size={11} className="text-gray-400" />
              {h.participants}
            </p>
          )}
        </div>

        {h.memo && (
          <div>
            <p className={`text-sm text-gray-600 leading-relaxed whitespace-pre-wrap ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
              {h.memo}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
              >
                {expanded ? <><ChevronUp size={12} />閉じる</> : <><ChevronDown size={12} />続きを見る</>}
              </button>
            )}
          </div>
        )}

        {h.nextAction && (
          <div className="mt-1 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">
              → 次回アクション: {h.nextAction}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InteractionsPage() {
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

  function handleSearch() { setApplied(filters); setPage(1) }
  function handleReset() {
    const empty = { companyName: '', type: '', from: '', to: '' }
    setFilters(empty); setApplied(empty); setPage(1)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <History size={22} />
        コンタクト履歴
      </h1>

      {/* フィルター */}
      <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
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
            <Input type="date" value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">期間（終了）</Label>
            <Input type="date" value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSearch}>
            <Search size={14} className="mr-1.5" />絞り込む
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw size={14} className="mr-1.5" />リセット
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500">{total}件</p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : interactions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          コンタクト履歴がありません
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((h) => (
            <InteractionCard key={h.id} h={h} />
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
