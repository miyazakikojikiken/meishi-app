'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardHeader, CardTitle,
  Input, Label, Select, Badge, Skeleton,
} from '@/components/ui/index'
import { Settings, UserPlus, Loader2, CheckCircle } from 'lucide-react'

interface UserRow {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('取得失敗')
      const json = await res.json()
      setUsers(json.data?.users ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) {
      setError('全項目を入力してください')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '登録失敗')
      setSuccess('ユーザーを登録しました')
      setForm({ name: '', email: '', password: '', role: 'USER' })
      setShowForm(false)
      loadUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      loadUsers()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Settings size={22} />
        管理者設定
      </h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded p-3 text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* ユーザー一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">ユーザー管理</CardTitle>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              <UserPlus size={14} className="mr-1.5" />
              ユーザー追加
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <div className="mx-6 mb-4 p-4 border rounded-lg bg-gray-50 space-y-3">
            <p className="text-sm font-medium text-gray-700">新規ユーザー登録</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">氏名</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="山田 太郎" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">メールアドレス</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="yamada@example.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">パスワード（8文字以上）</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">権限</Label>
                <Select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                  <option value="USER">一般ユーザー</option>
                  <option value="ADMIN">管理者</option>
                </Select>
              </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                登録
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setError('') }}>キャンセル</Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">氏名</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">メールアドレス</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">権限</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">状態</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {u.role === 'ADMIN' ? '管理者' : '一般'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={u.isActive ? 'success' : 'secondary'}>
                        {u.isActive ? '有効' : '無効'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => toggleActive(u.id, u.isActive)}
                      >
                        {u.isActive ? '無効化' : '有効化'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
