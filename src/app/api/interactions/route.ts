import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/api-response'

const InteractionCreateSchema = z.object({
  contactId: z.string().uuid('contactIdが正しくありません'),
  contactedAt: z.string().min(1, 'コンタクト日は必須です'),
  interactionType: z.string().min(1, '区分は必須です').max(50),
  title: z.string().max(255).optional().nullable(),
  place: z.string().max(255).optional().nullable(),
  memo: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  status: z.string().max(50).optional().nullable(),
})

// ── GET /api/interactions ───────────────────────
export async function GET(req: NextRequest) {
  try {
    await requireSession()

    const { searchParams } = new URL(req.url)
    const contactId = searchParams.get('contact_id')
    const companyName = searchParams.get('company_name') ?? ''
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))

    const where: any = { deletedAt: null }

    if (contactId) where.contactId = contactId
    if (type) where.interactionType = type
    if (from || to) {
      where.contactedAt = {}
      if (from) where.contactedAt.gte = new Date(from)
      if (to) where.contactedAt.lte = new Date(to)
    }
    if (companyName) {
      where.contact = {
        companyName: { contains: companyName, mode: 'insensitive' },
        deletedAt: null,
      }
    }

    const [data, total] = await Promise.all([
      db.interactionHistory.findMany({
        where,
        orderBy: { contactedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contact: {
            select: {
              id: true,
              companyName: true,
              fullName: true,
              title: true,
              department: true,
            },
          },
          creator: { select: { id: true, name: true } },
        },
      }),
      db.interactionHistory.count({ where }),
    ])

    return ok({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}

// ── POST /api/interactions ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()

    const body = await req.json()
    const parsed = InteractionCreateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('入力値が正しくありません', parsed.error.issues)
    }

    const { contactedAt, ...rest } = parsed.data
    const contactedDate = new Date(contactedAt)

    const history = await db.interactionHistory.create({
      data: {
        ...rest,
        contactedAt: contactedDate,
        createdBy: session.id,
      },
      include: {
        contact: { select: { id: true, companyName: true, fullName: true } },
      },
    })

    // 名刺の最終接触日を更新（より新しい日付の場合のみ）
    const contact = await db.contact.findUnique({
      where: { id: parsed.data.contactId },
      select: { lastContactedAt: true },
    })
    if (
      !contact?.lastContactedAt ||
      contactedDate > new Date(contact.lastContactedAt)
    ) {
      await db.contact.update({
        where: { id: parsed.data.contactId },
        data: {
          lastContactedAt: contactedDate,
          ...(parsed.data.nextAction ? { nextAction: parsed.data.nextAction } : {}),
          ...(parsed.data.status ? { status: parsed.data.status } : {}),
          updatedBy: session.id,
        },
      })
    }

    return created({ history })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
