import fs from 'fs'
import path from 'path'
import { uploadToGCS, deleteFromGCS } from '@/lib/gcs'

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
const USE_GCS = !!(process.env.GCS_BUCKET_NAME && process.env.GCS_CLIENT_EMAIL && process.env.GCS_PRIVATE_KEY)

/**
 * バッファを保存してパス/URLを返す
 * GCS環境変数が設定されていればGCSに、なければローカルに保存
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  subDir: string = 'misc'
): Promise<string> {
  const ext = path.extname(originalName).toLowerCase()
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`

  if (USE_GCS) {
    const filename = `${subDir}/${uniqueName}`
    const contentType = ext === '.pdf' ? 'application/pdf' : `image/${ext.slice(1)}`
    return await uploadToGCS(buffer, filename, contentType)
  }

  // ローカル保存（開発環境用）
  const dir = path.join(UPLOAD_BASE, subDir)
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, uniqueName)
  fs.writeFileSync(filePath, buffer)
  return filePath
}

/**
 * ファイルパスをURLに変換
 */
export function filePathToUrl(filePath: string): string {
  if (filePath.startsWith('https://')) return filePath
  const relative = path.relative(UPLOAD_BASE, filePath)
  return `/api/files/${relative.replace(/\\/g, '/')}`
}

/**
 * ファイルを削除
 */
export async function deleteFile(filePath: string): Promise<void> {
  if (filePath.startsWith('https://storage.googleapis.com/')) {
    const url = new URL(filePath)
    const filename = url.pathname.split('/').slice(2).join('/')
    await deleteFromGCS(filename)
    return
  }
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (err) {
    console.error('File delete error:', err)
  }
}
