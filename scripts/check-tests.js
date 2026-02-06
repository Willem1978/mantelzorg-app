const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'willem' } },
    include: { caregiver: true }
  })

  if (!user || !user.caregiver) {
    console.log('Geen caregiver gevonden')
    return
  }

  console.log('User:', user.email)
  console.log('Caregiver ID:', user.caregiver.id)

  const tests = await prisma.belastbaarheidTest.findMany({
    where: { caregiverId: user.caregiver.id },
    orderBy: { completedAt: 'desc' },
    take: 3,
    select: {
      id: true,
      totaleBelastingScore: true,
      belastingNiveau: true,
      completedAt: true,
      isCompleted: true,
      _count: { select: { taakSelecties: true, antwoorden: true } }
    }
  })

  console.log('\nLaatste tests:')
  for (const t of tests) {
    console.log('  -', t.id.slice(0,8), '| Score:', t.totaleBelastingScore, '| Niveau:', t.belastingNiveau, '| Taken:', t._count.taakSelecties, '| Antw:', t._count.antwoorden)
  }
}
main().finally(() => prisma.$disconnect())
