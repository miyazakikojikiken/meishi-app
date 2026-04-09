'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import CardSearchForm from '@/components/cards/card-search-form'
import CardTable from '@/components/cards/card-table'
import Pagination from '@/components/common/pagination'
import { Button } from '@/components/ui/button'
import { Plus, ScanLine, Download, FileSpreadsheet } from 'lucide-react'
import type { CardFilters } from '@/types'
import type { Contact } from '@/types/models'

function CardsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<CardFilters>({})
  const [loading, setLoading] = useState(true)
  const limit = 50

  const fetchCards = useCallback(async (f: CardFilters, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', String(limit))
      if (f.companyName)       params.set('company_name', f.companyName)
      if (f.fullName)          params.set('full_name', f.fullName)
      if (f.department)        params.set('department', f.department)
      if (f.tel)               params.set('tel', f.tel)
      if (f.email)             params.set('email', f.email)
      if (f.status)            params.set('status', f.status)
      if (f.category)          params.set('category', f.category)
      if (f.subCategory)       params.set('sub_category', f.subCategory)
      if (f.lastContactedFrom) params.set('last_contacted_from', f.lastContactedFrom)
      if (f.lastContactedTo)   params.set('last_contacted_to', f.lastContactedTo)

      const res = await fetch(`/api/cards?${params}`)
      if (!res.ok) throw new Error('取得失敗')
      const json = await res.json()
      setContacts(json.data?.data ?? [])
      setTotal(json.data?.total ?? 0)
      setTotalPages(json.data?.totalPages ?? 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCards(filters, page)
  }, [fetchCards, filters, page])

  function handleSearch(f: CardFilters) {
    setFilters(f)
    setPage(1)
  }

  function handleExport(fmt: 'csv' | 'xlsx') {
    const params = new URLSearchParams({ format: fmt })
    if (filters.companyName) params.set('company_name', filters.companyName)
    if (filters.status)      params.set('status', filters.status)
    if (filters.category)    params.set('category', filters.category)
    window.open(`/api/export/cards?${params}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">名刺一覧</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {total.toLocaleString()} 件
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* エクスポート */}
          <div className="relative group">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download size={14} />
              エクスポート
            </Button>
            <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-20">
              <div className="bg-white border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                <button
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  onClick={() => handleExport('csv')}
                >
                  <Download size={13} className="text-gray-400" />
                  CSV (.csv)
                </button>
                <button
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 transition-colors border-t"
                  onClick={() => handleExport('xlsx')}
                >
                  <FileSpreadsheet size={13} className="text-gray-400" />
                  Excel (.xlsx)
                </button>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" className="gap-1.5"
            onClick={() => router.push('/cards/ocr')}>
            <ScanLine size={14} />
            OCR取り込み
          </Button>

          <Button size="sm" className="gap-1.5"
            onClick={() => router.push('/cards/new')}>
            <Plus size={14} />
            新規登録
          </Button>
        </div>
      </div>

      {/* 検索フォーム（ライブサーチ付き） */}
      <CardSearchForm
        onSearch={handleSearch}
        defaultValues={filters}
        liveSearch={true}
      />

      {/* テーブル */}
      <CardTable contacts={contacts} loading={loading} />

      {/* ページネーション */}
      {!loading && total > limit && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  )
}

export default function CardsPage() {
  return (
    <Suspense>
      <CardsContent />
    </Suspense>
  )
}
