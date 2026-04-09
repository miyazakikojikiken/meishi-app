'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
} from '@/components/ui/index'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { STATUS_OPTIONS, CATEGORY_OPTIONS } from '@/types'

export default function ExportPage() {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx')
  const [filters, setFilters] = useState({
    companyName: '',
    status: '',
    category: '',
  })

  function handleExport() {
    const params = new URLSearchParams({ format })
    if (filters.companyName) params.set('company_name', filters.companyName)
    if (filters.status) params.set('status', filters.status)
    if (filters.category) params.set('category', filters.category)
    window.open(`/api/export/cards?${params}`, '_blank')
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Download size={22} />
        エクスポート
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">エクスポート設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 出力形式 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">出力形式</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('xlsx')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                  format === 'xlsx'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet size={28} className={format === 'xlsx' ? 'text-blue-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${format === 'xlsx' ? 'text-blue-700' : 'text-gray-600'}`}>
                  Excel (.xlsx)
                </span>
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                  format === 'csv'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText size={28} className={format === 'csv' ? 'text-blue-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${format === 'csv' ? 'text-blue-700' : 'text-gray-600'}`}>
                  CSV (.csv)
                </span>
              </button>
            </div>
          </div>

          {/* フィルター */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium text-gray-700">
              絞り込み条件（空欄＝全件）
            </p>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">会社名</Label>
              <Input
                placeholder="例：株式会社サンプル"
                value={filters.companyName}
                onChange={(e) => setFilters((p) => ({ ...p, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">対応状況</Label>
              <Select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="">すべて</option>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">相手分類</Label>
              <Select
                value={filters.category}
                onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
              >
                <option value="">すべて</option>
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <Button onClick={handleExport} className="w-full">
              <Download size={16} className="mr-2" />
              ダウンロード
            </Button>
            <p className="text-xs text-gray-400 text-center">
              ※ 最大50,000件まで出力できます
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
