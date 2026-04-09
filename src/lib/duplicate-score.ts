import { db } from './db'
import {
  normalizeCompanyName,
  normalizePersonName,
  normalizePhone,
  normalizeEmail,
} from './normalize'
import type { DuplicateCandidate } from '@/types'

export interface DuplicateCheckInput {
  companyName?: string | null
  fullName?: string | null
  email?: string | null
  tel?: string | null
  mobile?: string | null
  companyNameKana?: string | null
  fullNameKana?: string | null
  excludeId?: string
}

/**
 * スコアリング基準:
 *   メール一致        : 100点
 *   電話一致          :  80点
 *   携帯一致          :  80点
 *   会社名+氏名一致   :  90点
 *   会社名カナ+氏名カナ:  70点
 *   会社名のみ一致    :  30点
 *   氏名のみ一致      :  20点
 *
 * 60点以上を重複候補として返す
 */
export const DUPLICATE_THRESHOLD = 60

export async function findDuplicateCandidates(
  input: DuplicateCheckInput
): Promise<DuplicateCandidate[]> {
  const normCompany = normalizeCompanyName(input.companyName)
  const normName = normalizePersonName(input.fullName)
  const normEmail = normalizeEmail(input.email)
  const normTel = normalizePhone(input.tel)
  const normMobile = normalizePhone(input.mobile)

  // OR条件を動的に構築
  
  const orConditions: any[] = []

  if (normEmail) {
    orConditions.push({ emailNormalized: normEmail })
  }
  if (normTel && normTel.length >= 9) {
    orConditions.push({ telNormalized: normTel })
  }
  if (normMobile && normMobile.length >= 9) {
    orConditions.push({ mobileNormalized: normMobile })
  }
  if (normCompany && normName) {
    orConditions.push({
      companyNameNormalized: normCompany,
      fullNameNormalized: normName,
    })
  }

  if (orConditions.length === 0) return []

  const rows = await db.contact.findMany({
    where: {
      deletedAt: null,
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      OR: orConditions,
    },
    select: {
      id: true,
      companyName: true,
      fullName: true,
      email: true,
      tel: true,
      department: true,
      title: true,
      emailNormalized: true,
      telNormalized: true,
      mobileNormalized: true,
      companyNameNormalized: true,
      fullNameNormalized: true,
    },
    take: 20,
  })

  const results = new Map<string, DuplicateCandidate>()

  for (const row of rows) {
    let score = 0
    const reasons: string[] = []

    if (normEmail && row.emailNormalized === normEmail) {
      score += 100
      reasons.push('メールアドレス一致')
    }
    if (
      normTel &&
      normTel.length >= 9 &&
      row.telNormalized === normTel
    ) {
      score += 80
      reasons.push('電話番号一致')
    }
    if (
      normMobile &&
      normMobile.length >= 9 &&
      row.mobileNormalized === normMobile
    ) {
      score += 80
      reasons.push('携帯番号一致')
    }
    if (
      normCompany &&
      normName &&
      row.companyNameNormalized === normCompany &&
      row.fullNameNormalized === normName
    ) {
      score += 90
      reasons.push('会社名・氏名が一致')
    } else if (normCompany && row.companyNameNormalized === normCompany) {
      score += 30
      reasons.push('会社名が一致')
    } else if (normName && row.fullNameNormalized === normName) {
      score += 20
      reasons.push('氏名が一致')
    }

    if (score >= DUPLICATE_THRESHOLD && !results.has(row.id)) {
      results.set(row.id, {
        contactId: row.id,
        score,
        reasons,
        contact: {
          id: row.id,
          companyName: row.companyName,
          fullName: row.fullName,
          email: row.email,
          tel: row.tel,
          department: row.department,
          title: row.title,
        },
      })
    }
  }

  return Array.from(results.values()).sort((a, b) => b.score - a.score)
}
