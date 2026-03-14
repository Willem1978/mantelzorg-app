import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Content Herstructurering ===')
  console.log('Start migratie van categorieën, subcategorieën en tags...\n')

  // ============================================
  // 1. CATEGORIE SLUG MAPPING - Update artikelen
  // ============================================
  console.log('1. Categorie slugs updaten op artikelen...')

  const slugMappings: { oldSlug: string; newSlug: string }[] = [
    { oldSlug: 'praktische-tips', newSlug: 'dagelijks-zorgen' },
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
  // 2. CONTENT CATEGORIEËN UPDATEN
  // ============================================
  console.log('\n2. ContentCategorie records updaten...')

  // Update bestaande ContentCategorie slugs
  for (const mapping of slugMappings) {
    await prisma.$executeRaw`
      UPDATE "ContentCategorie"
      SET slug = ${mapping.newSlug}
      WHERE slug = ${mapping.oldSlug}
    `
  }

  // Upsert alle 7 hoofdcategorieën
  const hoofdcategorieen = [
    { slug: 'dagelijks-zorgen', naam: 'Dagelijks zorgen', emoji: '🏠', volgorde: 1, beschrijving: 'Alles over dagritme, persoonlijke verzorging, maaltijden, huishouden en veiligheid' },
    { slug: 'zelfzorg-balans', naam: 'Zelfzorg & balans', emoji: '💆', volgorde: 2, beschrijving: 'Overbelasting herkennen, grenzen stellen, ontspanning en emotionele steun' },
    { slug: 'rechten-regelingen', naam: 'Rechten & regelingen', emoji: '⚖️', volgorde: 3, beschrijving: 'Wmo, Wlz, Zvw, PGB, cliëntondersteuning en mantelzorgwaardering' },
    { slug: 'geld-financien', naam: 'Geld & financiën', emoji: '💰', volgorde: 4, beschrijving: 'Eigen bijdrage, toeslagen, belastingvoordelen en kosten besparen' },
    { slug: 'hulpmiddelen-technologie', naam: 'Hulpmiddelen & technologie', emoji: '🔧', volgorde: 5, beschrijving: 'Hulpmiddelen thuis, digitale hulpmiddelen, domotica en woningaanpassingen' },
    { slug: 'werk-mantelzorg', naam: 'Werk & mantelzorg', emoji: '💼', volgorde: 6, beschrijving: 'Combineren werk en zorg, verlofregeling, flexibel werken' },
    { slug: 'samenwerken-netwerk', naam: 'Samenwerken & netwerk', emoji: '🤝', volgorde: 7, beschrijving: 'Hulp vragen, professionele zorg, taakverdeling en respijtzorg' },
  ]

  for (const cat of hoofdcategorieen) {
    await prisma.contentCategorie.upsert({
      where: { slug: cat.slug },
      update: { naam: cat.naam, emoji: cat.emoji, volgorde: cat.volgorde, beschrijving: cat.beschrijving },
      create: {
        type: 'LEREN',
        slug: cat.slug,
        naam: cat.naam,
        emoji: cat.emoji,
        volgorde: cat.volgorde,
        beschrijving: cat.beschrijving,
        isActief: true,
      },
    })
    console.log(`  ✓ ${cat.emoji} ${cat.naam} (${cat.slug})`)
  }

  // ============================================
  // 3. SUBCATEGORIEËN SEEDEN
  // ============================================
  console.log('\n3. Subcategorieën seeden...')

  const subcategorieen: { categorie: string; slug: string; naam: string; volgorde: number }[] = [
    // Dagelijks zorgen
    { categorie: 'dagelijks-zorgen', slug: 'dagritme-plannen', naam: 'Dagritme & plannen', volgorde: 1 },
    { categorie: 'dagelijks-zorgen', slug: 'persoonlijke-verzorging', naam: 'Persoonlijke verzorging', volgorde: 2 },
    { categorie: 'dagelijks-zorgen', slug: 'maaltijden-voeding', naam: 'Maaltijden & voeding', volgorde: 3 },
    { categorie: 'dagelijks-zorgen', slug: 'huishouden', naam: 'Huishouden', volgorde: 4 },
    { categorie: 'dagelijks-zorgen', slug: 'veiligheid-thuis', naam: 'Veiligheid thuis', volgorde: 5 },
    { categorie: 'dagelijks-zorgen', slug: 'medicatie-behandelingen', naam: 'Medicatie & behandelingen', volgorde: 6 },
    // Zelfzorg & balans
    { categorie: 'zelfzorg-balans', slug: 'overbelasting-herkennen', naam: 'Overbelasting herkennen', volgorde: 1 },
    { categorie: 'zelfzorg-balans', slug: 'grenzen-stellen', naam: 'Grenzen stellen', volgorde: 2 },
    { categorie: 'zelfzorg-balans', slug: 'ontspanning-pauze', naam: 'Ontspanning & pauze', volgorde: 3 },
    { categorie: 'zelfzorg-balans', slug: 'emotionele-steun', naam: 'Emotionele steun', volgorde: 4 },
    { categorie: 'zelfzorg-balans', slug: 'rouw-verlies', naam: 'Rouw & verlies', volgorde: 5 },
    { categorie: 'zelfzorg-balans', slug: 'lotgenoten', naam: 'Lotgenoten', volgorde: 6 },
    // Rechten & regelingen
    { categorie: 'rechten-regelingen', slug: 'wmo-gemeente', naam: 'Wmo (gemeente)', volgorde: 1 },
    { categorie: 'rechten-regelingen', slug: 'wlz-langdurige-zorg', naam: 'Wlz (langdurige zorg)', volgorde: 2 },
    { categorie: 'rechten-regelingen', slug: 'zvw-zorgverzekering', naam: 'Zvw (zorgverzekering)', volgorde: 3 },
    { categorie: 'rechten-regelingen', slug: 'pgb', naam: 'PGB', volgorde: 4 },
    { categorie: 'rechten-regelingen', slug: 'clientondersteuning', naam: 'Cliëntondersteuning', volgorde: 5 },
    { categorie: 'rechten-regelingen', slug: 'mantelzorgwaardering', naam: 'Mantelzorgwaardering', volgorde: 6 },
    // Geld & financiën
    { categorie: 'geld-financien', slug: 'eigen-bijdrage', naam: 'Eigen bijdrage', volgorde: 1 },
    { categorie: 'geld-financien', slug: 'toeslagen-vergoedingen', naam: 'Toeslagen & vergoedingen', volgorde: 2 },
    { categorie: 'geld-financien', slug: 'belastingvoordelen', naam: 'Belastingvoordelen', volgorde: 3 },
    { categorie: 'geld-financien', slug: 'hulpmiddelen-aanvragen', naam: 'Hulpmiddelen aanvragen', volgorde: 4 },
    { categorie: 'geld-financien', slug: 'kosten-besparen', naam: 'Kosten besparen', volgorde: 5 },
    // Hulpmiddelen & technologie
    { categorie: 'hulpmiddelen-technologie', slug: 'hulpmiddelen-thuis', naam: 'Hulpmiddelen thuis', volgorde: 1 },
    { categorie: 'hulpmiddelen-technologie', slug: 'digitale-hulpmiddelen', naam: 'Digitale hulpmiddelen', volgorde: 2 },
    { categorie: 'hulpmiddelen-technologie', slug: 'domotica-slim', naam: 'Domotica & slimme technologie', volgorde: 3 },
    { categorie: 'hulpmiddelen-technologie', slug: 'aanpassingen-woning', naam: 'Aanpassingen woning', volgorde: 4 },
    // Werk & mantelzorg
    { categorie: 'werk-mantelzorg', slug: 'combineren-werk-zorg', naam: 'Combineren werk en zorg', volgorde: 1 },
    { categorie: 'werk-mantelzorg', slug: 'verlofregeling', naam: 'Wettelijke verlofregeling', volgorde: 2 },
    { categorie: 'werk-mantelzorg', slug: 'gesprek-werkgever', naam: 'Gesprek met werkgever', volgorde: 3 },
    { categorie: 'werk-mantelzorg', slug: 'flexibel-werken', naam: 'Flexibel werken', volgorde: 4 },
    { categorie: 'werk-mantelzorg', slug: 'stoppen-werken', naam: 'Stoppen met werken', volgorde: 5 },
    // Samenwerken & netwerk
    { categorie: 'samenwerken-netwerk', slug: 'hulp-vragen', naam: 'Hulp vragen', volgorde: 1 },
    { categorie: 'samenwerken-netwerk', slug: 'professionele-zorg', naam: 'Professionele zorg inschakelen', volgorde: 2 },
    { categorie: 'samenwerken-netwerk', slug: 'familie-taakverdeling', naam: 'Familie & taakverdeling', volgorde: 3 },
    { categorie: 'samenwerken-netwerk', slug: 'vrijwilligers-buddys', naam: 'Vrijwilligers & buddys', volgorde: 4 },
    { categorie: 'samenwerken-netwerk', slug: 'respijtzorg', naam: 'Respijtzorg', volgorde: 5 },
  ]

  for (const sub of subcategorieen) {
    const fullSlug = `${sub.categorie}/${sub.slug}`
    await prisma.contentCategorie.upsert({
      where: { slug: fullSlug },
      update: { naam: sub.naam, volgorde: sub.volgorde },
      create: {
        type: 'LEREN_SUB',
        slug: fullSlug,
        naam: sub.naam,
        parentSlug: sub.categorie,
        volgorde: sub.volgorde,
        isActief: true,
      },
    })
  }
  console.log(`  ✓ ${subcategorieen.length} subcategorieën aangemaakt/bijgewerkt`)

  // ============================================
  // 4. CONTENT TAGS SEEDEN (aandoeningen + situaties)
  // ============================================
  console.log('\n4. Content tags seeden...')

  const aandoeningTags = [
    { slug: 'dementie', naam: 'Dementie', emoji: '🧠', volgorde: 1 },
    { slug: 'kanker', naam: 'Kanker', emoji: '🎗️', volgorde: 2 },
    { slug: 'cva-beroerte', naam: 'CVA / Beroerte', emoji: '🫀', volgorde: 3 },
    { slug: 'hartfalen', naam: 'Hartfalen', emoji: '❤️', volgorde: 4 },
    { slug: 'copd', naam: 'COPD', emoji: '🫁', volgorde: 5 },
    { slug: 'diabetes', naam: 'Diabetes', emoji: '💉', volgorde: 6 },
    { slug: 'psychisch', naam: 'Psychische aandoening', emoji: '🧩', volgorde: 7 },
    { slug: 'verstandelijke-beperking', naam: 'Verstandelijke beperking', emoji: '🌈', volgorde: 8 },
    { slug: 'lichamelijke-beperking', naam: 'Lichamelijke beperking', emoji: '♿', volgorde: 9 },
    { slug: 'nah', naam: 'NAH (niet-aangeboren hersenletsel)', emoji: '🧠', volgorde: 10 },
    { slug: 'ouderdom', naam: 'Ouderdom / Kwetsbaarheid', emoji: '👴', volgorde: 11 },
    { slug: 'terminaal', naam: 'Terminale fase / Palliatief', emoji: '🕊️', volgorde: 12 },
  ]

  const situatieTags = [
    { slug: 'jong', naam: 'Jonge mantelzorger (< 25)', emoji: '🎓', volgorde: 1 },
    { slug: 'werkend', naam: 'Werkende mantelzorger', emoji: '💼', volgorde: 2 },
    { slug: 'werkend-parttime', naam: 'Parttime werkend', emoji: '🕐', volgorde: 3 },
    { slug: 'student', naam: 'Studerende mantelzorger', emoji: '🎓', volgorde: 4 },
    { slug: 'gepensioneerd', naam: 'Gepensioneerde mantelzorger', emoji: '👴', volgorde: 5 },
    { slug: 'samenwonend', naam: 'Samenwonend met naaste', emoji: '🏠', volgorde: 6 },
    { slug: 'dichtbij', naam: 'Naaste woont dichtbij', emoji: '📍', volgorde: 7 },
    { slug: 'op-afstand', naam: 'Mantelzorg op afstand', emoji: '🚗', volgorde: 8 },
    { slug: 'met-kinderen', naam: 'Mantelzorg naast eigen kinderen', emoji: '👨‍👩‍👧', volgorde: 9 },
    { slug: 'beginnend', naam: 'Net begonnen (< 1 jaar)', emoji: '🌱', volgorde: 10 },
    { slug: 'langdurig', naam: 'Al jaren bezig (> 5 jaar)', emoji: '⏳', volgorde: 11 },
    { slug: 'intensief', naam: 'Intensieve zorg (20+ uur/week)', emoji: '⏰', volgorde: 12 },
    { slug: 'partner-zorg', naam: 'Partnerzorg', emoji: '💑', volgorde: 13 },
    { slug: 'ouder-zorg', naam: 'Kind zorgt voor ouder', emoji: '👵', volgorde: 14 },
    { slug: 'kind-zorg', naam: 'Ouder zorgt voor kind', emoji: '👧', volgorde: 15 },
    { slug: 'meerdere-zorgvragers', naam: 'Meerdere naasten', emoji: '👥', volgorde: 16 },
    { slug: 'alleenstaand', naam: 'Alleenstaande mantelzorger', emoji: '🏚️', volgorde: 17 },
    { slug: 'rouwverwerking', naam: 'Na het overlijden', emoji: '🕊️', volgorde: 18 },
  ]

  for (const tag of aandoeningTags) {
    await prisma.contentTag.upsert({
      where: { slug: tag.slug },
      update: { naam: tag.naam, emoji: tag.emoji, volgorde: tag.volgorde },
      create: {
        type: 'AANDOENING',
        slug: tag.slug,
        naam: tag.naam,
        emoji: tag.emoji,
        volgorde: tag.volgorde,
        isActief: true,
      },
    })
  }
  console.log(`  ✓ ${aandoeningTags.length} aandoening-tags aangemaakt/bijgewerkt`)

  for (const tag of situatieTags) {
    await prisma.contentTag.upsert({
      where: { slug: tag.slug },
      update: { naam: tag.naam, emoji: tag.emoji, volgorde: tag.volgorde },
      create: {
        type: 'SITUATIE',
        slug: tag.slug,
        naam: tag.naam,
        emoji: tag.emoji,
        volgorde: tag.volgorde,
        isActief: true,
      },
    })
  }
  console.log(`  ✓ ${situatieTags.length} situatie-tags aangemaakt/bijgewerkt`)

  // ONDERWERP-tags (voor artikel-tagging, niet door gebruiker gekozen)
  const onderwerpTags = [
    { slug: 'financien', naam: 'Financiën & vergoedingen', emoji: '💰', volgorde: 1 },
    { slug: 'wmo-aanvragen', naam: 'Wmo aanvragen', emoji: '📋', volgorde: 2 },
    { slug: 'pgb', naam: 'Persoonsgebonden budget', emoji: '💳', volgorde: 3, synoniemen: ['PGB', 'persoonsgebonden budget'] },
    { slug: 'medicatie', naam: 'Medicatie & medicijnbeheer', emoji: '💊', volgorde: 4 },
    { slug: 'nachtrust', naam: 'Slaap & nachtrust', emoji: '😴', volgorde: 5 },
    { slug: 'voeding', naam: 'Voeding & maaltijden', emoji: '🍽️', volgorde: 6 },
    { slug: 'veiligheid-thuis', naam: 'Veiligheid in huis', emoji: '🏠', volgorde: 7 },
    { slug: 'dagbesteding', naam: 'Dagbesteding', emoji: '🎨', volgorde: 8 },
    { slug: 'vervoer', naam: 'Vervoer & mobiliteit', emoji: '🚗', volgorde: 9 },
    { slug: 'respijtzorg', naam: 'Respijtzorg', emoji: '🌿', volgorde: 10, synoniemen: ['respijt', 'vervangende zorg', 'logeervoorziening'] },
    { slug: 'werk-zorg-balans', naam: 'Werk-zorgbalans', emoji: '⚖️', volgorde: 11 },
    { slug: 'emotionele-steun', naam: 'Emotionele steun', emoji: '💚', volgorde: 12 },
  ]

  for (const tag of onderwerpTags) {
    await prisma.contentTag.upsert({
      where: { slug: tag.slug },
      update: { naam: tag.naam, emoji: tag.emoji, volgorde: tag.volgorde, synoniemen: (tag as any).synoniemen || [] },
      create: {
        type: 'ONDERWERP',
        slug: tag.slug,
        naam: tag.naam,
        emoji: tag.emoji,
        volgorde: tag.volgorde,
        synoniemen: (tag as any).synoniemen || [],
        isActief: true,
      },
    })
  }
  console.log(`  ✓ ${onderwerpTags.length} onderwerp-tags aangemaakt/bijgewerkt`)

  console.log('\n=== Content Herstructurering voltooid! ===')
}

main()
  .catch((e) => {
    console.error('Fout bij content herstructurering:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
