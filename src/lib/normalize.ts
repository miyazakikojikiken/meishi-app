/**
 * 正規化ユーティリティ
 * 重複判定・検索精度向上のためのテキスト正規化
 */

/**
 * 全角英数字→半角変換
 */
function toHalfWidth(str: string): string {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  )
}

/**
 * 会社名の正規化
 * - 株式会社・有限会社等の法人格を除去
 * - 全角→半角
 * - スペース除去
 * - ハイフン統一
 * - 小文字化
 */
export function normalizeCompanyName(name: string | null | undefined): string {
  if (!name) return ''
  return toHalfWidth(name)
    .replace(/　/g, ' ')                    // 全角スペース→半角
    .replace(/\s+/g, '')                    // スペース全除去
    .replace(/株式会社/g, '')
    .replace(/（株）/g, '')
    .replace(/\(株\)/g, '')
    .replace(/（株）/g, '')
    .replace(/有限会社/g, '')
    .replace(/（有）/g, '')
    .replace(/\(有\)/g, '')
    .replace(/合同会社/g, '')
    .replace(/（合）/g, '')
    .replace(/\(合\)/g, '')
    .replace(/一般社団法人/g, '')
    .replace(/公益社団法人/g, '')
    .replace(/一般財団法人/g, '')
    .replace(/公益財団法人/g, '')
    .replace(/[－ー―‐ｰ]/g, '-')           // ハイフン統一
    .replace(/・/g, '')
    .replace(/。/g, '')
    .toLowerCase()
    .trim()
}

/**
 * 氏名の正規化
 * - スペース除去
 * - 小文字化（英字）
 */
export function normalizePersonName(name: string | null | undefined): string {
  if (!name) return ''
  return toHalfWidth(name)
    .replace(/\s+/g, '')
    .replace(/　/g, '')
    .toLowerCase()
    .trim()
}

/**
 * 電話番号の正規化（数字のみ抽出）
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  return phone.replace(/[^\d]/g, '')
}

/**
 * メールアドレスの正規化（小文字化・トリム）
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return ''
  return toHalfWidth(email).toLowerCase().trim()
}

/**
 * 日付文字列の正規化
 * Excel シリアル値 / YYYY/MM/DD / YYYYMMDD 等に対応
 */
export function normalizeDate(
  value: string | number | null | undefined
): Date | null {
  if (value === null || value === undefined || value === '') return null

  // Excelのシリアル値（数値）
  if (typeof value === 'number') {
    // Excel日付のエポック: 1900/1/1 (ただし1900/2/29バグあり)
    const epoch = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(epoch.getTime() + value * 86400000)
    if (!isNaN(date.getTime())) return date
    return null
  }

  const str = String(value).trim()
  if (!str) return null

  // YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    const d = new Date(
      `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`
    )
    return isNaN(d.getTime()) ? null : d
  }

  // YYYY/MM/DD → YYYY-MM-DD
  const normalized = str.replace(/\//g, '-')
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

/**
 * 郵便番号の正規化（XXX-XXXX 形式）
 */
export function normalizePostalCode(
  postal: string | null | undefined
): string {
  if (!postal) return ''
  const digits = postal.replace(/[^\d]/g, '')
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }
  return postal
}
