import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import {
  ok,
  created,
  badRequest,
  unauthorized,
  serverError,
} from '@/lib/api-response'
import {
  normalizeCompanyName,
  normalizePersonName,
  normalizePhone,
  normalizeEmail,
} from '@/lib/normalize'
import { findDuplicateCandidates } from '@/lib/duplicate-score'

// ── バリデーションスキーマ ──────────────────────
const ContactCreateSchema = z.object({
  companyName: z.string().min(1, '会社名は必須です').max(255),
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
  email: z.string().email('メールアドレスの形式が正しくありません').max(255).optional().nullable().or(z.literal('')),
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
  forceCreate: z.boolean().optional(),
})

// ── GET /api/cards ──────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()
    if (!session) return unauthorized()

    const { searchParams } = new URL(req.url)
    const companyName = searchParams.get('company_name') ?? ''
    const fullName = searchParams.get('full_name') ?? ''
    const department = searchParams.get('department') ?? ''
    const tel = searchParams.get('tel') ?? ''
    const email = searchParams.get('email') ?? ''
    const status = searchParams.get('status') ?? ''
    const category = searchParams.get('category') ?? ''
    const subCategory = searchParams.get('sub_category') ?? ''
    const lastContactedFrom = searchParams.get('last_contacted_from')
    const lastContactedTo = searchParams.get('last_contacted_to')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
    const sort = searchParams.get('sort') ?? 'createdAt'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    // ── where句を動的構築 ──
    const where: any = { deletedAt: null }

    if (companyName) {
      where.companyName = { contains: companyName, mode: 'insensitive' }
    }
    if (fullName) {
      where.fullName = { contains: fullName, mode: 'insensitive' }
    }
    if (department) {
      where.department = { contains: department, mode: 'insensitive' }
    }
    if (tel) {
      where.telNormalized = { contains: normalizePhone(tel) }
    }
    if (email) {
      where.emailNormalized = { contains: normalizeEmail(email) }
    }
    if (status) {
      where.status = status
    }
    if (category) {
      where.category = category
    }
    if (subCategory) {
      where.subCategory = { contains: subCategory, mode: 'insensitive' }
    }
    if (lastContactedFrom || lastContactedTo) {
      where.lastContactedAt = {}
      if (lastContactedFrom) where.lastContactedAt.gte = new Date(lastContactedFrom)
      if (lastContactedTo) where.lastContactedAt.lte = new Date(lastContactedTo)
    }

    // ── ソート ──
    const allowedSorts: Record<string, string> = {
      createdAt: 'createdAt',
      companyName: 'companyName',
      fullName: 'fullName',
      lastContactedAt: 'lastContactedAt',
      status: 'status',
      acquiredAt: 'acquiredAt',
    }
    const sortField = allowedSorts[sort] ?? 'createdAt'
    const orderBy = { [sortField]: order }

    const [data, total] = await Promise.all([
      db.contact.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          businessCards: {
            select: { id: true, side: true, filePath: true },
            take: 1,
          },
        },
      }),
      db.contact.count({ where }),
    ])

    return ok({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}

// ── POST /api/cards ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()

    const body = await req.json()
    const parsed = ContactCreateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('入力値が正しくありません', parsed.error.issues)
    }

    const { forceCreate, ...fields } = parsed.data

    // 正規化
    const email = fields.email && fields.email !== '' ? fields.email : null
    const data = {
      ...fields,
      email,
      companyNameNormalized: normalizeCompanyName(fields.companyName),
      fullNameNormalized: normalizePersonName(fields.fullName),
      telNormalized: normalizePhone(fields.tel),
      mobileNormalized: normalizePhone(fields.mobile),
      emailNormalized: normalizeEmail(email),
      acquiredAt: fields.acquiredAt ? new Date(fields.acquiredAt) : null,
      lastContactedAt: fields.lastContactedAt ? new Date(fields.lastContactedAt) : null,
      createdBy: session.id,
      updatedBy: session.id,
    }

    // 重複チェック
    if (!forceCreate) {
      const duplicates = await findDuplicateCandidates({
        companyName: fields.companyName,
        fullName: fields.fullName,
        email,
        tel: fields.tel,
        mobile: fields.mobile,
      })
      if (duplicates.length > 0) {
        return ok({ duplicates, requireConfirm: true }, 409)
      }
    }

    const contact = await db.contact.create({ data })
    return created({ contact })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
