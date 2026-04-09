/**
 * DBモデルの型定義（Prisma Client非依存）
 * Prisma generate が通らない環境でも型チェックが通る
 */

export type UserRole = 'ADMIN' | 'USER'
export type CardSide = 'FRONT' | 'BACK'
export type OcrStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR'
export type ImportStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR'

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Company {
  id: string
  name: string
  nameKana: string | null
  nameEn: string | null
  nameNormalized: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Contact {
  id: string
  legacyNo: number | null
  companyId: string | null
  companyName: string
  companyNameKana: string | null
  companyNameEn: string | null
  companyNameNormalized: string | null
  department: string | null
  title: string | null
  lastName: string | null
  firstName: string | null
  fullName: string | null
  lastNameKana: string | null
  firstNameKana: string | null
  fullNameKana: string | null
  fullNameEn: string | null
  fullNameNormalized: string | null
  postalCode: string | null
  address: string | null
  country: string | null
  tel: string | null
  telNormalized: string | null
  fax: string | null
  mobile: string | null
  mobileNormalized: string | null
  email: string | null
  emailNormalized: string | null
  cardExchangePlace: string | null
  contactMemo: string | null
  note: string | null
  category: string | null
  subCategory: string | null
  status: string | null
  nextAction: string | null
  lastContactedAt: Date | null
  acquiredAt: Date | null
  ocrAccuracy: number | null
  duplicateCandidates: unknown
  ownerUserId: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface BusinessCard {
  id: string
  contactId: string
  side: CardSide
  filePath: string
  fileName: string
  mimeType: string
  fileSize: number
  createdAt: Date
}

export interface InteractionHistory {
  id: string
  contactId: string
  contactedAt: Date
  interactionType: string
  title: string | null
  place: string | null
  memo: string | null
  nextAction: string | null
  status: string | null
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface OcrJob {
  id: string
  createdBy: string
  status: OcrStatus
  frontImagePath: string | null
  backImagePath: string | null
  rawOcrResult: unknown
  extractedFields: unknown
  confidenceScores: unknown
  overallAccuracy: number | null
  resultContactId: string | null
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ImportJob {
  id: string
  createdBy: string
  fileName: string
  filePath: string
  status: ImportStatus
  totalRows: number | null
  successRows: number
  errorRows: number
  skipRows: number
  duplicatePolicy: string
  createdAt: Date
  updatedAt: Date
}
