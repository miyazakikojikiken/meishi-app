import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { unauthorized, serverError, badRequest } from '@/lib/api-response'
import { normalizePhone } from '@/lib/normalize'

export async function GET(req: NextRequest) {
  try {
    await requireSession()

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv'

    // 検索条件（一覧と同じフィルタを引き継ぐ）
    const where: any = { deletedAt: null }
    const companyName = searchParams.get('company_name')
    const fullName = searchParams.get('full_name')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    if (companyName) where.companyName = { contains: companyName, mode: 'insensitive' }
    if (fullName) where.fullName = { contains: fullName, mode: 'insensitive' }
    if (status) where.status = status
    if (category) where.category = category

    const contacts = await db.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50000, // 上限5万件
    })

    // ── 行データ構築 ──
    const rows = contacts.map((c: typeof contacts[number], i: number) => ({
      No: c.legacyNo ?? i + 1,
      会社名: c.companyName,
      '会社名（カナ）': c.companyNameKana ?? '',
      '会社名（英名）': c.companyNameEn ?? '',
      部署名: c.department ?? '',
      役職: c.title ?? '',
      '氏名（姓）': c.lastName ?? '',
      '氏名（名）': c.firstName ?? '',
      氏名: c.fullName ?? '',
      '氏名（カナ）': c.fullNameKana ?? '',
      '英字氏名': c.fullNameEn ?? '',
      郵便番号: c.postalCode ?? '',
      住所: c.address ?? '',
      国: c.country ?? '',
      電話番号: c.tel ?? '',
      FAX: c.fax ?? '',
      携帯電話: c.mobile ?? '',
      メールアドレス: c.email ?? '',
      名刺交換場所: c.cardExchangePlace ?? '',
      接点メモ: c.contactMemo ?? '',
      備考: c.note ?? '',
      相手分類: c.category ?? '',
      相手詳細分類: c.subCategory ?? '',
      対応状況: c.status ?? '',
      次回アクション: c.nextAction ?? '',
      最終接触日: c.lastContactedAt
        ? new Date(c.lastContactedAt).toLocaleDateString('ja-JP')
        : '',
      取得日: c.acquiredAt
        ? new Date(c.acquiredAt).toLocaleDateString('ja-JP')
        : '',
      読み取り精度: c.ocrAccuracy != null ? Number(c.ocrAccuracy) : '',
      登録日時: c.createdAt.toLocaleDateString('ja-JP'),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)

    // 列幅設定
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 25 }, // 会社名
      { wch: 20 }, // カナ
      { wch: 20 }, // 英名
      { wch: 15 }, // 部署
      { wch: 12 }, // 役職
      { wch: 8 },  // 姓
      { wch: 8 },  // 名
      { wch: 14 }, // 氏名
      { wch: 16 }, // カナ
      { wch: 14 }, // 英字
      { wch: 10 }, // 郵便
      { wch: 30 }, // 住所
      { wch: 8 },  // 国
      { wch: 16 }, // TEL
      { wch: 16 }, // FAX
      { wch: 16 }, // 携帯
      { wch: 28 }, // メール
    ]

    XLSX.utils.book_append_sheet(wb, ws, '名刺台帳')

    if (format === 'csv') {
      const csv = '\uFEFF' + XLSX.utils.sheet_to_csv(ws) // BOM付きUTF-8
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename*=UTF-8''meishi_${Date.now()}.csv`,
        },
      })
    } else {
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return new Response(buf, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename*=UTF-8''meishi_${Date.now()}.xlsx`,
        },
      })
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
