'use client'
import { Input, Label } from '@/components/ui/index'
import type { OcrExtractedFields, OcrConfidenceScores } from '@/types'

interface OcrField {
  key: keyof OcrExtractedFields
  label: string
}

const OCR_FIELDS: OcrField[] = [
  { key: 'companyName', label: '会社名 *' },
  { key: 'department', label: '部署名' },
  { key: 'title', label: '役職' },
  { key: 'fullName', label: '氏名（フル）' },
  { key: 'lastName', label: '姓' },
  { key: 'firstName', label: '名' },
  { key: 'postalCode', label: '郵便番号' },
  { key: 'address', label: '住所' },
  { key: 'tel', label: '電話番号' },
  { key: 'fax', label: 'FAX' },
  { key: 'mobile', label: '携帯電話' },
  { key: 'email', label: 'メールアドレス' },
]

function ConfidencePill({ score }: { score?: number }) {
  if (score === undefined) return null
  const pct = Math.round(score * 100)
  const cls =
    score >= 0.9
      ? 'bg-green-100 text-green-800'
      : score >= 0.7
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800'
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>
      {pct}%
    </span>
  )
}

interface OcrEditFormProps {
  fields: OcrExtractedFields
  confidence: OcrConfidenceScores
  onChange: (key: keyof OcrExtractedFields, value: string) => void
}

export default function OcrEditForm({
  fields,
  confidence,
  onChange,
}: OcrEditFormProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded">70%未満</span>
          は信頼度が低いため要確認
        </span>
      </p>
      <div className="grid grid-cols-1 gap-3">
        {OCR_FIELDS.map(({ key, label }) => {
          const score = confidence[key]
          const isLowConf = score !== undefined && score < 0.7
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-xs">{label}</Label>
                <ConfidencePill score={score} />
              </div>
              <Input
                value={fields[key] ?? ''}
                onChange={(e) => onChange(key, e.target.value)}
                className={
                  isLowConf
                    ? 'border-red-300 bg-red-50 focus-visible:ring-red-400'
                    : ''
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
