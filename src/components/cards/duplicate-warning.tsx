'use client'
import { useRouter } from 'next/navigation'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/index'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import type { DuplicateCandidate } from '@/types'

interface DuplicateWarningProps {
  candidates: DuplicateCandidate[]
  onForceCreate: () => void
  onCancel: () => void
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? 'bg-red-100 text-red-700'
      : score >= 70
        ? 'bg-orange-100 text-orange-700'
        : 'bg-yellow-100 text-yellow-700'
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${color}`}>
      類似度 {score}点
    </span>
  )
}

export default function DuplicateWarning({
  candidates,
  onForceCreate,
  onCancel,
}: DuplicateWarningProps) {
  const router = useRouter()

  return (
    <Alert variant="warning">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-yellow-800">
            重複候補が {candidates.length} 件見つかりました
          </AlertTitle>
          <AlertDescription>
            <p className="text-sm text-yellow-700 mb-3">
              以下の名刺と重複している可能性があります。保存前に確認してください。
            </p>

            <div className="space-y-2 mb-4">
              {candidates.map((c) => (
                <div
                  key={c.contactId}
                  className="bg-white border border-yellow-200 rounded p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                      {c.contact.companyName}
                      {c.contact.fullName && (
                        <span className="text-gray-600">/ {c.contact.fullName}</span>
                      )}
                      <ScoreBadge score={c.score} />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex gap-3 flex-wrap">
                      {c.contact.title && <span>{c.contact.title}</span>}
                      {c.contact.department && <span>{c.contact.department}</span>}
                      {c.contact.email && <span>{c.contact.email}</span>}
                      {c.contact.tel && <span>{c.contact.tel}</span>}
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      理由: {c.reasons.join('、')}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                    title="既存名刺を開く"
                    onClick={() =>
                      window.open(`/cards/${c.contactId}`, '_blank')
                    }
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                キャンセルして確認する
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={onForceCreate}
              >
                重複候補を無視してこのまま登録
              </Button>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}
