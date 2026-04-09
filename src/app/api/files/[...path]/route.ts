import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth'
import { unauthorized } from '@/lib/api-response'
import fs from 'fs'
import path from 'path'

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  gif: 'image/gif',
  webp: 'image/webp',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await requireSession()

    const { path: pathSegments } = await params
    // パストラバーサル対策
    const relativePath = pathSegments.join('/')
    const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '')
    const filePath = path.join(UPLOAD_BASE, safePath)

    // UPLOAD_BASE の外を参照しない
    if (!filePath.startsWith(UPLOAD_BASE)) {
      return new Response('Forbidden', { status: 403 })
    }

    if (!fs.existsSync(filePath)) {
      return new Response('Not Found', { status: 404 })
    }

    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    const mimeType = MIME_MAP[ext] ?? 'application/octet-stream'
    const fileBuffer = fs.readFileSync(filePath)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return new Response('Internal Server Error', { status: 500 })
  }
}
