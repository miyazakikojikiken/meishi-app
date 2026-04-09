'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import CardForm from '@/components/cards/card-form'
import { useState } from 'react'

export default function CardNewPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  async function handleSubmit(data: Record<string, unknown>, forceCreate = false) {
    setError('')
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, forceCreate }),
    })

    const json = await res.json()

    if (res.status === 409 && json.data?.requireConfirm) {
      // DuplicateWarning は CardForm 内で処理するため、
      // ここでは 409 を throw して CardForm に返す
      throw Object.assign(new Error('DUPLICATE'), { duplicates: json.data.duplicates })
    }

    if (!res.ok) {
      throw new Error(json.error ?? '登録に失敗しました')
    }

    router.push(`/cards/${json.data.contact.id}`)
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
        <h1 className="text-2xl font-bold text-gray-900">名刺の新規登録</h1>
      </div>

      <CardForm
        mode="create"
        onSubmit={handleSubmit}
        error={error}
      />
    </div>
  )
}
