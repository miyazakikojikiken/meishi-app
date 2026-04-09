import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { ok, badRequest, notFound, unauthorized, serverError } from '@/lib/api-response'

const UpdateSchema = z.object({
  contactedAt: z.string().optional(),
  interactionType: z.string().max(50).optional(),
  title: z.string().max(255).optional().nullable(),
  place: z.string().max(255).optional().nullable(),
  memo: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  status: z.string().max(50).optional().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession()
    const { id } = await params

    const existing = await db.interactionHistory.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) return notFound('コンタクト履歴')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('入力値が正しくありません', parsed.error.issues)
    }

    const { contactedAt, ...rest } = parsed.data
    const history = await db.interactionHistory.update({
      where: { id },
      data: {
        ...rest,
        ...(contactedAt ? { contactedAt: new Date(contactedAt) } : {}),
      },
    })

    return ok({ history })
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
    await requireSession()
    const { id } = await params

    const existing = await db.interactionHistory.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) return notFound('コンタクト履歴')

    await db.interactionHistory.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return ok({ success: true })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
