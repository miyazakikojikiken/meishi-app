// ─────────────────────────────────────────────
// 共通型定義
// ─────────────────────────────────────────────

export interface SessionUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 名刺検索フィルタ
export interface CardFilters {
  companyName?: string
  fullName?: string
  department?: string
  tel?: string
  email?: string
  status?: string
  category?: string
  subCategory?: string
  lastContactedFrom?: string
  lastContactedTo?: string
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

// OCR抽出フィールド
export interface OcrExtractedFields {
  companyName?: string
  department?: string
  title?: string
  fullName?: string
  lastName?: string
  firstName?: string
  postalCode?: string
  address?: string
  tel?: string
  fax?: string
  mobile?: string
  email?: string
  nameReading?: string
}

export interface OcrConfidenceScores {
  companyName?: number
  department?: number
  title?: number
  fullName?: number
  lastName?: number
  firstName?: number
  postalCode?: number
  address?: number
  tel?: number
  fax?: number
  mobile?: number
  email?: number
  [key: string]: number | undefined
}

// 重複候補
export interface DuplicateCandidate {
  contactId: string
  score: number
  reasons: string[]
  contact: {
    id: string
    companyName: string
    fullName: string | null
    email: string | null
    tel: string | null
    department: string | null
    title: string | null
  }
}

// 対応状況の選択肢
export const STATUS_OPTIONS = [
  { value: 'active', label: 'アクティブ' },
  { value: 'pending', label: '対応中' },
  { value: 'negotiating', label: '商談中' },
  { value: 'closed_win', label: '受注' },
  { value: 'closed_lose', label: '失注' },
  { value: 'inactive', label: '非アクティブ' },
] as const

export const CATEGORY_OPTIONS = [
  { value: '顧客', label: '顧客' },
  { value: '見込客', label: '見込客' },
  { value: 'パートナー', label: 'パートナー' },
  { value: '仕入先', label: '仕入先' },
  { value: '競合', label: '競合' },
  { value: 'メディア', label: 'メディア' },
  { value: 'その他', label: 'その他' },
] as const

export const INTERACTION_TYPE_OPTIONS = [
  { value: '商談', label: '商談' },
  { value: '訪問', label: '訪問' },
  { value: '電話', label: '電話' },
  { value: 'メール', label: 'メール' },
  { value: '展示会', label: '展示会' },
  { value: 'オンライン', label: 'オンライン' },
  { value: 'その他', label: 'その他' },
] as const
