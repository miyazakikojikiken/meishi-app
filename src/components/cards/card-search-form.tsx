'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/index'
import { Search, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { STATUS_OPTIONS, CATEGORY_OPTIONS } from '@/types'
import type { CardFilters } from '@/types'

interface CardSearchFormProps {
  onSearch: (filters: CardFilters) => void
  defaultValues?: CardFilters
  /** trueにするとキー入力ごとにonSearchが呼ばれる */
  liveSearch?: boolean
}

export default function CardSearchForm({
  onSearch,
  defaultValues = {},
  liveSearch = true,
}: CardSearchFormProps) {
  const [values, setValues] = useState<CardFilters>(defaultValues)
  const [expanded, setExpanded] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // liveSearchモード: テキスト変更後300ms待ってから検索
  function setField<K extends keyof CardFilters>(key: K, val: CardFilters[K]) {
    const next = { ...values, [key]: val }
    setValues(next)

    if (liveSearch && (key === 'companyName' || key === 'fullName' || key === 'department' || key === 'email' || key === 'tel')) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const cleaned = Object.fromEntries(
          Object.entries(next).filter(([, v]) => v !== '' && v !== undefined)
        ) as CardFilters
        onSearch({ ...cleaned, page: 1 })
      }, 300)
    }
  }

  // セレクト変更は即時検索
  function setSelectField<K extends keyof CardFilters>(key: K, val: CardFilters[K]) {
    const next = { ...values, [key]: val }
    setValues(next)
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== '' && v !== undefined)
    ) as CardFilters
    onSearch({ ...cleaned, page: 1 })
  }

  function handleSearch() {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined)
    ) as CardFilters
    onSearch({ ...cleaned, page: 1 })
  }

  function handleReset() {
    setValues({})
    onSearch({ page: 1 })
  }

  // activeフィルター数カウント（表示切り替えの目安）
  const activeCount = Object.values(values).filter(
    (v) => v !== '' && v !== undefined
  ).length

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      {/* メイン行 */}
      <div className="flex items-center gap-2 p-3">
        {/* 検索ボックス群 */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* 会社名 */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="会社名"
              value={values.companyName ?? ''}
              onChange={(e) => setField('companyName', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-8 pr-3 h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
            {values.companyName && (
              <button onClick={() => setField('companyName', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* 氏名 */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="氏名"
              value={values.fullName ?? ''}
              onChange={(e) => setField('fullName', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-8 pr-3 h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
            {values.fullName && (
              <button onClick={() => setField('fullName', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* 部署名 */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="部署名"
              value={values.department ?? ''}
              onChange={(e) => setField('department', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-8 pr-3 h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
            {values.department && (
              <button onClick={() => setField('department', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* 対応状況 */}
          <select
            value={values.status ?? ''}
            onChange={(e) => setSelectField('status', e.target.value)}
            className="h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 px-3"
          >
            <option value="">対応状況（全て）</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" onClick={handleSearch} className="h-9">
            <Search size={14} className="mr-1" />
            検索
          </Button>
          {activeCount > 0 && (
            <button
              onClick={handleReset}
              className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={13} />
              クリア
              <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium ml-0.5">
                {activeCount}
              </span>
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`h-9 px-3 rounded-lg border text-sm flex items-center gap-1 transition-colors ${
              expanded
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={13} />
            詳細
          </button>
        </div>
      </div>

      {/* 詳細フィルター */}
      {expanded && (
        <div className="border-t bg-gray-50 px-3 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">メールアドレス</Label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="example@domain.com"
                  value={values.email ?? ''}
                  onChange={(e) => setField('email', e.target.value)}
                  className="w-full px-3 h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">電話番号</Label>
              <input
                type="text"
                placeholder="03-1234-5678"
                value={values.tel ?? ''}
                onChange={(e) => setField('tel', e.target.value)}
                className="w-full px-3 h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">相手分類</Label>
              <select
                value={values.category ?? ''}
                onChange={(e) => setSelectField('category', e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white px-3"
              >
                <option value="">全て</option>
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">相手詳細分類</Label>
              <input
                type="text"
                placeholder="詳細分類"
                value={values.subCategory ?? ''}
                onChange={(e) => setField('subCategory', e.target.value)}
                className="w-full px-3 h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">最終接触日（開始）</Label>
              <input
                type="date"
                value={values.lastContactedFrom ?? ''}
                onChange={(e) => setSelectField('lastContactedFrom', e.target.value)}
                className="w-full px-3 h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">最終接触日（終了）</Label>
              <input
                type="date"
                value={values.lastContactedTo ?? ''}
                onChange={(e) => setSelectField('lastContactedTo', e.target.value)}
                className="w-full px-3 h-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
