import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import {
  ok,
  badRequest,
  forbidden,
  notFound,
  unauthorized,
  serverError,
} from '@/lib/api-response'

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    if (session.role !== 'ADMIN') return forbidden()

    const { id } = await params

    const existing = await db.user.findFirst({ where: { id, deletedAt: null } })
    if (!existing) return notFound('ユーザー')

    const body = await req.json()
    const parsed = UpdateUserSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('入力値が正しくありません', parsed.error.issues)
    }

    // 自分自身の管理者権限を剥奪しない
    if (id === session.id && parsed.data.role === 'USER') {
      return badRequest('自分自身の管理者権限は変更できません')
    }

    const user = await db.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return ok({ user })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    if (session.role !== 'ADMIN') return forbidden()

    const { id } = await params

    if (id === session.id) {
      return badRequest('自分自身は削除できません')
    }

    const existing = await db.user.findFirst({ where: { id, deletedAt: null } })
    if (!existing) return notFound('ユーザー')

    await db.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    })

    return ok({ success: true })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
