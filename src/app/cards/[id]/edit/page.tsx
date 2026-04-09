'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import CardForm from '@/components/cards/card-form'
import type { Contact } from '@/types/models'

export default function CardEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cards/${id}`)
        if (!res.ok) throw new Error('取得に失敗しました')
        const json = await res.json()
        setContact(json.data?.contact ?? null)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSubmit(data: Record<string, unknown>) {
    setError('')
    const res = await fetch(`/api/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? '更新に失敗しました')

    router.push(`/cards/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-16 text-gray-500">
        名刺が見つかりません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">名刺の編集</h1>
          <p className="text-sm text-gray-500">{contact.companyName} / {contact.fullName ?? '—'}</p>
        </div>
      </div>

      <CardForm
        mode="edit"
        defaultValues={contact}
        onSubmit={handleSubmit}
        error={error}
      />
    </div>
  )
}
