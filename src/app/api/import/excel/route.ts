import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { ok, badRequest, forbidden, unauthorized, serverError } from '@/lib/api-response'
import { saveFile } from '@/lib/storage'
import { processExcelImport } from '@/lib/import/excel-import'

const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
]

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()

    // 管理者のみ
    if (session.role !== 'ADMIN') {
      return forbidden()
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const duplicatePolicy =
      (formData.get('duplicatePolicy') as string) === 'overwrite'
        ? 'overwrite'
        : 'skip'

    if (!file) {
      return badRequest('ファイルを選択してください')
    }

    // 拡張子チェック（MIMEが信頼できない場合の補完）
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      return badRequest('Excel（.xlsx/.xls）またはCSV（.csv）ファイルを選択してください')
    }

    if (file.size > MAX_SIZE_BYTES) {
      return badRequest('ファイルサイズが50MBを超えています')
    }

    // ファイル保存
    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = await saveFile(buffer, file.name, 'imports')

    // ジョブ作成
    const job = await db.importJob.create({
      data: {
        createdBy: session.id,
        fileName: file.name,
        filePath,
        status: 'PENDING',
        duplicatePolicy,
      },
    })

    // 非同期でインポート処理を実行
    setImmediate(() => {
      processExcelImport(filePath, job.id, session.id, duplicatePolicy).catch(
        (err) => {
          console.error('[Import] Background job failed:', err)
        }
      )
    })

    return ok({ jobId: job.id })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
