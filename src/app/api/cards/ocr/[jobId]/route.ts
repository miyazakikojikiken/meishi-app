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
    const { jobId } = await params

    const job = await db.ocrJob.findFirst({
      where: { id: jobId },
    })

    if (!job) return notFound('OCRジョブ')

    // 作成者 or 管理者のみ参照可
    if (job.createdBy !== session.id && session.role !== 'ADMIN') {
      return unauthorized()
    }

    return ok({ job })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
