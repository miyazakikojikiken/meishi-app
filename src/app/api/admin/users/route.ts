import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { ok, created, badRequest, forbidden, unauthorized, serverError } from '@/lib/api-response'

const CreateUserSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  name: z.string().min(1, '氏名は必須です').max(100),
  password: z.string().min(8, 'パスワードは8文字以上で設定してください'),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
})

export async function GET() {
  try {
    const session = await requireSession()
    if (session.role !== 'ADMIN') return forbidden()

    const users = await db.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return ok({ users })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    if (session.role !== 'ADMIN') return forbidden()

    const body = await req.json()
    const parsed = CreateUserSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('入力値が正しくありません', parsed.error.issues)
    }

    const { email, name, password, role } = parsed.data

    const existing = await db.user.findFirst({ where: { email } })
    if (existing) {
      return badRequest('このメールアドレスは既に使用されています')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: { email, name, passwordHash, role },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    })

    return created({ user })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return serverError(err)
  }
}
