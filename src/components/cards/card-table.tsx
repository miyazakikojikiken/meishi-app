'use client'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Edit, ChevronRight } from 'lucide-react'
import type { Contact } from '@/types/models'

interface CardTableProps {
  contacts: Contact[]
  loading?: boolean
}

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  active:       { label: 'アクティブ', dot: 'bg-green-500' },
  pending:      { label: '対応中',     dot: 'bg-yellow-400' },
  negotiating:  { label: '商談中',     dot: 'bg-blue-500' },
  closed_win:   { label: '受注',       dot: 'bg-emerald-600' },
  closed_lose:  { label: '失注',       dot: 'bg-red-400' },
  inactive:     { label: '非アクティブ', dot: 'bg-gray-300' },
}

function StatusDot({ status }: { status: string | null }) {
  const cfg = STATUS_MAP[status ?? ''] ?? { label: status ?? '—', dot: 'bg-gray-300' }
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="text-xs text-gray-700">{cfg.label}</span>
    </span>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <tr key={i} className={i % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
          {[200, 120, 140, 128, 176, 80, 80, 40].map((w, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-4 bg-gray-100 rounded animate-pulse"
                style={{ width: `${w * 0.6 + (i * 17 + j * 13) % (w * 0.4)}px` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function CardTable({ contacts, loading }: CardTableProps) {
  const router = useRouter()

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              {[
                { label: '会社名',     w: 'w-52' },
                { label: '氏名',       w: 'w-28' },
                { label: '役職・部署', w: 'w-36' },
                { label: '電話番号',   w: 'w-32' },
                { label: 'メール',     w: 'w-44' },
                { label: '状況',       w: 'w-24' },
                { label: '最終接触',   w: 'w-24' },
                { label: '',           w: 'w-16' },
              ].map((h) => (
                <th
                  key={h.label + h.w}
                  className={`px-4 py-3 text-left text-xs font-semibold tracking-wide ${h.w}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows />
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-16 text-sm">
                  該当する名刺が見つかりませんでした
                </td>
              </tr>
            ) : (
              contacts.map((c, i) => (
                <tr
                  key={c.id}
                  className={`group cursor-pointer transition-colors hover:bg-blue-50 ${
                    i % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'
                  }`}
                  onClick={() => router.push(`/cards/${c.id}`)}
                >
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-gray-900 line-clamp-1 block max-w-[200px]">
                      {c.companyName}
                    </span>
                    {c.companyNameKana && (
                      <span className="text-xs text-gray-400 line-clamp-1 block">
                        {c.companyNameKana}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-gray-800">{c.fullName ?? '—'}</span>
                    {c.fullNameKana && (
                      <span className="block text-xs text-gray-400">{c.fullNameKana}</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-gray-600 text-xs leading-relaxed block max-w-[140px]">
                      {c.title && <span className="block">{c.title}</span>}
                      {c.department && <span className="block text-gray-400">{c.department}</span>}
                      {!c.title && !c.department && <span className="text-gray-300">—</span>}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {c.tel ? (
                      <a
                        href={`tel:${c.tel}`}
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.tel}
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 max-w-[176px]">
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="text-blue-600 hover:underline truncate block text-xs"
                        onClick={(e) => e.stopPropagation()}
                        title={c.email}
                      >
                        {c.email}
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusDot status={c.status} />
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                    {formatDate(c.lastContactedAt)}
                  </td>

                  <td
                    className="px-4 py-3.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="編集"
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                        onClick={() => router.push(`/cards/${c.id}/edit`)}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        title="詳細"
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                        onClick={() => router.push(`/cards/${c.id}`)}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
