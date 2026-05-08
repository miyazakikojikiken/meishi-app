'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ScanLine, Loader2, Info, Camera } from 'lucide-react'
const BusinessCardCamera = dynamic(() => import('@/components/camera/BusinessCardCamera'), { ssr: false })
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import FileUploader from '@/components/ocr/file-uploader'

export default function OcrUploadPage() {
  const router = useRouter()
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [cameraTarget, setCameraTarget] = useState<'front' | 'back'>('front')

  function openCamera(target: 'front' | 'back') {
    setCameraTarget(target)
    setShowCamera(true)
  }

  function handleCameraCapture(file: File) {
    if (cameraTarget === 'front') {
      setFrontFile(file)
    } else {
      setBackFile(file)
    }
    setShowCamera(false)
  }

  async function handleOcr() {
    if (!frontFile && !backFile) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      if (frontFile) formData.append('front', frontFile)
      if (backFile) formData.append('back', backFile)
      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'OCRエラー')
      router.push(`/cards/ocr/${data.jobId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (showCamera) {
    return (
      <BusinessCardCamera
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} />
        戻る
      </button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine size={20} />
            名刺OCR読み取り
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700 flex gap-2">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>名刺の表面・裏面を撮影またはアップロードしてください。AIが自動で情報を読み取ります。</span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">表面</p>
              <div className="flex gap-2">
                <button
                  onClick={() => openCamera('front')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                >
                  <Camera size={14} />
                  撮影
                </button>
                <FileUploader onFileSelect={setFrontFile} label="ファイル選択" />
              </div>
              {frontFile && (
                <p className="text-xs text-green-600 mt-1">
                  {frontFile.name}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-1">裏面（任意）</p>
              <div className="flex gap-2">
                <button
                  onClick={() => openCamera('back')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                >
                  <Camera size={14} />
                  撮影
                </button>
                <FileUploader onFileSelect={setBackFile} label="ファイル選択" />
              </div>
              {backFile && (
                <p className="text-xs text-green-600 mt-1">
                  {backFile.name}
                </p>
              )}
            </div>
          </div>

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
