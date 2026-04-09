import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth'
import { findDuplicateCandidates } from '@/lib/duplicate-score'
import { ok, unauthorized, serverError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    await requireSession()

    const { searchParams } = new URL(req.url)

    const candidates = await findDuplicateCandidates({
      companyName: searchParams.get('company_name') ?? undefined,
      fullName: searchParams.get('full_name') ?? undefined,
      email: searchParams.get('email') ?? undefined,
      tel: searchParams.get('tel') ?? undefined,
      mobile: searchParams.get('mobile') ?? undefined,
      excludeId: searchParams.get('exclude_id') ?? undefined,
    })

    return ok({ candidates })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
