/**
 * このファイルは後方互換性のためのプレースホルダーです。
 * OCR確定保存は /api/cards/ocr/[jobId]/confirm を使用してください。
 */
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'jobId を指定してください: /api/cards/ocr/{jobId}/confirm' },
    { status: 400 }
  )
}
