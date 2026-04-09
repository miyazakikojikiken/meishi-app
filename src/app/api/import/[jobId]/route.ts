import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { ok, notFound, unauthorized, serverError } from '@/lib/api-response'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireSession()
    if (session.role !== 'ADMIN') return unauthorized()

    const { jobId } = await params

    const job = await db.importJob.findFirst({
      where: { id: jobId },
      include: {
        rows: {
          take: 100, // エラー行は最大100件表示
          orderBy: { rowNumber: 'asc' },
        },
        creator: { select: { id: true, name: true } },
      },
    })

    if (!job) return notFound('インポートジョブ')

    return ok({ job })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
