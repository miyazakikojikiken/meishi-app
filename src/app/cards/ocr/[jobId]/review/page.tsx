'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, RotateCcw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import OcrEditForm from '@/components/ocr/ocr-edit-form'
import DuplicateWarning from '@/components/cards/duplicate-warning'
import type { OcrExtractedFields, OcrConfidenceScores, DuplicateCandidate } from '@/types'

interface OcrJob {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR'
  frontImagePath: string | null
  backImagePath: string | null
  extractedFields: OcrExtractedFields | null
  confidenceScores: OcrConfidenceScores | null
  overallAccuracy: number | null
  errorMessage: string | null
}

export default function OcrReviewPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()

  const [job, setJob] = useState<OcrJob | null>(null)
  const [polling, setPolling] = useState(true)
  const [fields, setFields] = useState<OcrExtractedFields>({})
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ジョブ完了までポーリング
  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/cards/ocr/${jobId}`)
      if (!res.ok) return
      const json = await res.json()
      const j: OcrJob = json.data?.job
      if (!j) return
      setJob(j)

      if (j.status === 'DONE' || j.status === 'ERROR') {
        setPolling(false)
        if (j.status === 'DONE' && j.extractedFields) {
          setFields(j.extractedFields)
        }
      }
    } catch {
      // 無視して再試行
    }
  }, [jobId])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  useEffect(() => {
    if (!polling) return
    const timer = setInterval(fetchJob, 2000)
    return () => clearInterval(timer)
  }, [polling, fetchJob])

  function handleFieldChange(key: keyof OcrExtractedFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(forceCreate = false) {
    if (!fields.companyName?.trim()) {
      setError('会社名は必須です')
      return
    }
    setSaving(true)
    setError('')
    setDuplicates([])

    try {
      const res = await fetch(`/api/cards/ocr/${jobId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, forceCreate }),
      })

      const json = await res.json()

      if (res.status === 409 && json.data?.requireConfirm) {
        setDuplicates(json.data.duplicates)
        setSaving(false)
        return
      }

      if (!res.ok) throw new Error(json.error ?? '保存に失敗しました')

      router.push(`/cards/${json.data.contact.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
      setSaving(false)
    }
  }

  // ─── ローディング中 ───
  if (!job || job.status === 'PENDING' || job.status === 'PROCESSING') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <div className="text-center">
            <p className="font-medium text-gray-700">OCR処理中...</p>
            <p className="text-sm text-gray-400 mt-1">
              名刺の文字を読み取っています。しばらくお待ちください。
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── エラー ───
  if (job.status === 'ERROR') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">OCR結果の確認</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-center space-y-3">
          <p className="text-red-700 font-medium">OCR処理に失敗しました</p>
          <p className="text-sm text-red-600">{job.errorMessage}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/cards/ocr')}>
              <RotateCcw size={14} className="mr-1.5" />
              やり直す
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/cards/new')}>
              手動で入力する
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── 完了・確認画面 ───
  const frontRelPath = job.frontImagePath?.split('uploads/').pop()
  const backRelPath = job.backImagePath?.split('uploads/').pop()

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/cards/ocr')}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">OCR結果の確認・修正</h1>
            {job.overallAccuracy != null && (
              <p className="text-sm text-gray-500">
                読み取り精度:{' '}
                <span
                  className={
                    Number(job.overallAccuracy) >= 80
                      ? 'text-green-600 font-semibold'
                      : Number(job.overallAccuracy) >= 60
                        ? 'text-yellow-600 font-semibold'
                        : 'text-red-600 font-semibold'
                  }
                >
                  {Number(job.overallAccuracy).toFixed(1)}%
                </span>
                　赤色フィールドは信頼度が低いため要確認
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => router.push('/cards/ocr')}
          variant="outline"
          size="sm"
        >
          <RotateCcw size={14} className="mr-1.5" />
          やり直す
        </Button>
      </div>

      {/* 重複警告 */}
      {duplicates.length > 0 && (
        <DuplicateWarning
          candidates={duplicates}
          onForceCreate={() => {
            setDuplicates([])
            handleSave(true)
          }}
          onCancel={() => setDuplicates([])}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 名刺画像プレビュー */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">名刺画像</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {frontRelPath && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">表面</p>
                <img
                  src={`/api/files/${frontRelPath}`}
                  alt="名刺表面"
                  className="w-full border rounded-lg object-contain bg-gray-50 max-h-56"
                />
              </div>
            )}
            {backRelPath && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">裏面</p>
                <img
                  src={`/api/files/${backRelPath}`}
                  alt="名刺裏面"
                  className="w-full border rounded-lg object-contain bg-gray-50 max-h-56"
                />
              </div>
            )}
            {!frontRelPath && !backRelPath && (
              <p className="text-sm text-gray-400 text-center py-8">
                画像プレビューなし
              </p>
            )}
          </CardContent>
        </Card>

        {/* 抽出結果フォーム */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">抽出結果（修正可能）</CardTitle>
          </CardHeader>
          <CardContent>
            <OcrEditForm
              fields={fields}
              confidence={job.confidenceScores ?? {}}
              onChange={handleFieldChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/cards/new')}
          disabled={saving}
        >
          手動入力に切り替え
        </Button>
        <Button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="min-w-[180px]"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <CheckCircle size={16} className="mr-2" />
              この内容で名刺を登録
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
