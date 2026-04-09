import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')

  // 管理者ユーザー
  const adminPw = await bcrypt.hash('admin1234', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '管理者',
      passwordHash: adminPw,
      role: 'ADMIN',
    },
  })

  // 一般ユーザー
  const userPw = await bcrypt.hash('user1234', 10)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'テストユーザー',
      passwordHash: userPw,
      role: 'USER',
    },
  })

  // サンプル会社
  const company1 = await prisma.company.create({
    data: {
      name: '株式会社サンプル',
      nameKana: 'カブシキガイシャサンプル',
      nameEn: 'Sample Co., Ltd.',
      nameNormalized: 'サンプル',
    },
  })

  const company2 = await prisma.company.create({
    data: {
      name: '株式会社テクノロジー',
      nameKana: 'カブシキガイシャテクノロジー',
      nameNormalized: 'テクノロジー',
    },
  })

  // サンプル名刺
  const contact1 = await prisma.contact.create({
    data: {
      companyId: company1.id,
      companyName: '株式会社サンプル',
      companyNameKana: 'カブシキガイシャサンプル',
      companyNameNormalized: 'サンプル',
      department: '営業部',
      title: '部長',
      lastName: '山田',
      firstName: '太郎',
      fullName: '山田 太郎',
      lastNameKana: 'ヤマダ',
      firstNameKana: 'タロウ',
      fullNameKana: 'ヤマダ タロウ',
      fullNameNormalized: 'やまだたろう',
      tel: '03-1234-5678',
      telNormalized: '0312345678',
      mobile: '090-1234-5678',
      mobileNormalized: '09012345678',
      email: 'yamada@sample.co.jp',
      emailNormalized: 'yamada@sample.co.jp',
      postalCode: '100-0001',
      address: '東京都千代田区千代田1-1-1',
      country: 'Japan',
      status: 'active',
      category: '顧客',
      subCategory: '既存顧客',
      acquiredAt: new Date('2024-01-15'),
      lastContactedAt: new Date('2024-06-01'),
      ownerUserId: user.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })

  const contact2 = await prisma.contact.create({
    data: {
      companyId: company1.id,
      companyName: '株式会社サンプル',
      companyNameKana: 'カブシキガイシャサンプル',
      companyNameNormalized: 'サンプル',
      department: '経営企画部',
      title: '課長',
      lastName: '佐藤',
      firstName: '花子',
      fullName: '佐藤 花子',
      lastNameKana: 'サトウ',
      firstNameKana: 'ハナコ',
      fullNameKana: 'サトウ ハナコ',
      fullNameNormalized: 'さとうはなこ',
      tel: '03-1234-5679',
      telNormalized: '0312345679',
      email: 'sato@sample.co.jp',
      emailNormalized: 'sato@sample.co.jp',
      status: 'pending',
      category: '顧客',
      acquiredAt: new Date('2024-03-20'),
      lastContactedAt: new Date('2024-07-15'),
      nextAction: '来月フォローアップ予定',
      ownerUserId: user.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })

  const contact3 = await prisma.contact.create({
    data: {
      companyId: company2.id,
      companyName: '株式会社テクノロジー',
      companyNameKana: 'カブシキガイシャテクノロジー',
      companyNameNormalized: 'テクノロジー',
      department: '開発部',
      title: 'エンジニア',
      lastName: '田中',
      firstName: '次郎',
      fullName: '田中 次郎',
      lastNameKana: 'タナカ',
      firstNameKana: 'ジロウ',
      fullNameKana: 'タナカ ジロウ',
      fullNameNormalized: 'たなかじろう',
      tel: '06-9876-5432',
      telNormalized: '0698765432',
      email: 'tanaka@technology.co.jp',
      emailNormalized: 'tanaka@technology.co.jp',
      status: 'active',
      category: 'パートナー',
      acquiredAt: new Date('2024-02-10'),
      ownerUserId: admin.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })

  // サンプルコンタクト履歴
  await prisma.interactionHistory.create({
    data: {
      contactId: contact1.id,
      contactedAt: new Date('2024-06-01'),
      interactionType: '商談',
      title: '第1回提案',
      place: '先方オフィス',
      memo: '製品説明を実施。興味を持っていただいた。来月デモ予定。',
      nextAction: 'デモ実施',
      status: 'pending',
      createdBy: user.id,
    },
  })

  await prisma.interactionHistory.create({
    data: {
      contactId: contact2.id,
      contactedAt: new Date('2024-07-15'),
      interactionType: '電話',
      title: '進捗確認',
      memo: '検討状況を確認。上長への報告待ち。',
      nextAction: '8月中旬に再フォロー',
      status: 'pending',
      createdBy: user.id,
    },
  })

  console.log('✅ Seed completed.')
  console.log('   管理者: admin@example.com / admin1234')
  console.log('   一般:   user@example.com  / user1234')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
