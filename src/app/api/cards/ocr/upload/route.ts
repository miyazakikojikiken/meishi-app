import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { runOcrJob } from '@/lib/ocr/google-vision'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()

    const formData = await req.formData()
    const frontFile = formData.get('front') as File | null
    const backFile = formData.get('back') as File | null

    if (!frontFile && !backFile) {
      return badRequest('名刺画像をアップロードしてください')
    }

    // バリデーション
    for (const [label, file] of [
      ['表面', frontFile],
      ['裏面', backFile],
    ] as [string, File | null][]) {
      if (!file) continue
      if (!ALLOWED_TYPES.includes(file.type)) {
        return badRequest(
          `${label}のファイル形式が非対応です（JPG/PNG/PDFのみ）`
        )
      }
      if (file.size > MAX_SIZE_BYTES) {
        return badRequest(`${label}のファイルサイズが10MBを超えています`)
      }
    }

    // OCRジョブ作成
    const job = await db.ocrJob.create({
      data: {
        createdBy: session.id,
        status: 'PENDING',
      },
    })

    // OCRを非同期で実行（本番ではキュー化推奨）
    // setImmediate で現在のリクエストをブロックしない
    setImmediate(() => {
      runOcrJob(job.id, frontFile, backFile).catch((err) => {
        console.error('[OCR] Background job failed:', err)
      })
    })

    return ok({ jobId: job.id, status: 'PROCESSING' })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
