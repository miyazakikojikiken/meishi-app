'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/index'
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  XCircle,
  SkipForward,
  Info,
  X,
} from 'lucide-react'

interface ImportResult {
  id: string
  status: string
  totalRows: number | null
  successRows: number
  errorRows: number
  skipRows: number
  rows: {
    rowNumber: number
    errorMessage: string
    rawData: Record<string, unknown>
  }[]
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [policy, setPolicy] = useState<'skip' | 'overwrite'>('skip')
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'processing' | 'done'>('upload')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setError('')
    setResult(null)
  }

  async function handleImport() {
    if (!file) {
      setError('ファイルを選択してください')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setStep('processing')

    try {
      // アップロード & ジョブ開始
      const formData = new FormData()
      formData.append('file', file)
      formData.append('duplicatePolicy', policy)

      const res = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'インポートに失敗しました')

      const jid = json.data.jobId
      setJobId(jid)

      // ジョブ完了をポーリング
      let tries = 0
      while (tries < 120) {
        await new Promise((r) => setTimeout(r, 2000))
        const statusRes = await fetch(`/api/import/${jid}`)
        const statusJson = await statusRes.json()
        const job = statusJson.data?.job

        if (job?.status === 'DONE' || job?.status === 'ERROR') {
          setResult(job)
          setStep('done')
          break
        }
        tries++
      }

      if (tries >= 120) {
        throw new Error('タイムアウト：インポートに時間がかかりすぎています')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setFile(null)
    setJobId(null)
    setResult(null)
    setError('')
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Upload size={22} />
        Excelインポート
      </h1>

      {/* ガイド */}
      <Alert>
        <Info size={16} className="shrink-0" />
        <AlertTitle>インポートについて</AlertTitle>
        <AlertDescription className="text-sm space-y-1 mt-1">
          <p>・対応形式: .xlsx / .xls / .csv（最大50MB）</p>
          <p>・「名刺台帳」シートのデータを取り込みます</p>
          <p>・必須列: <strong>会社名</strong>（空の行はスキップされます）</p>
          <p>・コンタクト履歴（コンタクト日・区分・メモ）がある場合は同時に登録されます</p>
        </AlertDescription>
      </Alert>

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ファイルと設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* ファイル選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Excelファイル
              </label>
              {file ? (
                <div className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50">
                  <FileSpreadsheet size={20} className="text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">クリックしてファイルを選択</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx / .xls / .csv</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* 重複ポリシー */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                重複データの扱い
              </label>
              <Select
                value={policy}
                onChange={(e) => setPolicy(e.target.value as 'skip' | 'overwrite')}
              >
                <option value="skip">スキップ（既存データを保持）</option>
                <option value="overwrite">上書き（既存データを更新）</option>
              </Select>
              <p className="text-xs text-gray-400">
                ※ 会社名＋氏名、メール、電話番号が90点以上一致した場合を重複と判定
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  インポート実行中...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  インポート実行
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 size={40} className="animate-spin text-blue-500 mx-auto" />
            <div>
              <p className="font-medium text-gray-700">インポート処理中...</p>
              <p className="text-sm text-gray-400 mt-1">
                データ量によっては数分かかることがあります
              </p>
              {jobId && (
                <p className="text-xs text-gray-300 mt-2">Job ID: {jobId}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && result && (
        <div className="space-y-4">
          {/* サマリー */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                インポート完了
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle size={24} className="text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{result.successRows}</p>
                  <p className="text-xs text-green-600 mt-0.5">成功</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <SkipForward size={24} className="text-yellow-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-yellow-700">{result.skipRows}</p>
                  <p className="text-xs text-yellow-600 mt-0.5">スキップ</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle size={24} className="text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-600">{result.errorRows}</p>
                  <p className="text-xs text-red-500 mt-0.5">エラー</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleReset}>
                  別のファイルをインポート
                </Button>
                <Button onClick={() => window.location.href = '/cards'}>
                  名刺一覧を確認する
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* エラー行詳細 */}
          {result.rows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-700">
                  エラー行の詳細（最大100件）
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-16">行番号</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">エラー内容</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">元データ（会社名）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row) => (
                        <tr key={row.rowNumber} className="border-b last:border-0">
                          <td className="px-4 py-2 text-gray-500">{row.rowNumber}</td>
                          <td className="px-4 py-2 text-red-600">{row.errorMessage}</td>
                          <td className="px-4 py-2 text-gray-600 max-w-[200px] truncate">
                            {(row.rawData['会社名'] as string) ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
