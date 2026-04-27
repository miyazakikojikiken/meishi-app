/**
 * Google Cloud Vision API ラッパー
 * 縦書き・横書き両対応版
 */

import { db } from '@/lib/db'
import { saveFile } from '@/lib/storage'
import type { OcrExtractedFields, OcrConfidenceScores } from '@/types'

export interface OcrProvider {
  extractText(imageBuffer: Buffer, mimeType: string): Promise<string>
}

export interface OcrParseResult {
  fields: OcrExtractedFields
  confidence: OcrConfidenceScores
  overallAccuracy: number
  rawText: string
}

interface WordInfo {
  text: string
  fontSize: number
}

interface BlockInfo {
  text: string
  words: WordInfo[]
  fontSize: number
}

// ─────────────────────────────────────────────
// Google Cloud Vision API 実装
// ─────────────────────────────────────────────
class GoogleVisionProvider {
  private apiKey: string
  constructor(apiKey: string) { this.apiKey = apiKey }

  async extractWithLayout(imageBuffer: Buffer): Promise<{ rawText: string; blocks: BlockInfo[] }> {
    const base64 = imageBuffer.toString('base64')
    const requestBody = {
      requests: [{
        image: { content: base64 },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
        imageContext: { languageHints: ['ja', 'en'] },
      }],
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
    )
    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Vision API error: ${response.status} ${err}`)
    }
    const data = await response.json()
    if (data.responses?.[0]?.error) {
      throw new Error(`Vision API response error: ${data.responses[0].error.message}`)
    }

    const fullText = data.responses?.[0]?.fullTextAnnotation
    if (!fullText) return { rawText: '', blocks: [] }

    const rawText = fullText.text ?? ''
    const blocks: BlockInfo[] = []

    for (const page of fullText.pages ?? []) {
      for (const block of page.blocks ?? []) {
        const blockWords: WordInfo[] = []
        let blockText = ''

        for (const para of block.paragraphs ?? []) {
          for (const word of para.words ?? []) {
            const wordText = (word.symbols ?? []).map((s: { text: string }) => s.text).join('')
            if (!wordText) continue

            const verts = word.boundingBox?.vertices ?? []
            let fontSize = 20
            if (verts.length >= 4) {
              const ys = verts.map((v: { y?: number }) => v.y ?? 0)
              const xs = verts.map((v: { x?: number }) => v.x ?? 0)
              const h = Math.max(...ys) - Math.min(...ys)
              const w = Math.max(...xs) - Math.min(...xs)
              fontSize = Math.max(h, w * 0.6)
            }
            blockWords.push({ text: wordText, fontSize })
            blockText += wordText
          }
        }

        if (blockText) {
          const maxFontSize = blockWords.reduce((max, w) => Math.max(max, w.fontSize), 0)
          blocks.push({ text: blockText, words: blockWords, fontSize: maxFontSize })
        }
      }
    }

    return { rawText, blocks }
  }
}

// ─────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────
function isJapaneseName(str: string): boolean {
  return /^[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]{2,8}$/.test(str)
}

const TITLE_KEYWORDS = /代表取締役|取締役|専務|常務|社長|副社長|会長|部長|課長|係長|主任|担当|マネージャー|ディレクター|リーダー|エンジニア|デザイナー|コンサルタント|アドバイザー|プロデューサー|チーフ|シニア|CEO|COO|CTO|CFO|Director|Manager|Engineer|Designer|President|Executive/i
const DEPT_KEYWORDS = /営業部|営業本部|開発部|技術部|総務部|人事部|経理部|財務部|企画部|マーケティング|広報部|製造部|品質管理|システム部|研究開発|事業部|管理部|Division|Department|Group|グループ|チーム/i
const SKIP_PATTERNS = /https?:\/\/|www\.|\.co\.jp|\.com|\.net|\.org|[0-9０-９]級|施工|管理技士|技能士|資格|免許|〒|\d{3}-\d{4}|TEL|FAX|Email|Mail|型枠工事|駆体工事|土木|外構/i

// ─────────────────────────────────────────────
// パーサー（縦書き・横書き両対応）
// ─────────────────────────────────────────────
function parseWithLayout(rawText: string, blocks: BlockInfo[]): OcrParseResult {
  const fields: OcrExtractedFields = {}
  const confidence: OcrConfidenceScores = {}

  // デバッグログ
  console.log('[OCR] rawText lines:', rawText.split('\n').filter(Boolean).slice(0, 20))
  console.log('[OCR] blocks count:', blocks.length)
  console.log('[OCR] blocks:', JSON.stringify(blocks.map(b => ({ text: b.text, fontSize: Math.round(b.fontSize) })).slice(0, 15)))

  // フォントサイズの計算：短いテキスト（10文字以下）のブロックのみ対象
  // 長いブロックは複数行が結合されてfontSizeが不正確なため除外
  const shortBlockFontSizes = blocks
    .filter(b => b.text.replace(/\s/g, '').length <= 10 && b.fontSize > 0)
    .map(b => b.fontSize)
    .sort((a, b) => a - b)
  const allFontSizes = blocks.map(b => b.fontSize).filter(s => s > 0).sort((a, b) => a - b)
  const fontSizes = shortBlockFontSizes.length > 0 ? shortBlockFontSizes : allFontSizes
  const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] ?? 20
  // 閾値を下げて検出しやすくする（中央値の1.2倍以上を大きいフォントとみなす）
  const largeFontThreshold = medianFontSize * 1.2
  console.log('[OCR] medianFontSize:', medianFontSize, 'largeFontThreshold:', largeFontThreshold)

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)

  // ── rawText から確実な情報を抽出 ──
  for (const line of lines) {
    if (!fields.email) {
      const m = line.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
      if (m) { fields.email = m[0]; confidence.email = 0.97 }
    }
    if (!fields.fax) {
      const m = line.match(/(?:FAX|Fax|fax|ＦＡＸ)\s*[:：]?\s*(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/i)
      if (m) { fields.fax = m[1].replace(/\s/g, ''); confidence.fax = 0.88 }
    }
    if (!fields.mobile) {
      const m = line.match(/(?:携帯|Mobile|Cell|HP)\s*[:：]?\s*(0[789]0[-\s]?\d{4}[-\s]?\d{4})/i)
      if (m) { fields.mobile = m[1].replace(/\s/g, ''); confidence.mobile = 0.88 }
      else {
        const m2 = line.match(/^(0[789]0[-\s]?\d{4}[-\s]?\d{4})$/)
        if (m2) { fields.mobile = m2[1].replace(/\s/g, ''); confidence.mobile = 0.75 }
      }
    }
    if (!fields.tel) {
      const m = line.match(/(?:TEL|Tel|tel|電話|℡)\s*[:：]?\s*(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/i)
      if (m) { fields.tel = m[1].replace(/\s/g, ''); confidence.tel = 0.88 }
      else {
        const m2 = line.match(/^(0[1-6]\d{1,3}[-\s]\d{2,4}[-\s]\d{4})$/)
        if (m2) { fields.tel = m2[1].replace(/\s/g, ''); confidence.tel = 0.72 }
      }
    }
    if (!fields.postalCode) {
      const m = line.match(/〒?\s*(\d{3}[-\s]\d{4}|\d{7})/)
      if (m) { fields.postalCode = m[1].replace(/\s/g, ''); confidence.postalCode = 0.92 }
    }
    if (!fields.address) {
      const m = line.match(/(?:東京都|大阪府|京都府|北海道|.{2,3}[都道府県]).{3,}/)
      if (m) { fields.address = line; confidence.address = 0.75 }
    }
    if (!fields.companyName) {
      if (line.match(/株式会社|有限会社|合同会社|（株）|\(株\)|Co\.,?\s*Ltd|Inc\.|Corp\.|LLC/i)) {
        fields.companyName = line; confidence.companyName = 0.88
      }
    }
    if (!fields.title && TITLE_KEYWORDS.test(line) && !SKIP_PATTERNS.test(line) && line.length <= 20) {
      fields.title = line; confidence.title = 0.82
    }
    if (!fields.department && DEPT_KEYWORDS.test(line) && !SKIP_PATTERNS.test(line)) {
      fields.department = line; confidence.department = 0.78
    }
  }

  // ── バウンディングボックスを使った氏名抽出 ──
  const nameCandidates: { text: string; score: number }[] = []

  for (const block of blocks) {
    const text = block.text.replace(/\s+/g, '')
    if (!text) continue
    if (SKIP_PATTERNS.test(text)) continue
    if (TITLE_KEYWORDS.test(text) && text.length <= 10) continue
    if (DEPT_KEYWORDS.test(text)) continue
    // 会社名の完全一致のみスキップ（部分一致は除外しない）
    if (fields.companyName && text === fields.companyName.replace(/\s/g, '')) continue

    // 大きいフォントの漢字（縦書き名刺の氏名）
    if (block.fontSize >= largeFontThreshold && /^[\u4E00-\u9FFF]{1,4}$/.test(text)) {
      nameCandidates.push({ text, score: 0.90 })
      continue
    }

    // スペース区切りの姓名（横書き名刺）
    const parts = block.text.trim().split(/[\s　]+/)
    if (parts.length === 2 && parts.every(p => isJapaneseName(p)) && block.text.trim().length <= 10) {
      nameCandidates.push({ text: block.text.trim(), score: 0.88 })
      continue
    }

    // スペースなしの漢字名（2〜5文字）
    if (isJapaneseName(text) && text.length >= 2 && text.length <= 5) {
      const score = block.fontSize >= medianFontSize ? 0.72 : 0.55
      nameCandidates.push({ text, score })
    }
  }

  // rawText からも補完
  for (const line of lines) {
    if (SKIP_PATTERNS.test(line) || TITLE_KEYWORDS.test(line) || DEPT_KEYWORDS.test(line)) continue
    if (fields.companyName && line.trim() === fields.companyName.trim()) continue

    const trimmed = line.replace(/\s+/g, ' ').trim()
    const parts = trimmed.split(/[\s　]+/)
    if (parts.length === 2 && parts.every(isJapaneseName) && trimmed.length <= 10) {
      if (!nameCandidates.some(c => c.text === trimmed)) {
        nameCandidates.push({ text: trimmed, score: 0.85 })
      }
    }
    if (isJapaneseName(trimmed) && trimmed.length >= 2 && trimmed.length <= 5) {
      if (!nameCandidates.some(c => c.text.replace(/\s/g, '') === trimmed)) {
        nameCandidates.push({ text: trimmed, score: 0.60 })
      }
    }
    if (/^[\u3040-\u309F\s　]{3,12}$/.test(trimmed) && !fields.nameReading) {
      fields.nameReading = trimmed; confidence.nameReading = 0.75
    }
  }

  // 縦書き名刺の場合：大きいフォントの候補を2つ結合して姓名を作る
  // 縦書き名刺対応: 大きいフォントの漢字ブロックを複数結合して氏名を作る
  const largeKanjiBlocks = blocks.filter(b => {
    const t = b.text.replace(/\s/g, '')
    return (
      b.fontSize >= largeFontThreshold &&
      /^[\u4E00-\u9FFF]{1,3}$/.test(t) &&
      !SKIP_PATTERNS.test(t) &&
      !TITLE_KEYWORDS.test(t) &&
      !DEPT_KEYWORDS.test(t) &&
      !(fields.companyName && fields.companyName.replace(/\s/g, '') === t)
    )
  }).sort((a, b) => b.fontSize - a.fontSize)

  console.log('[OCR] largeKanjiBlocks:', JSON.stringify(largeKanjiBlocks.map(b => ({ text: b.text, fontSize: Math.round(b.fontSize) }))))

  if (largeKanjiBlocks.length >= 2) {
    // フォントサイズが最大のブロックを姓、2番目を名とする
    // （名刺では会社名と同じフォントで姓が書かれることが多い）
    const sorted = [...largeKanjiBlocks].sort((a, b) => b.fontSize - a.fontSize)
    const lastName = sorted[0].text.replace(/\s/g, '')
    const firstName = sorted[1].text.replace(/\s/g, '')
    fields.fullName = lastName + ' ' + firstName
    fields.lastName = lastName
    fields.firstName = firstName
    confidence.fullName = 0.90
    confidence.lastName = 0.90
    confidence.firstName = 0.90
    console.log('[OCR] 縦書き氏名結合:', fields.fullName)
  } else if (largeKanjiBlocks.length === 1) {
    // 1ブロックのみの場合はそのまま氏名候補に追加
    const text = largeKanjiBlocks[0].text.replace(/\s/g, '')
    if (!nameCandidates.some(c => c.text.replace(/\s/g, '') === text)) {
      nameCandidates.push({ text, score: 0.88 })
    }
  }

  // まだ氏名が確定していない場合
  if (!fields.fullName && nameCandidates.length > 0) {
    const best = nameCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.text.replace(/\s/g, '').length - a.text.replace(/\s/g, '').length
    })[0]

    fields.fullName = best.text.replace(/\s+/g, ' ').trim()
    confidence.fullName = best.score

    const parts = best.text.trim().split(/[\s　]+/)
    if (parts.length === 2) {
      fields.lastName = parts[0]; fields.firstName = parts[1]
      confidence.lastName = best.score; confidence.firstName = best.score
    } else {
      const name = best.text.replace(/\s/g, '')
      if (name.length === 3) { fields.lastName = name.slice(0, 1); fields.firstName = name.slice(1) }
      else if (name.length >= 4) { fields.lastName = name.slice(0, 2); fields.firstName = name.slice(2) }
      if (fields.lastName) confidence.lastName = best.score * 0.8
      if (fields.firstName) confidence.firstName = best.score * 0.8
    }
  }

  if (!fields.companyName && lines.length > 0) {
    fields.companyName = lines[0]; confidence.companyName = 0.40
  }

  const keyFields: (keyof OcrConfidenceScores)[] = ['companyName', 'fullName', 'email', 'tel']
  const scores = keyFields.map(k => confidence[k]).filter((v): v is number => v !== undefined)
  const overallAccuracy = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
    : 0

  return { fields, confidence, overallAccuracy, rawText }
}

// ─────────────────────────────────────────────
// メイン実行関数
// ─────────────────────────────────────────────
export async function runOcrJob(
  jobId: string,
  frontFile: File | null,
  backFile: File | null
): Promise<void> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  try {
    await db.ocrJob.update({ where: { id: jobId }, data: { status: 'PROCESSING' } })

    let frontPath: string | undefined
    let backPath: string | undefined
    let combinedText = ''
    let allBlocks: BlockInfo[] = []

    if (!apiKey) {
      console.warn('[OCR] GOOGLE_VISION_API_KEY が未設定です。ダミーデータを使用します。')
      combinedText = dummyOcrText()
    } else {
      const provider = new GoogleVisionProvider(apiKey)

      if (frontFile) {
        const buf = Buffer.from(await frontFile.arrayBuffer())
        frontPath = await saveFile(buf, frontFile.name, 'ocr')
        const result = await provider.extractWithLayout(buf)
        combinedText += result.rawText + '\n'
        allBlocks = allBlocks.concat(result.blocks)
      }

      if (backFile) {
        const buf = Buffer.from(await backFile.arrayBuffer())
        backPath = await saveFile(buf, backFile.name, 'ocr')
        const result = await provider.extractWithLayout(buf)
        combinedText += result.rawText + '\n'
        allBlocks = allBlocks.concat(result.blocks)
      }
    }

    if (frontFile && !frontPath) {
      const buf = Buffer.from(await frontFile.arrayBuffer())
      frontPath = await saveFile(buf, frontFile.name, 'ocr')
    }
    if (backFile && !backPath) {
      const buf = Buffer.from(await backFile.arrayBuffer())
      backPath = await saveFile(buf, backFile.name, 'ocr')
    }

    const parsed = parseWithLayout(combinedText, allBlocks)

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
    await db.ocrJob.update({ where: { id: jobId }, data: { status: 'ERROR', errorMessage: message } })
  }
}

function dummyOcrText(): string {
  return `株式会社サンプルカンパニー
営業本部 第一営業部
部長
山田 太郎
〒100-0001
東京都千代田区千代田1-1-1
TEL: 03-1234-5678
FAX: 03-1234-5679
携帯: 090-1234-5678
E-mail: yamada@sample-company.co.jp
`
}
