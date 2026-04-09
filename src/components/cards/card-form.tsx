'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DuplicateWarning from './duplicate-warning'
import { STATUS_OPTIONS, CATEGORY_OPTIONS } from '@/types'
import type { DuplicateCandidate } from '@/types'
import type { Contact } from '@/types/models'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── 共通入力スタイル ──
const inputCls = 'w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-colors'
const selectCls = 'w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-colors'
const textareaCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none transition-colors'

function FieldGroup({ title, children, defaultOpen = true }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, required, span = 1, children }: {
  label: string
  required?: boolean
  span?: 1 | 2
  children: React.ReactNode
}) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

interface CardFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<Contact>
  onSubmit: (data: Record<string, unknown>, forceCreate?: boolean) => Promise<void>
  loading?: boolean
  error?: string
}

export default function CardForm({ mode, defaultValues = {}, onSubmit, loading, error }: CardFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({
    companyName:       defaultValues.companyName ?? '',
    companyNameKana:   defaultValues.companyNameKana ?? '',
    companyNameEn:     defaultValues.companyNameEn ?? '',
    department:        defaultValues.department ?? '',
    title:             defaultValues.title ?? '',
    lastName:          defaultValues.lastName ?? '',
    firstName:         defaultValues.firstName ?? '',
    fullName:          defaultValues.fullName ?? '',
    lastNameKana:      defaultValues.lastNameKana ?? '',
    firstNameKana:     defaultValues.firstNameKana ?? '',
    fullNameKana:      defaultValues.fullNameKana ?? '',
    fullNameEn:        defaultValues.fullNameEn ?? '',
    postalCode:        defaultValues.postalCode ?? '',
    address:           defaultValues.address ?? '',
    country:           defaultValues.country ?? 'Japan',
    tel:               defaultValues.tel ?? '',
    fax:               defaultValues.fax ?? '',
    mobile:            defaultValues.mobile ?? '',
    email:             defaultValues.email ?? '',
    cardExchangePlace: defaultValues.cardExchangePlace ?? '',
    contactMemo:       defaultValues.contactMemo ?? '',
    note:              defaultValues.note ?? '',
    category:          defaultValues.category ?? '',
    subCategory:       defaultValues.subCategory ?? '',
    status:            defaultValues.status ?? 'active',
    nextAction:        defaultValues.nextAction ?? '',
    acquiredAt:        defaultValues.acquiredAt
      ? new Date(defaultValues.acquiredAt).toISOString().slice(0, 10) : '',
    lastContactedAt:   defaultValues.lastContactedAt
      ? new Date(defaultValues.lastContactedAt).toISOString().slice(0, 10) : '',
  })

  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  function set(key: string, val: string) {
    setForm(prev => {
      const next = { ...prev, [key]: val }
      // 姓名の自動結合
      if (key === 'lastName' || key === 'firstName') {
        const l = key === 'lastName' ? val : prev.lastName
        const f = key === 'firstName' ? val : prev.firstName
        next.fullName = [l, f].filter(Boolean).join(' ')
      }
      if (key === 'lastNameKana' || key === 'firstNameKana') {
        const l = key === 'lastNameKana' ? val : prev.lastNameKana
        const f = key === 'firstNameKana' ? val : prev.firstNameKana
        next.fullNameKana = [l, f].filter(Boolean).join(' ')
      }
      return next
    })
  }

  async function handleSubmit(forceCreate = false) {
    if (!form.companyName.trim()) {
      setLocalError('会社名は必須です')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setLocalError('')
    setSubmitting(true)

    // 新規登録時のみ重複チェック
    if (mode === 'create' && !forceCreate) {
      const params = new URLSearchParams()
      if (form.companyName) params.set('company_name', form.companyName)
      if (form.fullName)    params.set('full_name', form.fullName)
      if (form.email)       params.set('email', form.email)
      if (form.tel)         params.set('tel', form.tel)
      if (form.mobile)      params.set('mobile', form.mobile)
      if (defaultValues.id) params.set('exclude_id', defaultValues.id)

      try {
        const res = await fetch(`/api/cards/check-duplicate?${params}`)
        const json = await res.json()
        if (json.data?.candidates?.length > 0) {
          setDuplicates(json.data.candidates)
          setSubmitting(false)
          return
        }
      } catch { /* 重複チェック失敗は無視して続行 */ }
    }

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '')
      )
      await onSubmit(payload, forceCreate)
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : '保存に失敗しました')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = loading || submitting
  const displayError = error || localError

  return (
    <div className="space-y-4 max-w-4xl">
      {displayError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
          ⚠️ {displayError}
        </div>
      )}

      {duplicates.length > 0 && (
        <DuplicateWarning
          candidates={duplicates}
          onForceCreate={() => { setDuplicates([]); handleSubmit(true) }}
          onCancel={() => setDuplicates([])}
        />
      )}

      {/* ── 会社情報 ── */}
      <FieldGroup title="会社情報">
        <FormField label="会社名" required span={2}>
          <input
            value={form.companyName}
            onChange={e => set('companyName', e.target.value)}
            placeholder="株式会社サンプル"
            className={inputCls}
          />
        </FormField>
        <FormField label="会社名（カナ）">
          <input value={form.companyNameKana}
            onChange={e => set('companyNameKana', e.target.value)}
            placeholder="カブシキガイシャサンプル" className={inputCls} />
        </FormField>
        <FormField label="会社名（英名）">
          <input value={form.companyNameEn}
            onChange={e => set('companyNameEn', e.target.value)}
            placeholder="Sample Co., Ltd." className={inputCls} />
        </FormField>
        <FormField label="部署名">
          <input value={form.department}
            onChange={e => set('department', e.target.value)}
            placeholder="営業部" className={inputCls} />
        </FormField>
        <FormField label="役職">
          <input value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="部長" className={inputCls} />
        </FormField>
      </FieldGroup>

      {/* ── 人物情報 ── */}
      <FieldGroup title="人物情報">
        <FormField label="姓">
          <input value={form.lastName}
            onChange={e => set('lastName', e.target.value)}
            placeholder="山田" className={inputCls} />
        </FormField>
        <FormField label="名">
          <input value={form.firstName}
            onChange={e => set('firstName', e.target.value)}
            placeholder="太郎" className={inputCls} />
        </FormField>
        <FormField label="氏名（フル）" span={2}>
          <input value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
            placeholder="山田 太郎（姓・名を入力すると自動入力）"
            className={inputCls} />
        </FormField>
        <FormField label="姓（カナ）">
          <input value={form.lastNameKana}
            onChange={e => set('lastNameKana', e.target.value)}
            placeholder="ヤマダ" className={inputCls} />
        </FormField>
        <FormField label="名（カナ）">
          <input value={form.firstNameKana}
            onChange={e => set('firstNameKana', e.target.value)}
            placeholder="タロウ" className={inputCls} />
        </FormField>
        <FormField label="英字氏名">
          <input value={form.fullNameEn}
            onChange={e => set('fullNameEn', e.target.value)}
            placeholder="Taro Yamada" className={inputCls} />
        </FormField>
      </FieldGroup>

      {/* ── 連絡先 ── */}
      <FieldGroup title="連絡先">
        <FormField label="電話番号">
          <input type="tel" value={form.tel}
            onChange={e => set('tel', e.target.value)}
            placeholder="03-1234-5678" className={inputCls} />
        </FormField>
        <FormField label="携帯電話">
          <input type="tel" value={form.mobile}
            onChange={e => set('mobile', e.target.value)}
            placeholder="090-1234-5678" className={inputCls} />
        </FormField>
        <FormField label="FAX">
          <input value={form.fax}
            onChange={e => set('fax', e.target.value)}
            placeholder="03-1234-5679" className={inputCls} />
        </FormField>
        <FormField label="メールアドレス">
          <input type="email" value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="yamada@example.com" className={inputCls} />
        </FormField>
        <FormField label="郵便番号">
          <input value={form.postalCode}
            onChange={e => set('postalCode', e.target.value)}
            placeholder="100-0001" className={inputCls} />
        </FormField>
        <FormField label="国">
          <input value={form.country}
            onChange={e => set('country', e.target.value)}
            placeholder="Japan" className={inputCls} />
        </FormField>
        <FormField label="住所" span={2}>
          <input value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="東京都千代田区千代田1-1-1" className={inputCls} />
        </FormField>
      </FieldGroup>

      {/* ── 管理情報 ── */}
      <FieldGroup title="管理情報" defaultOpen={true}>
        <FormField label="対応状況">
          <select value={form.status}
            onChange={e => set('status', e.target.value)} className={selectCls}>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="相手分類">
          <select value={form.category}
            onChange={e => set('category', e.target.value)} className={selectCls}>
            <option value="">— 選択 —</option>
            {CATEGORY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="相手詳細分類">
          <input value={form.subCategory}
            onChange={e => set('subCategory', e.target.value)}
            placeholder="例：既存顧客" className={inputCls} />
        </FormField>
        <FormField label="名刺交換場所">
          <input value={form.cardExchangePlace}
            onChange={e => set('cardExchangePlace', e.target.value)}
            placeholder="展示会 / 訪問先" className={inputCls} />
        </FormField>
        <FormField label="取得日">
          <input type="date" value={form.acquiredAt}
            onChange={e => set('acquiredAt', e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="最終接触日">
          <input type="date" value={form.lastContactedAt}
            onChange={e => set('lastContactedAt', e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="次回アクション" span={2}>
          <input value={form.nextAction}
            onChange={e => set('nextAction', e.target.value)}
            placeholder="来月フォロー予定" className={inputCls} />
        </FormField>
        <FormField label="接点メモ" span={2}>
          <textarea rows={3} value={form.contactMemo}
            onChange={e => set('contactMemo', e.target.value)}
            placeholder="接点の概要・気づき" className={textareaCls} />
        </FormField>
        <FormField label="備考" span={2}>
          <textarea rows={3} value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder="その他メモ" className={textareaCls} />
        </FormField>
      </FieldGroup>

      {/* ── ボタン ── */}
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="h-11 px-6 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isLoading}
          className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm shadow-sm transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              保存中...
            </>
          ) : mode === 'create' ? '登録する' : '更新する'}
        </button>
      </div>
    </div>
  )
}
