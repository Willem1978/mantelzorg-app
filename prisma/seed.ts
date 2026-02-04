import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create intake categories with questions
  const categories = [
    {
      name: 'Zorgsituatie',
      description: 'Vragen over je huidige zorgsituatie',
      order: 1,
      questions: [
        { id: 'q1', question: 'Ik heb een goed overzicht van alle zorgtaken die ik uitvoer', order: 1 },
        { id: 'q2', question: 'De hoeveelheid zorg die ik geef past bij wat ik aankan', order: 2 },
        { id: 'q3', question: 'Ik kan de zorg goed combineren met mijn andere verantwoordelijkheden', order: 3 },
      ],
    },
    {
      name: 'Fysiek welzijn',
      description: 'Hoe beïnvloedt de zorg je lichamelijk?',
      order: 2,
      questions: [
        { id: 'q4', question: 'Ik voel me lichamelijk fit genoeg voor de zorgtaken', order: 1 },
        { id: 'q5', question: 'Ik krijg voldoende slaap en rust', order: 2 },
        { id: 'q6', question: 'Ik heb voldoende energie voor mezelf over na de zorgtaken', order: 3 },
      ],
    },
    {
      name: 'Emotioneel welzijn',
      description: 'Hoe voel je je emotioneel?',
      order: 3,
      questions: [
        { id: 'q7', question: 'Ik voel me emotioneel in balans', order: 1 },
        { id: 'q8', question: 'Ik heb voldoende mensen om mee te praten over mijn zorgsituatie', order: 2 },
        { id: 'q9', question: 'Ik maak me weinig zorgen over de toekomst van de zorgsituatie', order: 3 },
      ],
    },
    {
      name: 'Sociale contacten',
      description: 'Hoe is je sociale leven?',
      order: 4,
      questions: [
        { id: 'q10', question: 'Ik heb voldoende tijd voor sociale activiteiten', order: 1 },
        { id: 'q11', question: 'Mijn vrienden en familie begrijpen mijn situatie als mantelzorger', order: 2 },
        { id: 'q12', question: 'Ik voel me niet geïsoleerd door mijn zorgtaken', order: 3 },
      ],
    },
    {
      name: 'Ondersteuning',
      description: 'Welke hulp heb je nodig?',
      order: 5,
      questions: [
        { id: 'q13', question: 'Ik weet waar ik terecht kan voor hulp en ondersteuning', order: 1 },
        { id: 'q14', question: 'Ik krijg voldoende praktische hulp bij de zorgtaken', order: 2 },
        { id: 'q15', question: 'Is er nog iets dat je wilt delen over je situatie?', order: 3, type: 'TEXT' as const },
      ],
    },
  ]

  for (const cat of categories) {
    const category = await prisma.intakeCategory.upsert({
      where: { id: cat.name.toLowerCase().replace(/\s+/g, '-') },
      create: {
        id: cat.name.toLowerCase().replace(/\s+/g, '-'),
        name: cat.name,
        description: cat.description,
        order: cat.order,
      },
      update: {
        description: cat.description,
        order: cat.order,
      },
    })

    for (const q of cat.questions) {
      await prisma.intakeQuestion.upsert({
        where: { id: q.id },
        create: {
          id: q.id,
          categoryId: category.id,
          question: q.question,
          type: (q as any).type || 'SCALE',
          order: q.order,
          isRequired: true,
        },
        update: {
          question: q.question,
          type: (q as any).type || 'SCALE',
          order: q.order,
        },
      })
    }
  }

  // Create some sample resources
  const resources = [
    {
      title: 'Mantelzorglijn',
      description: 'Gratis telefonische ondersteuning voor mantelzorgers',
      url: 'https://mantelzorg.nl/mantelzorglijn',
      type: 'NATIONAL_SERVICE' as const,
      category: 'Ondersteuning',
      isNational: true,
    },
    {
      title: 'Respijtzorg',
      description: 'Tijdelijke overname van zorgtaken zodat je even op adem kunt komen',
      content: 'Respijtzorg is een vorm van zorg waarbij je zorgtaken tijdelijk worden overgenomen. Dit geeft je de kans om even bij te komen, een dagje weg te gaan, of gewoon rust te nemen.',
      type: 'ARTICLE' as const,
      category: 'Respijtzorg',
      isNational: true,
    },
    {
      title: 'Financiële regelingen mantelzorgers',
      description: 'Overzicht van financiële tegemoetkomingen voor mantelzorgers',
      url: 'https://www.rijksoverheid.nl/onderwerpen/mantelzorg',
      type: 'ARTICLE' as const,
      category: 'Financieel',
      isNational: true,
    },
  ]

  for (const resource of resources) {
    await prisma.resource.upsert({
      where: { id: resource.title.toLowerCase().replace(/\s+/g, '-') },
      create: {
        id: resource.title.toLowerCase().replace(/\s+/g, '-'),
        ...resource,
      },
      update: resource,
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
