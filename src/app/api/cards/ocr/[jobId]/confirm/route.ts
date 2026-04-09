import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import {
  created,
  badRequest,
  notFound,
  unauthorized,
  serverError,
  ok,
} from '@/lib/api-response'
import {
  normalizeCompanyName,
  normalizePersonName,
  normalizePhone,
  normalizeEmail,
} from '@/lib/normalize'
import { findDuplicateCandidates } from '@/lib/duplicate-score'

const ConfirmSchema = z.object({
  fields: z.object({
    companyName: z.string().min(1, '会社名は必須です').max(255),
    companyNameKana: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    firstName: z.string().optional().nullable(),
    fullName: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    tel: z.string().optional().nullable(),
    fax: z.string().optional().nullable(),
    mobile: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
  }),
  forceCreate: z.boolean().optional().default(false),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireSession()
    const { jobId } = await params

    // ジョブ確認
    const job = await db.ocrJob.findFirst({ where: { id: jobId } })
    if (!job) return notFound('OCRジョブ')
    if (job.status !== 'DONE') {
      return badRequest('OCR処理が完了していません')
    }

    const body = await req.json()
    const parsed = ConfirmSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('入力値が正しくありません', parsed.error.issues)
    }

    const { fields, forceCreate } = parsed.data
    const email =
      fields.email && fields.email !== '' ? fields.email : null

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

    // 名刺登録
    const contact = await db.contact.create({
      data: {
        companyName: fields.companyName,
        companyNameKana: fields.companyNameKana ?? null,
        companyNameNormalized: normalizeCompanyName(fields.companyName),
        department: fields.department ?? null,
        title: fields.title ?? null,
        lastName: fields.lastName ?? null,
        firstName: fields.firstName ?? null,
        fullName: fields.fullName ?? null,
        fullNameNormalized: normalizePersonName(fields.fullName),
        postalCode: fields.postalCode ?? null,
        address: fields.address ?? null,
        tel: fields.tel ?? null,
        telNormalized: normalizePhone(fields.tel),
        fax: fields.fax ?? null,
        mobile: fields.mobile ?? null,
        mobileNormalized: normalizePhone(fields.mobile),
        email,
        emailNormalized: normalizeEmail(email),
        ocrAccuracy: job.overallAccuracy,
        createdBy: session.id,
        updatedBy: session.id,
      },
    })

    // 画像を business_cards に登録
    const imagesToSave: { side: 'FRONT' | 'BACK'; path: string }[] = []
    if (job.frontImagePath) {
      imagesToSave.push({ side: 'FRONT', path: job.frontImagePath })
    }
    if (job.backImagePath) {
      imagesToSave.push({ side: 'BACK', path: job.backImagePath })
    }

    for (const img of imagesToSave) {
      const fileName = img.path.split('/').pop() ?? ''
      const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        pdf: 'application/pdf',
      }
      await db.businessCard.create({
        data: {
          contactId: contact.id,
          side: img.side,
          filePath: img.path,
          fileName,
          mimeType: mimeMap[ext] ?? 'image/jpeg',
          fileSize: 0, // TODO: 実ファイルサイズを取得
        },
      })
    }

    // ジョブに結果を紐付け
    await db.ocrJob.update({
      where: { id: jobId },
      data: { resultContactId: contact.id },
    })

    return created({ contact })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
