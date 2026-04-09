'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ScanLine, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import FileUploader from '@/components/ocr/file-uploader'

export default function OcrUploadPage() {
  const router = useRouter()
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleOcr() {
    if (!frontFile && !backFile) {
      setError('名刺画像をアップロードしてください')
      return
    }
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      if (frontFile) formData.append('front', frontFile)
      if (backFile) formData.append('back', backFile)

      const res = await fetch('/api/cards/ocr/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'OCR実行に失敗しました')

      router.push(`/cards/ocr/${json.data.jobId}/review`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">名刺OCR取り込み</h1>
      </div>

      {/* ガイド */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-medium">OCR取り込みの流れ</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
            <li>名刺の表面（必須）と裏面（任意）をアップロード</li>
            <li>OCR実行ボタンをクリック</li>
            <li>抽出結果を確認・修正して登録</li>
          </ol>
          <p className="text-xs text-blue-600 mt-1">
            ※ GOOGLE_VISION_API_KEY 未設定時はダミーデータで動作確認できます
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">名刺画像のアップロード</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FileUploader
            label="表面（必須）"
            file={frontFile}
            onFileChange={setFrontFile}
          />
          <FileUploader
            label="裏面（任意）"
            file={backFile}
            onFileChange={setBackFile}
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <Button
            onClick={handleOcr}
            disabled={loading || (!frontFile && !backFile)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                OCR実行中...（しばらくお待ちください）
              </>
            ) : (
              <>
                <ScanLine size={16} className="mr-2" />
                OCR実行
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
