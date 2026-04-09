import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

export function unauthorized() {
  return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: '権限がありません' }, { status: 403 })
}

export function notFound(resource = 'リソース') {
  return NextResponse.json(
    { error: `${resource}が見つかりません` },
    { status: 404 }
  )
}

export function conflict<T>(message: string, data?: T) {
  return NextResponse.json({ error: message, data }, { status: 409 })
}

export function serverError(err: unknown) {
  console.error('[API Error]', err)
  const message =
    err instanceof Error ? err.message : '予期しないエラーが発生しました'
  return NextResponse.json({ error: message }, { status: 500 })
}

export function handleZodError(err: ZodError) {
  const details = err.issues.map((i) => ({
    field: i.path.join('.'),
    message: i.message,
  }))
  return badRequest('入力値が正しくありません', details)
}

/**
 * Route Handler の共通エラーハンドラ
 */
export function withErrorHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return handler().catch((err: unknown) => {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return unauthorized()
    }
    if (err instanceof ZodError) {
      return handleZodError(err)
    }
    return serverError(err)
  })
}
