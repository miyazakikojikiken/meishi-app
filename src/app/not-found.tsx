import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <FileQuestion size={32} className="text-gray-400" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900">ページが見つかりません</h1>
        <p className="text-sm text-gray-500">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link href="/dashboard">
          <Button>ダッシュボードへ戻る</Button>
        </Link>
      </div>
    </div>
  )
}
