import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import {
  ok,
  notFound,
  unauthorized,
  forbidden,
  serverError,
  badRequest,
} from '@/lib/api-response'
import {
  normalizeCompanyName,
  normalizePersonName,
  normalizePhone,
  normalizeEmail,
} from '@/lib/normalize'

const ContactUpdateSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  companyNameKana: z.string().max(255).optional().nullable(),
  companyNameEn: z.string().max(255).optional().nullable(),
  department: z.string().max(255).optional().nullable(),
  title: z.string().max(255).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  firstName: z.string().max(100).optional().nullable(),
  fullName: z.string().max(255).optional().nullable(),
  lastNameKana: z.string().max(100).optional().nullable(),
  firstNameKana: z.string().max(100).optional().nullable(),
  fullNameKana: z.string().max(255).optional().nullable(),
  fullNameEn: z.string().max(255).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  tel: z.string().max(50).optional().nullable(),
  fax: z.string().max(50).optional().nullable(),
  mobile: z.string().max(50).optional().nullable(),
  email: z
    .string()
    .email()
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  cardExchangePlace: z.string().max(255).optional().nullable(),
  contactMemo: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  subCategory: z.string().max(100).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  nextAction: z.string().optional().nullable(),
  lastContactedAt: z.string().optional().nullable(),
  acquiredAt: z.string().optional().nullable(),
  ownerUserId: z.string().uuid().optional().nullable(),
})

// ── GET /api/cards/:id ──────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession()
    const { id } = await params

    const contact = await db.contact.findFirst({
      where: { id, deletedAt: null },
      include: {
        businessCards: { orderBy: { createdAt: 'asc' } },
        interactionHistories: {
          where: { deletedAt: null },
          orderBy: { contactedAt: 'desc' },
          include: {
            creator: { select: { id: true, name: true } },
          },
        },
        company: true,
        owner: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    })

    if (!contact) return notFound('名刺')
    return ok({ contact })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}

// ── PATCH /api/cards/:id ────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id } = await params

    const existing = await db.contact.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) return notFound('名刺')

    const body = await req.json()
    const parsed = ContactUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('入力値が正しくありません', parsed.error.issues)
    }

    const fields = parsed.data
    const email =
      fields.email !== undefined
        ? fields.email === ''
          ? null
          : fields.email
        : undefined

    const updateData: any = {
      ...fields,
      email,
      updatedBy: session.id,
    }
    if (fields.companyName !== undefined) {
      updateData.companyNameNormalized = normalizeCompanyName(fields.companyName)
    }
    if (fields.fullName !== undefined) {
      updateData.fullNameNormalized = normalizePersonName(fields.fullName)
    }
    if (fields.tel !== undefined) {
      updateData.telNormalized = normalizePhone(fields.tel)
    }
    if (fields.mobile !== undefined) {
      updateData.mobileNormalized = normalizePhone(fields.mobile)
    }
    if (email !== undefined) {
      updateData.emailNormalized = normalizeEmail(email)
    }
    if (fields.acquiredAt !== undefined) {
      updateData.acquiredAt = fields.acquiredAt ? new Date(fields.acquiredAt) : null
    }
    if (fields.lastContactedAt !== undefined) {
      updateData.lastContactedAt = fields.lastContactedAt
        ? new Date(fields.lastContactedAt)
        : null
    }

    const contact = await db.contact.update({
      where: { id },
      data: updateData,
    })

    return ok({ contact })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}

// ── DELETE /api/cards/:id ───────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id } = await params

    const existing = await db.contact.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) return notFound('名刺')

    // 管理者 or 所有者のみ削除可
    if (
      session.role !== 'ADMIN' &&
      existing.ownerUserId !== session.id &&
      existing.createdBy !== session.id
    ) {
      return forbidden()
    }

    await db.contact.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: session.id },
    })

    return ok({ success: true })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
