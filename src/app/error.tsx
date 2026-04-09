'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900">エラーが発生しました</h1>
        <p className="text-sm text-gray-500">
          予期しないエラーが発生しました。
          <br />
          しばらくしてから再試行してください。
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-left text-xs bg-gray-100 rounded p-3 overflow-auto max-h-40 text-red-600">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
            ダッシュボードへ
          </Button>
          <Button onClick={reset}>再試行</Button>
        </div>
      </div>
    </div>
  )
}
