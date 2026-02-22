/**
 * Seed script voor landelijke zorgorganisaties
 *
 * Nijmegen en Arnhem organisaties zijn verwijderd per februari 2026.
 * Zutphen data staat in scripts/update-zutphen-hulpbronnen.ts
 *
 * Dit script bevat alleen nog de landelijke hulpbronnen (gemeente: null).
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ZorgorganisatieData {
  naam: string
  beschrijving?: string
  type: 'GEMEENTE' | 'THUISZORG' | 'MANTELZORGSTEUNPUNT' | 'RESPIJTZORG' | 'DAGBESTEDING' | 'HUISARTS' | 'SOCIAAL_WIJKTEAM' | 'VRIJWILLIGERS' | 'OVERIG' | 'LANDELIJK'
  telefoon?: string
  email?: string
  website?: string
  gemeente: string | null
  onderdeelTest?: string
  soortHulp?: string
  dienst?: string
  doelgroep?: string
  kosten?: string
  zichtbaarBijLaag?: boolean
  zichtbaarBijGemiddeld?: boolean
  zichtbaarBijHoog?: boolean
}

// Landelijke hulpbronnen (gemeente: null)
const landelijkeOrganisaties: ZorgorganisatieData[] = [
  // === Hulplijnen: direct bellen voor steun of advies ===
  {
    naam: 'Mantelzorglijn',
    beschrijving: 'Gratis hulplijn voor alle vragen over mantelzorg. Bel, WhatsApp of mail. Bereikbaar op werkdagen 9-17 uur.',
    type: 'LANDELIJK',
    telefoon: '030 760 60 55',
    website: 'https://www.mantelzorg.nl/onderwerpen/ondersteuning/waar-kun-je-terecht/mantelzorglijn',
    gemeente: null,
    soortHulp: 'Hulplijn',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Luisterlijn',
    beschrijving: 'Anoniem praten over wat je dwars zit. 24 uur per dag, 7 dagen per week bereikbaar.',
    type: 'LANDELIJK',
    telefoon: '0900 0767',
    website: 'https://www.deluisterlijn.nl/',
    gemeente: null,
    soortHulp: 'Hulplijn',
    doelgroep: 'Iedereen',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Alzheimer Telefoon',
    beschrijving: 'Vragen over dementie? Bel de Alzheimer Telefoon voor informatie, advies en een luisterend oor.',
    type: 'LANDELIJK',
    telefoon: '0800 5088',
    website: 'https://www.alzheimer-nederland.nl/',
    gemeente: null,
    soortHulp: 'Hulplijn',
    doelgroep: 'Mantelzorgers van mensen met dementie',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Zilverlijn',
    beschrijving: 'Bel voor een praatje als je je alleen voelt. Een luisterend oor voor ouderen.',
    type: 'LANDELIJK',
    telefoon: '0900 265 65 65',
    website: 'https://www.ouderenfonds.nl/zilverlijn/',
    gemeente: null,
    soortHulp: 'Hulplijn',
    doelgroep: 'Ouderen die eenzaam zijn',
    kosten: 'Lokaal tarief',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Sensoor - Telefonische hulpdienst',
    beschrijving: 'Dag en nacht bereikbaar voor een vertrouwelijk gesprek. Getrainde vrijwilligers luisteren.',
    type: 'LANDELIJK',
    telefoon: '0900 0101',
    website: 'https://www.sensoor.nl/',
    gemeente: null,
    soortHulp: 'Hulplijn',
    doelgroep: 'Iedereen',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  // === Overheid & financieel: loketten en wegwijzers ===
  {
    naam: 'Regelhulp.nl',
    beschrijving: 'Overzicht van hulp en ondersteuning bij ziekte, handicap of ouderdom. Beantwoord vragen en krijg persoonlijk advies.',
    type: 'LANDELIJK',
    website: 'https://www.regelhulp.nl/',
    gemeente: null,
    soortHulp: 'Overheid en financieel',
    doelgroep: 'Zorgvragers en mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Het CAK',
    beschrijving: 'Informatie over eigen bijdrage voor Wmo en Wlz. Bereken je eigen bijdrage online.',
    type: 'LANDELIJK',
    telefoon: '0800 1925',
    website: 'https://www.hetcak.nl/',
    gemeente: null,
    soortHulp: 'Overheid en financieel',
    doelgroep: 'Mensen met Wmo of Wlz-zorg',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'SVB (Sociale Verzekeringsbank)',
    beschrijving: 'Beheert het persoonsgebonden budget (PGB). Uitbetaling en administratie van PGB.',
    type: 'LANDELIJK',
    telefoon: '030 264 82 00',
    website: 'https://www.svb.nl/nl/pgb',
    gemeente: null,
    soortHulp: 'Overheid en financieel',
    doelgroep: 'PGB-houders',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Zorginstituut Nederland',
    beschrijving: 'Wat zit er in het basispakket van de zorgverzekering? En wat valt onder de Wlz? Hier vind je het antwoord.',
    type: 'LANDELIJK',
    website: 'https://www.zorginstituutnederland.nl/',
    gemeente: null,
    soortHulp: 'Overheid en financieel',
    doelgroep: 'Zorgvragers en mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  // === Belangenorganisaties: steun, informatie en belangenbehartiging ===
  {
    naam: 'MantelzorgNL',
    beschrijving: 'De landelijke vereniging voor mantelzorgers. Informatie, tips, cursussen en lotgenotencontact.',
    type: 'LANDELIJK',
    website: 'https://www.mantelzorg.nl/',
    gemeente: null,
    soortHulp: 'Belangenorganisatie',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Mezzo - Landelijke vereniging mantelzorgers',
    beschrijving: 'Informatie en belangenbehartiging voor mantelzorgers en vrijwilligerszorg.',
    type: 'LANDELIJK',
    website: 'https://www.mezzo.nl/',
    gemeente: null,
    soortHulp: 'Belangenorganisatie',
    doelgroep: 'Mantelzorgers en vrijwilligers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Per Saldo - PGB-belangenvereniging',
    beschrijving: 'Alles over het persoonsgebonden budget. Hulp bij aanvragen, beheren en verantwoorden van PGB.',
    type: 'LANDELIJK',
    telefoon: '030 230 05 45',
    website: 'https://www.pgb.nl/',
    gemeente: null,
    soortHulp: 'Belangenorganisatie',
    doelgroep: 'PGB-houders en mantelzorgers',
    kosten: 'Gratis voor leden',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
]

async function seedLandelijk() {
  console.log('Seeding landelijke zorgorganisaties...\n')

  let created = 0
  let updated = 0
  let errors = 0

  for (const org of landelijkeOrganisaties) {
    try {
      const existing = await prisma.zorgorganisatie.findFirst({
        where: {
          naam: org.naam,
          gemeente: org.gemeente,
        },
      })

      if (existing) {
        await prisma.zorgorganisatie.update({
          where: { id: existing.id },
          data: {
            beschrijving: org.beschrijving,
            type: org.type,
            telefoon: org.telefoon,
            email: org.email,
            website: org.website,
            onderdeelTest: org.onderdeelTest,
            soortHulp: org.soortHulp,
            dienst: org.dienst,
            doelgroep: org.doelgroep,
            kosten: org.kosten,
            zichtbaarBijLaag: org.zichtbaarBijLaag ?? false,
            zichtbaarBijGemiddeld: org.zichtbaarBijGemiddeld ?? false,
            zichtbaarBijHoog: org.zichtbaarBijHoog ?? true,
            isActief: true,
          },
        })
        console.log(`   Updated: ${org.naam}`)
        updated++
      } else {
        await prisma.zorgorganisatie.create({
          data: {
            naam: org.naam,
            beschrijving: org.beschrijving,
            type: org.type,
            telefoon: org.telefoon,
            email: org.email,
            website: org.website,
            gemeente: org.gemeente,
            onderdeelTest: org.onderdeelTest,
            soortHulp: org.soortHulp,
            dienst: org.dienst,
            doelgroep: org.doelgroep,
            kosten: org.kosten,
            zichtbaarBijLaag: org.zichtbaarBijLaag ?? false,
            zichtbaarBijGemiddeld: org.zichtbaarBijGemiddeld ?? false,
            zichtbaarBijHoog: org.zichtbaarBijHoog ?? true,
            isActief: true,
          },
        })
        console.log(`   Created: ${org.naam}`)
        created++
      }
    } catch (error) {
      console.error(`   Error: ${org.naam}`, error)
      errors++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('SAMENVATTING:')
  console.log(`   Nieuw: ${created}`)
  console.log(`   Bijgewerkt: ${updated}`)
  console.log(`   Fouten: ${errors}`)

  const statsLandelijk = await prisma.zorgorganisatie.count({
    where: { gemeente: null, isActief: true },
  })
  const statsZutphen = await prisma.zorgorganisatie.count({
    where: { gemeente: 'Zutphen', isActief: true },
  })

  console.log('\nPer gemeente:')
  console.log(`   Zutphen: ${statsZutphen} organisaties`)
  console.log(`   Landelijk: ${statsLandelijk} organisaties`)
  console.log('='.repeat(50))

  await prisma.$disconnect()
}

// Run seed
seedLandelijk()
  .then(() => {
    console.log('\nSeed voltooid!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nSeed gefaald:', error)
    process.exit(1)
  })
