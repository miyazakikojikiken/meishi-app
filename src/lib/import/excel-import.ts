import * as XLSX from 'xlsx'
import { db } from '@/lib/db'
import {
  normalizeCompanyName,
  normalizePersonName,
  normalizePhone,
  normalizeEmail,
  normalizeDate,
} from '@/lib/normalize'
import { findDuplicateCandidates } from '@/lib/duplicate-score'

// ─────────────────────────────────────────────
// Excel列名 → DBフィールド マッピング
// ─────────────────────────────────────────────
const COLUMN_MAP: Record<string, string> = {
  No: 'legacyNo',
  会社名: 'companyName',
  部署名: 'department',
  役職: 'title',
  氏名: 'fullName',
  '郵便番号(1)': 'postalCode',
  '住所(1)［全て］': 'address',
  住所: 'address',
  'TEL-1(1)': 'tel',
  TEL: 'tel',
  電話番号: 'tel',
  'FAX(1)': 'fax',
  FAX: 'fax',
  'Email(1)': 'email',
  Email: 'email',
  メールアドレス: 'email',
  '会社名（英名）': 'companyNameEn',
  '会社名（カナ）': 'companyNameKana',
  '氏名［姓］': 'lastName',
  '氏名［名］': 'firstName',
  '氏名（カナ）': 'fullNameKana',
  '氏名（カナ）［姓］': 'lastNameKana',
  '氏名（カナ）［名］': 'firstNameKana',
  国: 'country',
  '携帯電話(1)': 'mobile',
  携帯電話: 'mobile',
  取得日: 'acquiredAt',
  英字氏名: 'fullNameEn',
  会社名カナ統合: 'companyNameKana',
  名刺交換場所: 'cardExchangePlace',
  接点メモ: 'contactMemo',
  備考: 'note',
  読み取り精度: 'ocrAccuracy',
  相手分類: 'category',
  相手詳細分類: 'subCategory',
  対応状況: 'status',
  次回アクション: 'nextAction',
  最終接触日: 'lastContactedAt',
}

// コンタクト履歴用カラム（名刺台帳シートの履歴列）
const INTERACTION_COLUMN_MAP: Record<string, string> = {
  コンタクト日: 'contactedAt',
  区分: 'interactionType',
  タイトル: 'title',
  場所: 'place',
  コンタクトメモ: 'memo',
}

interface ImportResult {
  success: number
  error: number
  skip: number
  errors: { rowNumber: number; rawData: unknown; errorMessage: string }[]
}

// ─────────────────────────────────────────────
// メイン処理
// ─────────────────────────────────────────────
export async function processExcelImport(
  filePath: string,
  jobId: string,
  userId: string,
  duplicatePolicy: 'skip' | 'overwrite' = 'skip'
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    error: 0,
    skip: 0,
    errors: [],
  }

  // ── ファイル読み込み ──
  let wb: XLSX.WorkBook
  try {
    wb = XLSX.readFile(filePath, { cellDates: false, raw: false })
  } catch (err) {
    await db.importJob.update({
      where: { id: jobId },
      data: { status: 'ERROR' },
    })
    throw new Error(`Excelファイルの読み込みに失敗しました: ${err}`)
  }

  // ── シート選択（名刺台帳を優先） ──
  const sheetName =
    wb.SheetNames.find(
      (n) => n.includes('名刺台帳') || n.includes('名刺') || n.includes('台帳')
    ) ?? wb.SheetNames[0]

  const ws = wb.Sheets[sheetName]
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: '',
    raw: false,
  })

  await db.importJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING', totalRows: rawRows.length },
  })

  // ── 行ごとに処理 ──
  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i]
    const rowNumber = i + 2 // ヘッダー行分オフセット

    try {
      // 空行スキップ
      const values = Object.values(rawRow).filter(
        (v) => v !== '' && v !== null && v !== undefined
      )
      if (values.length === 0) {
        result.skip++
        continue
      }

      // ── フィールドマッピング ──
      const mapped: Record<string, unknown> = {}
      for (const [excelCol, dbField] of Object.entries(COLUMN_MAP)) {
        const val = rawRow[excelCol]
        if (val !== undefined && val !== '' && val !== null) {
          mapped[dbField] = val
        }
      }

      // 必須チェック
      if (!mapped.companyName || String(mapped.companyName).trim() === '') {
        throw new Error('会社名が空です')
      }

      // ── 型変換・正規化 ──
      const companyName = String(mapped.companyName ?? '').trim()
      const fullName = mapped.fullName ? String(mapped.fullName).trim() : null
      const email = mapped.email ? String(mapped.email).trim() : null
      const tel = mapped.tel ? String(mapped.tel).trim() : null
      const mobile = mapped.mobile ? String(mapped.mobile).trim() : null

      const contactData = {
        legacyNo: mapped.legacyNo
          ? parseInt(String(mapped.legacyNo), 10) || null
          : null,
        companyName,
        companyNameKana: mapped.companyNameKana
          ? String(mapped.companyNameKana).trim()
          : null,
        companyNameEn: mapped.companyNameEn
          ? String(mapped.companyNameEn).trim()
          : null,
        companyNameNormalized: normalizeCompanyName(companyName),
        department: mapped.department
          ? String(mapped.department).trim()
          : null,
        title: mapped.title ? String(mapped.title).trim() : null,
        lastName: mapped.lastName ? String(mapped.lastName).trim() : null,
        firstName: mapped.firstName ? String(mapped.firstName).trim() : null,
        fullName,
        lastNameKana: mapped.lastNameKana
          ? String(mapped.lastNameKana).trim()
          : null,
        firstNameKana: mapped.firstNameKana
          ? String(mapped.firstNameKana).trim()
          : null,
        fullNameKana: mapped.fullNameKana
          ? String(mapped.fullNameKana).trim()
          : null,
        fullNameEn: mapped.fullNameEn
          ? String(mapped.fullNameEn).trim()
          : null,
        fullNameNormalized: normalizePersonName(fullName),
        postalCode: mapped.postalCode
          ? String(mapped.postalCode).trim()
          : null,
        address: mapped.address ? String(mapped.address).trim() : null,
        country: mapped.country ? String(mapped.country).trim() : 'Japan',
        tel,
        telNormalized: normalizePhone(tel),
        fax: mapped.fax ? String(mapped.fax).trim() : null,
        mobile,
        mobileNormalized: normalizePhone(mobile),
        email,
        emailNormalized: normalizeEmail(email),
        cardExchangePlace: mapped.cardExchangePlace
          ? String(mapped.cardExchangePlace).trim()
          : null,
        contactMemo: mapped.contactMemo
          ? String(mapped.contactMemo).trim()
          : null,
        note: mapped.note ? String(mapped.note).trim() : null,
        category: mapped.category ? String(mapped.category).trim() : null,
        subCategory: mapped.subCategory
          ? String(mapped.subCategory).trim()
          : null,
        status: mapped.status ? String(mapped.status).trim() : 'active',
        nextAction: mapped.nextAction
          ? String(mapped.nextAction).trim()
          : null,
        ocrAccuracy: mapped.ocrAccuracy
          ? parseFloat(String(mapped.ocrAccuracy))
          : null,
        acquiredAt: normalizeDate(mapped.acquiredAt as string | number),
        lastContactedAt: normalizeDate(
          mapped.lastContactedAt as string | number
        ),
        createdBy: userId,
        updatedBy: userId,
      }

      // ── 重複チェック ──
      const duplicates = await findDuplicateCandidates({
        companyName,
        fullName,
        email,
        tel,
        mobile,
      })

      const highConfDuplicate = duplicates.find((d) => d.score >= 90)

      if (highConfDuplicate) {
        if (duplicatePolicy === 'skip') {
          result.skip++
          continue
        } else {
          // overwrite
          await db.contact.update({
            where: { id: highConfDuplicate.contactId },
            data: { ...contactData, updatedBy: userId },
          })
          result.success++
          continue
        }
      }

      // ── 登録 ──
      const contact = await db.contact.create({ data: contactData })

      // ── コンタクト履歴（名刺台帳にある場合）──
      const interactionData: Record<string, unknown> = {}
      for (const [excelCol, dbField] of Object.entries(INTERACTION_COLUMN_MAP)) {
        const val = rawRow[excelCol]
        if (val !== undefined && val !== '' && val !== null) {
          interactionData[dbField] = val
        }
      }

      if (interactionData.contactedAt) {
        const contactedAt = normalizeDate(
          interactionData.contactedAt as string | number
        )
        if (contactedAt) {
          await db.interactionHistory.create({
            data: {
              contactId: contact.id,
              contactedAt,
              interactionType: interactionData.interactionType
                ? String(interactionData.interactionType)
                : 'その他',
              title: interactionData.title
                ? String(interactionData.title)
                : null,
              place: interactionData.place
                ? String(interactionData.place)
                : null,
              memo: interactionData.memo ? String(interactionData.memo) : null,
              createdBy: userId,
            },
          })
        }
      }

      result.success++
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '不明なエラー'
      result.error++
      result.errors.push({ rowNumber, rawData: rawRow, errorMessage: message })

      // 失敗行ログをDBに記録
      try {
        await db.importJobRow.create({
          data: {
            importJobId: jobId,
            rowNumber,
            rawData: rawRow as unknown as import("@prisma/client").Prisma.JsonObject,
            errorMessage: message,
          },
        })
      } catch {
        // ログ保存失敗は無視
      }
    }
  }

  // ── ジョブ完了 ──
  await db.importJob.update({
    where: { id: jobId },
    data: {
      status: result.error > 0 && result.success === 0 ? 'ERROR' : 'DONE',
      successRows: result.success,
      errorRows: result.error,
      skipRows: result.skip,
    },
  })

  return result
}
