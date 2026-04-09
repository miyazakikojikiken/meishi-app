import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    await requireSession()

    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '30', 10))

    // 会社名でグルーピングして担当者一覧を取得
    const where: Record<string, unknown> = { deletedAt: null }
    if (name) {
      where.companyName = { contains: name, mode: 'insensitive' }
    }

    // 会社名ごとに集計
    const grouped = await db.contact.groupBy({
      by: ['companyName', 'companyNameKana', 'companyNameNormalized'],
      where,
      _count: { id: true },
      orderBy: { companyName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const totalGroups = await db.contact.groupBy({
      by: ['companyName'],
      where,
      _count: { id: true },
    })

    // 各会社の担当者一覧を取得
    const data = await Promise.all(
      grouped.map(async (g: typeof grouped[number]) => {
        const contacts = await db.contact.findMany({
          where: {
            companyName: g.companyName,
            deletedAt: null,
          },
          select: {
            id: true,
            fullName: true,
            title: true,
            department: true,
            tel: true,
            email: true,
            status: true,
            lastContactedAt: true,
            nextAction: true,
          },
          orderBy: { fullName: 'asc' },
        })
        return {
          companyName: g.companyName,
          companyNameKana: g.companyNameKana,
          contactCount: g._count.id,
          contacts,
        }
      })
    )

    return ok({
      data,
      total: totalGroups.length,
      page,
      limit,
      totalPages: Math.ceil(totalGroups.length / limit),
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
