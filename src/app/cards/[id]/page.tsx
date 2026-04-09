'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, Separator, Badge } from '@/components/ui/index'
import StatusBadge from '@/components/common/status-badge'
import { formatDate } from '@/lib/utils'
import {
  ArrowLeft, Edit, Trash2, Plus, Phone, Mail,
  MapPin, Clock, Loader2, Building2, User, ChevronRight,
} from 'lucide-react'
import { INTERACTION_TYPE_OPTIONS, STATUS_OPTIONS } from '@/types'

// ─── 型定義 ───────────────────────────────────
interface InteractionHistory {
  id: string
  contactedAt: string
  interactionType: string
  title: string | null
  place: string | null
  memo: string | null
  nextAction: string | null
  status: string | null
  creator: { id: string; name: string } | null
}

interface ContactDetail {
  id: string
  companyName: string
  companyNameKana: string | null
  companyNameEn: string | null
  department: string | null
  title: string | null
  fullName: string | null
  fullNameKana: string | null
  fullNameEn: string | null
  postalCode: string | null
  address: string | null
  country: string | null
  tel: string | null
  fax: string | null
  mobile: string | null
  email: string | null
  cardExchangePlace: string | null
  contactMemo: string | null
  note: string | null
  category: string | null
  subCategory: string | null
  status: string | null
  nextAction: string | null
  lastContactedAt: string | null
  acquiredAt: string | null
  ocrAccuracy: number | null
  createdAt: string
  updatedAt: string
  owner: { id: string; name: string } | null
  creator: { id: string; name: string } | null
  businessCards: { id: string; side: string; filePath: string }[]
  interactionHistories: InteractionHistory[]
}

// ─── サブコンポーネント ───────────────────────
function Field({ label, value, href }: { label: string; value: string | null | undefined; href?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start py-2.5 border-b border-gray-50 last:border-0">
      <dt className="text-xs text-gray-400 w-28 shrink-0 pt-0.5 font-medium">{label}</dt>
      <dd className="text-sm text-gray-800 break-all flex-1">
        {href ? (
          <a href={href} className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
            {value}
          </a>
        ) : value}
      </dd>
    </div>
  )
}

// コンタクト履歴追加モーダル
function AddInteractionModal({
  contactId, onClose, onAdded,
}: {
  contactId: string; onClose: () => void; onAdded: () => void
}) {
  const [form, setForm] = useState({
    contactedAt: new Date().toISOString().slice(0, 10),
    interactionType: '商談',
    title: '', place: '', memo: '', nextAction: '', status: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!form.contactedAt) { setError('コンタクト日は必須です'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, ...form }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '保存に失敗しました')
      onAdded(); onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally { setSaving(false) }
  }

  const inputClass = "w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
  const textareaClass = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b flex items-center justify-between rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">コンタクト履歴を追加</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">コンタクト日 *</label>
              <input type="date" value={form.contactedAt}
                onChange={e => setForm(p => ({ ...p, contactedAt: e.target.value }))}
                className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">区分 *</label>
              <select value={form.interactionType}
                onChange={e => setForm(p => ({ ...p, interactionType: e.target.value }))}
                className={inputClass}>
                {INTERACTION_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">タイトル</label>
            <input type="text" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="例：第1回提案" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">場所</label>
            <input type="text" value={form.place}
              onChange={e => setForm(p => ({ ...p, place: e.target.value }))}
              placeholder="先方オフィス / オンライン" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">内容・メモ</label>
            <textarea rows={4} value={form.memo}
              onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
              placeholder="接点の内容、気づき、確認事項など"
              className={textareaClass} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">次回アクション</label>
            <input type="text" value={form.nextAction}
              onChange={e => setForm(p => ({ ...p, nextAction: e.target.value }))}
              placeholder="例：来月デモ実施" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">対応状況（更新する場合）</label>
            <select value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className={inputClass}>
              <option value="">変更しない</option>
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="sticky bottom-0 bg-white px-5 py-4 border-t flex justify-end gap-2 rounded-b-2xl">
          <Button variant="outline" size="sm" onClick={onClose}>キャンセル</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin mr-1.5" />}
            保存する
          </Button>
        </div>
      </div>
    </div>
  )
}

// 履歴タイムライン行
const TYPE_COLORS: Record<string, string> = {
  商談: 'bg-blue-100 text-blue-700 border-blue-200',
  訪問: 'bg-green-100 text-green-700 border-green-200',
  電話: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  メール: 'bg-purple-100 text-purple-700 border-purple-200',
  展示会: 'bg-orange-100 text-orange-700 border-orange-200',
  オンライン: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  その他: 'bg-gray-100 text-gray-700 border-gray-200',
}

function HistoryItem({ h }: { h: InteractionHistory }) {
  const cls = TYPE_COLORS[h.interactionType] ?? TYPE_COLORS['その他']
  return (
    <div className="relative pl-6 pb-5 last:pb-0">
      {/* 縦ライン */}
      <div className="absolute left-2 top-5 bottom-0 w-px bg-gray-100 last:hidden" />
      {/* ドット */}
      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">
              {formatDate(h.contactedAt)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
              {h.interactionType}
            </span>
          </div>
          {h.creator && (
            <span className="text-xs text-gray-400 shrink-0">{h.creator.name}</span>
          )}
        </div>
        {h.title && (
          <p className="text-sm font-medium text-gray-900 mt-1.5">{h.title}</p>
        )}
        {h.place && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <MapPin size={10} />{h.place}
          </p>
        )}
        {h.memo && (
          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">
            {h.memo}
          </p>
        )}
        {h.nextAction && (
          <div className="mt-2.5 px-3 py-1.5 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
              <ChevronRight size={12} />次回: {h.nextAction}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── メインページ ─────────────────────────────
export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cards/${id}`)
      if (!res.ok) throw new Error('取得失敗')
      const json = await res.json()
      setContact(json.data?.contact ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('削除に失敗しました')
      router.push('/cards')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '削除に失敗しました')
      setDeleting(false); setDeleteConfirm(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-blue-400" />
    </div>
  )

  if (!contact) return (
    <div className="text-center py-20">
      <p className="text-gray-400 mb-3">名刺が見つかりません</p>
      <Link href="/cards" className="text-blue-600 text-sm hover:underline">一覧に戻る</Link>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* ヘッダー */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 shrink-0 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{contact.companyName}</h1>
            <p className="text-sm text-gray-500">
              {[contact.fullName, contact.title, contact.department].filter(Boolean).join(' / ') || '担当者情報なし'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm"
            onClick={() => router.push(`/cards/${id}/edit`)}>
            <Edit size={14} className="mr-1.5" />編集
          </Button>
          {!deleteConfirm ? (
            <Button variant="outline" size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setDeleteConfirm(true)}>
              <Trash2 size={14} className="mr-1.5" />削除
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
              <span className="text-xs text-red-700 font-medium">本当に削除しますか？</span>
              <Button size="sm" variant="destructive" className="h-7 text-xs"
                onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 size={12} className="animate-spin" /> : '削除'}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs"
                onClick={() => setDeleteConfirm(false)}>キャンセル</Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── 左カラム：基本情報 ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* 会社・担当者 */}
          <Card className="rounded-2xl shadow-sm border-0 ring-1 ring-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
                <Building2 size={14} />会社・担当者
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl>
                <Field label="会社名" value={contact.companyName} />
                <Field label="会社名（カナ）" value={contact.companyNameKana} />
                <Field label="会社名（英名）" value={contact.companyNameEn} />
                <Field label="部署名" value={contact.department} />
                <Field label="役職" value={contact.title} />
                <Field label="氏名" value={contact.fullName} />
                <Field label="氏名（カナ）" value={contact.fullNameKana} />
                <Field label="英字氏名" value={contact.fullNameEn} />
              </dl>
            </CardContent>
          </Card>

          {/* 連絡先 */}
          <Card className="rounded-2xl shadow-sm border-0 ring-1 ring-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
                <Phone size={14} />連絡先
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl>
                <Field label="電話番号" value={contact.tel} href={contact.tel ? `tel:${contact.tel}` : undefined} />
                <Field label="携帯電話" value={contact.mobile} href={contact.mobile ? `tel:${contact.mobile}` : undefined} />
                <Field label="FAX" value={contact.fax} />
                <Field label="メール" value={contact.email} href={contact.email ? `mailto:${contact.email}` : undefined} />
                <Field label="郵便番号" value={contact.postalCode} />
                <Field label="住所" value={contact.address} />
                {contact.country && contact.country !== 'Japan' && (
                  <Field label="国" value={contact.country} />
                )}
              </dl>
            </CardContent>
          </Card>

          {/* メモ */}
          {(contact.contactMemo || contact.note) && (
            <Card className="rounded-2xl shadow-sm border-0 ring-1 ring-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500">メモ・備考</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {contact.contactMemo && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">接点メモ</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3">
                      {contact.contactMemo}
                    </p>
                  </div>
                )}
                {contact.note && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">備考</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3">
                      {contact.note}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 名刺画像 */}
          {contact.businessCards.length > 0 && (
            <Card className="rounded-2xl shadow-sm border-0 ring-1 ring-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500">名刺画像</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex gap-4 flex-wrap">
                {contact.businessCards.map(bc => {
                  const relPath = bc.filePath.split('uploads/').pop()
                  return (
                    <div key={bc.id} className="space-y-1.5">
                      <p className="text-xs text-gray-400 font-medium">
                        {bc.side === 'FRONT' ? '表面' : '裏面'}
                      </p>
                      <a href={`/api/files/${relPath}`} target="_blank" rel="noopener noreferrer">
                        <img
                          src={`/api/files/${relPath}`}
                          alt={bc.side === 'FRONT' ? '名刺表面' : '名刺裏面'}
                          className="h-44 border rounded-xl object-contain bg-gray-50 hover:opacity-90 transition-opacity cursor-zoom-in shadow-sm"
                        />
                      </a>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── 右カラム：管理情報 + 履歴 ── */}
        <div className="space-y-4">
          {/* 管理情報 */}
          <Card className="rounded-2xl shadow-sm border-0 ring-1 ring-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
                <User size={14} />管理情報
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">対応状況</p>
                <StatusBadge status={contact.status} />
              </div>

              {(contact.category || contact.subCategory) && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">分類</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {contact.category && (
                      <Badge variant="secondary">{contact.category}</Badge>
                    )}
                    {contact.subCategory && (
                      <Badge variant="outline">{contact.subCategory}</Badge>
                    )}
                  </div>
                </div>
              )}

              {contact.nextAction && (
                <div className="bg-blue-50 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-blue-500 font-medium mb-0.5">次回アクション</p>
                  <p className="text-sm text-blue-800 font-medium">{contact.nextAction}</p>
                </div>
              )}

              <Separator />

              <dl className="space-y-2">
                {[
                  { label: '取得日',       value: formatDate(contact.acquiredAt) },
                  { label: '最終接触日',   value: formatDate(contact.lastContactedAt) },
                  { label: '名刺交換場所', value: contact.cardExchangePlace },
                  { label: '担当者',       value: contact.owner?.name },
                  { label: '登録日',       value: formatDate(contact.createdAt) },
                  { label: '登録者',       value: contact.creator?.name },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <dt className="text-xs text-gray-400 shrink-0">{label}</dt>
                    <dd className="text-xs text-gray-700 text-right">{value}</dd>
                  </div>
                ) : null)}
                {contact.ocrAccuracy != null && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-xs text-gray-400">OCR精度</dt>
                    <dd className="text-xs text-gray-700">{Number(contact.ocrAccuracy).toFixed(1)}%</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* コンタクト履歴 */}
          <Card className="rounded-2xl shadow-sm border-0 ring-1 ring-gray-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
                  <Clock size={14} />コンタクト履歴
                  {contact.interactionHistories.length > 0 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-normal">
                      {contact.interactionHistories.length}
                    </span>
                  )}
                </CardTitle>
                <button
                  onClick={() => setShowModal(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                  title="履歴を追加"
                >
                  <Plus size={16} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {contact.interactionHistories.length === 0 ? (
                <div className="text-center py-6">
                  <Clock size={24} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400">まだ履歴がありません</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    最初のコンタクトを記録する
                  </button>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto pr-1">
                  {contact.interactionHistories.map(h => (
                    <HistoryItem key={h.id} h={h} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showModal && (
        <AddInteractionModal
          contactId={id}
          onClose={() => setShowModal(false)}
          onAdded={load}
        />
      )}
    </div>
  )
}
