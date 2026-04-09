/**
 * Google Cloud Vision API ラッパー
 * 将来 Azure Document Intelligence 等に差し替え可能なインターフェースで実装
 */

import { db } from '@/lib/db'
import { saveFile } from '@/lib/storage'
import type { OcrExtractedFields, OcrConfidenceScores } from '@/types'

// ─────────────────────────────────────────────
// インターフェース定義（差し替え可能）
// ─────────────────────────────────────────────
export interface OcrProvider {
  extractText(imageBuffer: Buffer, mimeType: string): Promise<string>
}

export interface OcrParseResult {
  fields: OcrExtractedFields
  confidence: OcrConfidenceScores
  overallAccuracy: number
  rawText: string
}

// ─────────────────────────────────────────────
// Google Cloud Vision API 実装
// ─────────────────────────────────────────────
class GoogleVisionProvider implements OcrProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async extractText(imageBuffer: Buffer, _mimeType: string): Promise<string> {
    const base64 = imageBuffer.toString('base64')

    const requestBody = {
      requests: [
        {
          image: { content: base64 },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          imageContext: {
            languageHints: ['ja', 'en'],
          },
        },
      ],
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Vision API error: ${response.status} ${err}`)
    }

    const data = await response.json()

    if (data.responses?.[0]?.error) {
      throw new Error(
        `Vision API response error: ${data.responses[0].error.message}`
      )
    }

    return data.responses?.[0]?.fullTextAnnotation?.text ?? ''
  }
}

// ─────────────────────────────────────────────
// テキストパーサー（ルールベース）
// ─────────────────────────────────────────────
function parseBusinessCardText(rawText: string): OcrParseResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const fields: OcrExtractedFields = {}
  const confidence: OcrConfidenceScores = {}

  for (const line of lines) {
    // ── メールアドレス ──
    if (!fields.email) {
      const m = line.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
      if (m) {
        fields.email = m[0]
        confidence.email = 0.97
      }
    }

    // ── FAX ──
    if (!fields.fax) {
      const m = line.match(
        /(?:FAX|Fax|fax|ＦＡＸ)\s*[:：]?\s*(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/i
      )
      if (m) {
        fields.fax = m[1].replace(/\s/g, '')
        confidence.fax = 0.88
      }
    }

    // ── 携帯電話 ──
    if (!fields.mobile) {
      const m = line.match(
        /(?:携帯|Mobile|mobile|Cell|HP)\s*[:：]?\s*(0[789]0[-\s]?\d{4}[-\s]?\d{4})/i
      )
      if (m) {
        fields.mobile = m[1].replace(/\s/g, '')
        confidence.mobile = 0.88
      }
      // 行全体が携帯番号パターン
      if (!fields.mobile) {
        const m2 = line.match(/^(0[789]0[-\s]?\d{4}[-\s]?\d{4})$/)
        if (m2) {
          fields.mobile = m2[1].replace(/\s/g, '')
          confidence.mobile = 0.75
        }
      }
    }

    // ── TEL ──
    if (!fields.tel) {
      const m = line.match(
        /(?:TEL|Tel|tel|電話|℡)\s*[:：]?\s*(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/i
      )
      if (m) {
        fields.tel = m[1].replace(/\s/g, '')
        confidence.tel = 0.88
      }
      // 行全体が固定電話パターン（携帯でないもの）
      if (!fields.tel) {
        const m2 = line.match(/^(0[1-6]\d{1,3}[-\s]\d{2,4}[-\s]\d{4})$/)
        if (m2 && !fields.mobile?.includes(m2[1].replace(/\s/g, ''))) {
          fields.tel = m2[1].replace(/\s/g, '')
          confidence.tel = 0.72
        }
      }
    }

    // ── 郵便番号 ──
    if (!fields.postalCode) {
      const m = line.match(/〒?\s*(\d{3}[-\s]\d{4}|\d{7})/)
      if (m) {
        fields.postalCode = m[1].replace(/\s/g, '')
        confidence.postalCode = 0.92
      }
    }

    // ── 住所 ──
    if (!fields.address) {
      const m = line.match(
        /(?:東京都|大阪府|京都府|北海道|.{2,4}[都道府県]).{1,}/
      )
      if (m) {
        fields.address = line
        confidence.address = 0.75
      }
    }

    // ── 会社名 ──
    if (!fields.companyName) {
      if (
        line.match(
          /株式会社|有限会社|合同会社|（株）|\(株\)|Co\.,?\s*Ltd|Inc\.|Corp\.|LLC|LLP/i
        )
      ) {
        fields.companyName = line
        confidence.companyName = 0.82
      }
    }
  }

  // 会社名がまだなければ最初の行を仮採用
  if (!fields.companyName && lines.length > 0) {
    fields.companyName = lines[0]
    confidence.companyName = 0.45
  }

  // 全体精度計算（必須フィールドの平均）
  const keyFields: (keyof OcrConfidenceScores)[] = [
    'companyName',
    'email',
    'tel',
  ]
  const scores = keyFields
    .map((k) => confidence[k])
    .filter((v): v is number => v !== undefined)

  const overallAccuracy =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
      : 0

  return { fields, confidence, overallAccuracy, rawText }
}

// ─────────────────────────────────────────────
// メイン実行関数（ジョブIDを受け取って非同期で処理）
// ─────────────────────────────────────────────
export async function runOcrJob(
  jobId: string,
  frontFile: File | null,
  backFile: File | null
): Promise<void> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  try {
    await db.ocrJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    })

    let frontPath: string | undefined
    let backPath: string | undefined
    let combinedText = ''

    if (!apiKey) {
      // APIキー未設定時はダミーデータで動作確認用
      console.warn('[OCR] GOOGLE_VISION_API_KEY が未設定です。ダミーデータを使用します。')
      combinedText = dummyOcrText()
    } else {
      const provider = new GoogleVisionProvider(apiKey)

      if (frontFile) {
        const buf = Buffer.from(await frontFile.arrayBuffer())
        frontPath = await saveFile(buf, frontFile.name, 'ocr')
        const text = await provider.extractText(buf, frontFile.type)
        combinedText += text + '\n'
      }

      if (backFile) {
        const buf = Buffer.from(await backFile.arrayBuffer())
        backPath = await saveFile(buf, backFile.name, 'ocr')
        const text = await provider.extractText(buf, backFile.type)
        combinedText += text + '\n'
      }
    }

    // 画像保存（ダミーモードでもパスを保存）
    if (frontFile && !frontPath) {
      const buf = Buffer.from(await frontFile.arrayBuffer())
      frontPath = await saveFile(buf, frontFile.name, 'ocr')
    }
    if (backFile && !backPath) {
      const buf = Buffer.from(await backFile.arrayBuffer())
      backPath = await saveFile(buf, backFile.name, 'ocr')
    }

    const parsed = parseBusinessCardText(combinedText)

    await db.ocrJob.update({
      where: { id: jobId },
      data: {
        status: 'DONE',
        frontImagePath: frontPath,
        backImagePath: backPath,
        rawOcrResult: { text: combinedText },
        extractedFields: parsed.fields as object,
        confidenceScores: parsed.confidence,
        overallAccuracy: parsed.overallAccuracy,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '不明なエラー'
    console.error('[OCR] Error:', message)
    await db.ocrJob.update({
      where: { id: jobId },
      data: {
        status: 'ERROR',
        errorMessage: message,
      },
    })
  }
}

/**
 * APIキー未設定時の動作確認用ダミーテキスト
 */
function dummyOcrText(): string {
  return `株式会社サンプルカンパニー
営業本部 第一営業部
部長
山田 太郎
Taro Yamada

〒100-0001
東京都千代田区千代田1-1-1 サンプルビル10F

TEL: 03-1234-5678
FAX: 03-1234-5679
携帯: 090-1234-5678
E-mail: yamada@sample-company.co.jp
`
}
