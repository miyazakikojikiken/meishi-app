import fs from 'fs'
import path from 'path'

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')

/**
 * バッファをローカルに保存してパスを返す
 * 本番では S3 実装に差し替え可能
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  subDir: string = 'misc'
): Promise<string> {
  const dir = path.join(UPLOAD_BASE, subDir)
  fs.mkdirSync(dir, { recursive: true })

  const ext = path.extname(originalName).toLowerCase()
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const filePath = path.join(dir, uniqueName)

  fs.writeFileSync(filePath, buffer)
  return filePath
}

/**
 * ファイルパスをURLに変換
 */
export function filePathToUrl(filePath: string): string {
  const relative = path.relative(UPLOAD_BASE, filePath)
  return `/api/files/${relative.replace(/\\/g, '/')}`
}

/**
 * ファイルを削除
 */
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (err) {
    console.error('File delete error:', err)
  }
}
