import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Content Herstructurering v2 — Tag-herstructurering ===')
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
  // 4. ZORGTHEMA TAGS (was: AANDOENING — nu 6 overkoepelende thema's)
  // ============================================
  console.log('\n4. Zorgthema-tags seeden (vervangt 12 aandoening-tags)...')

  const zorgthemaTags = [
    { slug: 'geheugen-cognitie', naam: 'Geheugen & denken', emoji: '🧠', volgorde: 1, beschrijving: 'Dementie, NAH, cognitieve achteruitgang bij ouderdom' },
    { slug: 'lichamelijk', naam: 'Lichamelijke zorg', emoji: '💪', volgorde: 2, beschrijving: 'Hartfalen, COPD, CVA, diabetes, lichamelijke beperking, revalidatie' },
    { slug: 'psychisch-emotioneel', naam: 'Psychisch & emotioneel', emoji: '💚', volgorde: 3, beschrijving: 'Psychische aandoeningen, depressie, angst, verslaving' },
    { slug: 'beperking-begeleiding', naam: 'Beperking & begeleiding', emoji: '🧩', volgorde: 4, beschrijving: 'Verstandelijke beperking, autisme, ontwikkelingsstoornis' },
    { slug: 'ouder-worden', naam: 'Ouder worden', emoji: '👴', volgorde: 5, beschrijving: 'Algemene ouderdomsklachten, kwetsbaarheid, vallen, eenzaamheid' },
    { slug: 'ernstig-ziek', naam: 'Ernstig of langdurig ziek', emoji: '🕊️', volgorde: 6, beschrijving: 'Kanker, terminale fase, palliatief, chronisch ernstig ziek' },
  ]

  for (const tag of zorgthemaTags) {
    await prisma.contentTag.upsert({
      where: { slug: tag.slug },
      update: { naam: tag.naam, emoji: tag.emoji, volgorde: tag.volgorde, beschrijving: tag.beschrijving, groep: 'zorgthema' },
      create: {
        type: 'ZORGTHEMA',
        slug: tag.slug,
        naam: tag.naam,
        emoji: tag.emoji,
        beschrijving: tag.beschrijving,
        groep: 'zorgthema',
        volgorde: tag.volgorde,
        isActief: true,
      },
    })
    console.log(`  ✓ ${tag.emoji} ${tag.naam} (${tag.slug})`)
  }

  // Oude aandoening-tags deactiveren (niet verwijderen vanwege FK constraints)
  // Inclusief tags uit supabase-migration.sql die niet in het oorspronkelijke seed-script zaten
  const oudeAandoeningen = [
    'dementie', 'kanker', 'cva-beroerte', 'hartfalen', 'copd', 'diabetes',
    'psychisch', 'verstandelijke-beperking', 'lichamelijke-beperking',
    'nah', 'ouderdom', 'terminaal',
    // Extra tags uit supabase-migration.sql
    'hart-vaatziekten', 'niet-aangeboren-hersenletsel', 'copd-longziekten',
    'parkinson', 'ms', 'ouderdom-kwetsbaarheid',
    // Eventuele varianten
    'als', 'chronisch-ziek', 'hart-en-vaatziekten',
  ]
  for (const slug of oudeAandoeningen) {
    await prisma.contentTag.updateMany({
      where: { slug },
      data: { isActief: false },
    })
  }
  console.log(`  ✗ ${oudeAandoeningen.length} oude aandoening-tags gedeactiveerd`)

  // Veiligheidsnet: deactiveer ALLE zorgthema-tags die niet in de whitelist staan
  const gewensteZorgthemas = zorgthemaTags.map((t) => t.slug)
  const extraActief = await prisma.contentTag.updateMany({
    where: {
      type: 'ZORGTHEMA',
      isActief: true,
      slug: { notIn: gewensteZorgthemas },
    },
    data: { isActief: false },
  })
  if (extraActief.count > 0) {
    console.log(`  ✗ ${extraActief.count} extra zorgthema-tags gedeactiveerd (niet in whitelist)`)
  }

  // ============================================
  // 5. SITUATIE TAGS (geschoond: 18 → 14 actief, gegroepeerd)
  // ============================================
  console.log('\n5. Situatie-tags seeden (gegroepeerd)...')

  const situatieTags = [
    // Groep: relatie (B1)
    { slug: 'partner-zorg', naam: 'Zorgt voor partner', emoji: '💑', groep: 'relatie', volgorde: 1 },
    { slug: 'ouder-zorg', naam: 'Zorgt voor ouder(s)', emoji: '👵', groep: 'relatie', volgorde: 2 },
    { slug: 'kind-zorg', naam: 'Zorgt voor kind', emoji: '👧', groep: 'relatie', volgorde: 3 },
    { slug: 'netwerk-zorg', naam: 'Zorgt voor iemand anders', emoji: '🤝', groep: 'relatie', volgorde: 4 },
    // Groep: weekinvulling (B2)
    { slug: 'werkend', naam: 'Werkt (fulltime of parttime)', emoji: '💼', groep: 'weekinvulling', volgorde: 1 },
    { slug: 'student', naam: 'Studeert', emoji: '🎓', groep: 'weekinvulling', volgorde: 2 },
    { slug: 'gepensioneerd', naam: 'Met pensioen', emoji: '👴', groep: 'weekinvulling', volgorde: 3 },
    { slug: 'fulltime-zorger', naam: 'Zorgt fulltime / werkt niet', emoji: '🏠', groep: 'weekinvulling', volgorde: 4 },
    // Groep: wonen (B3)
    { slug: 'samenwonend', naam: 'Woont samen met naaste', emoji: '🏠', groep: 'wonen', volgorde: 1 },
    { slug: 'dichtbij', naam: 'Naaste woont dichtbij', emoji: '📍', groep: 'wonen', volgorde: 2 },
    { slug: 'op-afstand', naam: 'Zorgt op afstand', emoji: '🚗', groep: 'wonen', volgorde: 3 },
    // Groep: zorgduur (B4)
    { slug: 'beginnend', naam: 'Kort (minder dan 1 jaar)', emoji: '🌱', groep: 'zorgduur', volgorde: 1 },
    { slug: 'ervaren', naam: 'Een paar jaar (1-5 jaar)', emoji: '📅', groep: 'zorgduur', volgorde: 2 },
    { slug: 'langdurig', naam: 'Al lang (meer dan 5 jaar)', emoji: '⏳', groep: 'zorgduur', volgorde: 3 },
    // Groep: extra (B5 — wat speelt er nog meer?)
    { slug: 'met-kinderen', naam: 'Ik heb een gezin met kinderen', emoji: '👨‍👩‍👧', groep: 'extra', volgorde: 1 },
    { slug: 'alleenstaand-met-kinderen', naam: 'Ik ben alleenstaand met kinderen', emoji: '👩‍👧‍👦', groep: 'extra', volgorde: 2 },
    { slug: 'meerdere-naasten', naam: 'Ik zorg voor meerdere mensen', emoji: '👥', groep: 'extra', volgorde: 3 },
    { slug: 'alleenstaand', naam: 'Ik doe het alleen (geen hulp van anderen)', emoji: '🙋', groep: 'extra', volgorde: 4 },
    { slug: 'mantelzorg-en-jong', naam: 'Ik ben een jonge mantelzorger (onder 25)', emoji: '🧑', groep: 'extra', volgorde: 5 },
    { slug: 'eigen-gezondheid', naam: 'Ik heb zelf ook gezondheidsklachten', emoji: '💊', groep: 'extra', volgorde: 6 },
  ]

  for (const tag of situatieTags) {
    await prisma.contentTag.upsert({
      where: { slug: tag.slug },
      update: { naam: tag.naam, emoji: tag.emoji, volgorde: tag.volgorde, groep: tag.groep },
      create: {
        type: 'SITUATIE',
        slug: tag.slug,
        naam: tag.naam,
        emoji: tag.emoji,
        groep: tag.groep,
        volgorde: tag.volgorde,
        isActief: true,
      },
    })
  }
  console.log(`  ✓ ${situatieTags.length} situatie-tags aangemaakt/bijgewerkt (gegroepeerd)`)

  // Oude situatie-tags deactiveren (inclusief rouw — verwijderd uit UI)
  const oudeSituaties = ['jong', 'intensief', 'werkend-parttime', 'meerdere-zorgvragers', 'rouwverwerking', 'rouw']
  for (const slug of oudeSituaties) {
    await prisma.contentTag.updateMany({
      where: { slug },
      data: { isActief: false },
    })
  }
  console.log(`  ✗ ${oudeSituaties.length} oude situatie-tags gedeactiveerd`)

  // ============================================
  // 6. ONDERWERP TAGS (vernieuwd: meer overkoepelend)
  // ============================================
  console.log('\n6. Onderwerp-tags seeden (vernieuwd)...')

  const onderwerpTags = [
    { slug: 'financien-regelingen', naam: 'Financiën & regelingen', emoji: '💰', volgorde: 1 },
    { slug: 'wmo-wlz-zvw', naam: 'Wmo, Wlz & zorgverzekering', emoji: '📋', volgorde: 2 },
    { slug: 'pgb', naam: 'PGB', emoji: '💳', volgorde: 3, synoniemen: ['PGB', 'persoonsgebonden budget'] },
    { slug: 'medicatie-behandeling', naam: 'Medicatie & behandeling', emoji: '💊', volgorde: 4 },
    { slug: 'dagelijks-zorgen', naam: 'Dagelijks zorgen', emoji: '🏠', volgorde: 5 },
    { slug: 'zelfzorg-balans', naam: 'Zelfzorg & balans', emoji: '💆', volgorde: 6 },
    { slug: 'respijtzorg', naam: 'Respijtzorg & vervanging', emoji: '🌿', volgorde: 7, synoniemen: ['respijt', 'vervangende zorg', 'logeervoorziening'] },
    { slug: 'werk-zorg', naam: 'Werk & zorg combineren', emoji: '⚖️', volgorde: 8 },
    { slug: 'hulpmiddelen', naam: 'Hulpmiddelen & technologie', emoji: '🔧', volgorde: 9 },
    { slug: 'emotioneel', naam: 'Emotioneel & mentaal', emoji: '💚', volgorde: 10 },
    { slug: 'netwerk-hulp', naam: 'Netwerk & hulp organiseren', emoji: '🤝', volgorde: 11 },
    { slug: 'veiligheid', naam: 'Veiligheid thuis', emoji: '🏡', volgorde: 12 },
  ]

  for (const tag of onderwerpTags) {
    await prisma.contentTag.upsert({
      where: { slug: tag.slug },
      update: {
        naam: tag.naam,
        emoji: tag.emoji,
        volgorde: tag.volgorde,
        groep: 'onderwerp',
        synoniemen: (tag as any).synoniemen || [],
      },
      create: {
        type: 'ONDERWERP',
        slug: tag.slug,
        naam: tag.naam,
        emoji: tag.emoji,
        groep: 'onderwerp',
        volgorde: tag.volgorde,
        synoniemen: (tag as any).synoniemen || [],
        isActief: true,
      },
    })
  }
  console.log(`  ✓ ${onderwerpTags.length} onderwerp-tags aangemaakt/bijgewerkt`)

  // Oude onderwerp-tags deactiveren (vervangen door nieuwe slugs)
  const oudeOnderwerpen = ['financien', 'wmo-aanvragen', 'medicatie', 'nachtrust', 'voeding',
    'veiligheid-thuis', 'dagbesteding', 'vervoer', 'werk-zorg-balans', 'emotionele-steun']
  for (const slug of oudeOnderwerpen) {
    await prisma.contentTag.updateMany({
      where: { slug },
      data: { isActief: false },
    })
  }
  console.log(`  ✗ ${oudeOnderwerpen.length} oude onderwerp-tags gedeactiveerd`)

  // ============================================
  // 7. SAMENVATTING
  // ============================================
  const actieveTags = await prisma.contentTag.count({ where: { isActief: true } })
  const inactieveTags = await prisma.contentTag.count({ where: { isActief: false } })

  console.log('\n=== Content Herstructurering v2 voltooid! ===')
  console.log(`  Actieve tags: ${actieveTags}`)
  console.log(`  Gedeactiveerde tags: ${inactieveTags}`)
  console.log('\nVolgende stap: draai seed-artikel-tags.ts om artikelen te taggen met de nieuwe structuur')
}

main()
  .catch((e) => {
    console.error('Fout bij content herstructurering:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
