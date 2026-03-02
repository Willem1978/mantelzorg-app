import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Content Herstructurering ===')
  console.log('Start migratie van categorieën, sub-hoofdstukken en tags...\n')

  // ============================================
  // 1. CATEGORIE SLUG MAPPING - Update artikelen
  // ============================================
  console.log('1. Categorie slugs updaten op artikelen...')

  const slugMappings: { oldSlug: string; newSlug: string }[] = [
    // "praktische-tips" blijft "praktische-tips" (geen wijziging nodig)
    { oldSlug: 'zelfzorg', newSlug: 'zelfzorg-balans' },
    { oldSlug: 'rechten', newSlug: 'rechten-regelingen' },
    { oldSlug: 'financieel', newSlug: 'geld-financien' },
    { oldSlug: 'hulpmiddelen-producten', newSlug: 'hulpmiddelen-technologie' },
  ]

  for (const mapping of slugMappings) {
    const result = await prisma.$executeRaw`
      UPDATE "Artikel"
      SET categorie = ${mapping.newSlug}
      WHERE categorie = ${mapping.oldSlug}
    `
    console.log(`  "${mapping.oldSlug}" → "${mapping.newSlug}": ${result} artikelen bijgewerkt`)
  }

  // ============================================
  // 2. UPDATE ContentCategorie records (type=LEREN)
  // ============================================
  console.log('\n2. LEREN categorieën updaten en aanmaken...')

  // Stap 2a: Update bestaande categorieën met nieuwe slugs
  // We moeten eerst de slug updaten waar die verandert.
  // Prisma upsert werkt op de unique constraint [type, slug], dus voor slug-wijzigingen
  // moeten we eerst de bestaande records updaten via een directe query.

  const categorieSlugUpdates: { oldSlug: string; newSlug: string }[] = [
    { oldSlug: 'zelfzorg', newSlug: 'zelfzorg-balans' },
    { oldSlug: 'rechten', newSlug: 'rechten-regelingen' },
    { oldSlug: 'financieel', newSlug: 'geld-financien' },
    { oldSlug: 'hulpmiddelen-producten', newSlug: 'hulpmiddelen-technologie' },
  ]

  for (const update of categorieSlugUpdates) {
    const result = await prisma.$executeRaw`
      UPDATE "ContentCategorie"
      SET slug = ${update.newSlug}, "updatedAt" = NOW()
      WHERE type = 'LEREN' AND slug = ${update.oldSlug}
    `
    if (result > 0) {
      console.log(`  ContentCategorie slug "${update.oldSlug}" → "${update.newSlug}" bijgewerkt`)
    } else {
      console.log(`  ContentCategorie slug "${update.oldSlug}" niet gevonden (mogelijk al gemigreerd)`)
    }
  }

  // Stap 2b: Upsert alle LEREN categorieën met bijgewerkte gegevens
  const lerenCategorieen = [
    {
      slug: 'praktische-tips',
      naam: 'Praktische tips',
      emoji: '📋',
      beschrijving: 'Tips voor dagelijks organiseren, tijdmanagement en zorgtaken',
      volgorde: 1,
    },
    {
      slug: 'zelfzorg-balans',
      naam: 'Zelfzorg & balans',
      emoji: '🧘',
      beschrijving: 'Overbelasting herkennen, grenzen stellen en ontspanning',
      volgorde: 2,
    },
    {
      slug: 'rechten-regelingen',
      naam: 'Rechten & regelingen',
      emoji: '⚖️',
      beschrijving: 'Wettelijke rechten, Wmo, Wlz, Zvw, pgb en mantelzorgwaardering',
      volgorde: 3,
    },
    {
      slug: 'geld-financien',
      naam: 'Geld & financiën',
      emoji: '💰',
      beschrijving: 'Toeslagen, vergoedingen en belastingvoordelen',
      volgorde: 4,
    },
    {
      slug: 'hulpmiddelen-technologie',
      naam: 'Hulpmiddelen & technologie',
      emoji: '🔧',
      beschrijving: 'Hulpmiddelen, aanpassingen en slimme technologie',
      volgorde: 5,
    },
    {
      slug: 'werk-mantelzorg',
      naam: 'Werk & mantelzorg',
      emoji: '💼',
      beschrijving: 'Mantelzorg combineren met werk, rechten op de werkvloer',
      volgorde: 6,
    },
    {
      slug: 'samenwerken-netwerk',
      naam: 'Samenwerken & netwerk',
      emoji: '🤝',
      beschrijving: 'Hulp vragen, netwerk opbouwen en samenwerken met zorgprofessionals',
      volgorde: 7,
    },
  ]

  for (const cat of lerenCategorieen) {
    await prisma.contentCategorie.upsert({
      where: { type_slug: { type: 'LEREN', slug: cat.slug } },
      create: {
        type: 'LEREN',
        slug: cat.slug,
        naam: cat.naam,
        emoji: cat.emoji,
        beschrijving: cat.beschrijving,
        volgorde: cat.volgorde,
      },
      update: {
        naam: cat.naam,
        emoji: cat.emoji,
        beschrijving: cat.beschrijving,
        volgorde: cat.volgorde,
      },
    })
  }
  console.log(`  ${lerenCategorieen.length} LEREN categorieën upserted`)

  // ============================================
  // 3. SEED SUB-CATEGORIEËN (type=SUB_HOOFDSTUK)
  // ============================================
  console.log('\n3. Sub-hoofdstukken seeden...')

  // Update sub-hoofdstuk parentId referenties waar de parent slug is gewijzigd
  // We moeten eerst de parent slugs in sub-hoofdstukken bijwerken
  const lerenParents = await prisma.contentCategorie.findMany({
    where: { type: 'LEREN' },
    select: { id: true, slug: true },
  })
  const parentMap = Object.fromEntries(lerenParents.map((p) => [p.slug, p.id]))

  const subHoofdstukken: Record<string, { slug: string; naam: string }[]> = {
    'praktische-tips': [
      { slug: 'dagelijks-organiseren', naam: 'Dagelijks organiseren' },
      { slug: 'zorgtaken-verdelen', naam: 'Zorgtaken verdelen' },
      { slug: 'communicatie-zorgvrager', naam: 'Communicatie met zorgvrager' },
      { slug: 'afspraken-plannen', naam: 'Afspraken plannen' },
    ],
    'zelfzorg-balans': [
      { slug: 'overbelasting-herkennen', naam: 'Overbelasting herkennen' },
      { slug: 'grenzen-stellen', naam: 'Grenzen stellen' },
      { slug: 'ontspanning-bewegen', naam: 'Ontspanning & bewegen' },
      { slug: 'emotioneel-welzijn', naam: 'Emotioneel welzijn' },
      { slug: 'slaap-rust', naam: 'Slaap & rust' },
    ],
    'rechten-regelingen': [
      { slug: 'wmo-hulp', naam: 'Wmo hulp' },
      { slug: 'wlz-langdurige-zorg', naam: 'Wlz langdurige zorg' },
      { slug: 'pgb-aanvragen', naam: 'Pgb aanvragen' },
      { slug: 'mantelzorgwaardering', naam: 'Mantelzorgwaardering' },
      { slug: 'klachten-bezwaar', naam: 'Klachten & bezwaar' },
    ],
    'geld-financien': [
      { slug: 'toeslagen-subsidies', naam: 'Toeslagen & subsidies' },
      { slug: 'belastingvoordeel', naam: 'Belastingvoordeel' },
      { slug: 'zorgverzekering', naam: 'Zorgverzekering' },
      { slug: 'pgb-financieel', naam: 'Pgb financieel' },
    ],
    'hulpmiddelen-technologie': [
      { slug: 'dagelijkse-hulpmiddelen', naam: 'Dagelijkse hulpmiddelen' },
      { slug: 'slimme-technologie', naam: 'Slimme technologie' },
      { slug: 'woningaanpassingen', naam: 'Woningaanpassingen' },
      { slug: 'digitale-tools', naam: 'Digitale tools' },
    ],
    'werk-mantelzorg': [
      { slug: 'rechten-werkvloer', naam: 'Rechten op de werkvloer' },
      { slug: 'verlof-regelingen', naam: 'Verlof regelingen' },
      { slug: 'gesprek-werkgever', naam: 'Gesprek met werkgever' },
      { slug: 'thuiswerken-flexibiliteit', naam: 'Thuiswerken & flexibiliteit' },
    ],
    'samenwerken-netwerk': [
      { slug: 'hulp-vragen', naam: 'Hulp vragen' },
      { slug: 'zorgnetwerk-opbouwen', naam: 'Zorgnetwerk opbouwen' },
      { slug: 'samenwerken-professionals', naam: 'Samenwerken met professionals' },
      { slug: 'lotgenoten-contact', naam: 'Lotgenoten contact' },
    ],
  }

  let subCount = 0
  for (const [categorieSlug, subs] of Object.entries(subHoofdstukken)) {
    const parentId = parentMap[categorieSlug]
    if (!parentId) {
      console.log(`  WAARSCHUWING: Parent categorie "${categorieSlug}" niet gevonden, sub-hoofdstukken overgeslagen`)
      continue
    }

    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i]
      await prisma.contentCategorie.upsert({
        where: { type_slug: { type: 'SUB_HOOFDSTUK', slug: sub.slug } },
        create: {
          type: 'SUB_HOOFDSTUK',
          slug: sub.slug,
          naam: sub.naam,
          parentId,
          volgorde: i + 1,
        },
        update: {
          naam: sub.naam,
          parentId,
          volgorde: i + 1,
        },
      })
      subCount++
    }
  }
  console.log(`  ${subCount} sub-hoofdstukken seeded`)

  // ============================================
  // 4. SEED CONTENT TAGS
  // ============================================
  console.log('\n4. Content tags seeden...')

  // AANDOENING tags (12)
  const aandoeningTags = [
    { slug: 'dementie', naam: 'Dementie', emoji: '🧠', volgorde: 1 },
    { slug: 'kanker', naam: 'Kanker', emoji: '🎗️', volgorde: 2 },
    { slug: 'cva-beroerte', naam: 'CVA / Beroerte', emoji: '🫀', volgorde: 3 },
    { slug: 'psychisch', naam: 'Psychische aandoening', emoji: '🧩', volgorde: 4 },
    { slug: 'verstandelijk', naam: 'Verstandelijke beperking', emoji: '💡', volgorde: 5 },
    { slug: 'lichamelijk', naam: 'Lichamelijke beperking', emoji: '♿', volgorde: 6 },
    { slug: 'ouderdom', naam: 'Ouderdomsklachten', emoji: '👴', volgorde: 7 },
    { slug: 'chronisch-ziek', naam: 'Chronisch ziek', emoji: '💊', volgorde: 8 },
    { slug: 'niet-aangeboren-hersenletsel', naam: 'NAH (hersenletsel)', emoji: '🧠', volgorde: 9 },
    { slug: 'parkinson', naam: 'Parkinson', emoji: '🤲', volgorde: 10 },
    { slug: 'als', naam: 'ALS', emoji: '💪', volgorde: 11 },
    { slug: 'terminaal', naam: 'Terminale ziekte / palliatief', emoji: '🕊️', volgorde: 12 },
  ]

  for (const tag of aandoeningTags) {
    await prisma.contentTag.upsert({
      where: { slug: tag.slug },
      create: {
        type: 'AANDOENING',
        slug: tag.slug,
        naam: tag.naam,
        emoji: tag.emoji,
        volgorde: tag.volgorde,
      },
      update: {
        type: 'AANDOENING',
        naam: tag.naam,
        emoji: tag.emoji,
        volgorde: tag.volgorde,
      },
    })
  }
  console.log(`  ${aandoeningTags.length} AANDOENING tags seeded`)

  // SITUATIE tags (9)
  const situatieTags = [
    { slug: 'werkend', naam: 'Werkende mantelzorger', emoji: '💼', volgorde: 1 },
    { slug: 'jong', naam: 'Jonge mantelzorger', emoji: '🎒', volgorde: 2 },
    { slug: 'op-afstand', naam: 'Mantelzorg op afstand', emoji: '📍', volgorde: 3 },
    { slug: 'alleenstaand', naam: 'Alleenstaande mantelzorger', emoji: '🏠', volgorde: 4 },
    { slug: 'meervoudig', naam: 'Meervoudige mantelzorg', emoji: '👥', volgorde: 5 },
    { slug: 'partner', naam: 'Partnerzorg', emoji: '💑', volgorde: 6 },
    { slug: 'ouder-kind', naam: 'Ouder zorgt voor kind', emoji: '👪', volgorde: 7 },
    { slug: 'kind-ouder', naam: 'Kind zorgt voor ouder', emoji: '🤗', volgorde: 8 },
    { slug: 'rouwend', naam: 'Rouwende mantelzorger', emoji: '🕯️', volgorde: 9 },
  ]

  for (const tag of situatieTags) {
    await prisma.contentTag.upsert({
      where: { slug: tag.slug },
      create: {
        type: 'SITUATIE',
        slug: tag.slug,
        naam: tag.naam,
        emoji: tag.emoji,
        volgorde: tag.volgorde,
      },
      update: {
        type: 'SITUATIE',
        naam: tag.naam,
        emoji: tag.emoji,
        volgorde: tag.volgorde,
      },
    })
  }
  console.log(`  ${situatieTags.length} SITUATIE tags seeded`)

  // ============================================
  // SAMENVATTING
  // ============================================
  const totalTags = aandoeningTags.length + situatieTags.length
  console.log('\n=== Content Herstructurering Voltooid ===')
  console.log(`  Artikel categorie slugs gemigreerd: ${slugMappings.length} mappings`)
  console.log(`  LEREN categorieën: ${lerenCategorieen.length} (5 bijgewerkt, 2 nieuw)`)
  console.log(`  Sub-hoofdstukken: ${subCount}`)
  console.log(`  Content tags: ${totalTags} (${aandoeningTags.length} aandoening + ${situatieTags.length} situatie)`)
}

main()
  .catch((e) => {
    console.error('Fout bij content herstructurering:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
