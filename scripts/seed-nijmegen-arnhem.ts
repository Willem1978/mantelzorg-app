/**
 * Seed script voor zorgorganisaties in Nijmegen en Arnhem
 * Gebaseerd op "Ondersteuning in beeld" structuur
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
  gemeente: string
  onderdeelTest?: string
  soortHulp?: string
  dienst?: string
  doelgroep?: string
  kosten?: string
  zichtbaarBijLaag?: boolean
  zichtbaarBijGemiddeld?: boolean
  zichtbaarBijHoog?: boolean
}

// Nijmegen organisaties
const nijmegenOrganisaties: ZorgorganisatieData[] = [
  // Mantelzorgondersteuning
  {
    naam: 'Mantelzorg Nijmegen',
    beschrijving: 'Het eerste aanspreekpunt voor mantelzorgers. Tips, advies, steun en een luisterend oor. Speciale aandacht voor jonge, werkende en migranten mantelzorgers.',
    type: 'MANTELZORGSTEUNPUNT',
    telefoon: '024 254 157 12',
    email: 'Mantelzorg@sterker.nl',
    website: 'https://mantelzorg-nijmegen.nl',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Mantelzorg Nijmegen - Emotionele steun',
    beschrijving: 'Gespreksgroepen, wandelingen en bijeenkomsten waar je andere mantelzorgers ontmoet en ervaringen deelt.',
    type: 'MANTELZORGSTEUNPUNT',
    telefoon: '024 254 157 12',
    email: 'Mantelzorg@sterker.nl',
    website: 'https://mantelzorg-nijmegen.nl/mantelzorgers/',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Emotionele steun',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Mantelzorg Nijmegen - Cursussen',
    beschrijving: 'Cursussen en trainingen voor mantelzorgers over omgaan met zorg, grenzen stellen en zelfzorg.',
    type: 'MANTELZORGSTEUNPUNT',
    telefoon: '024 254 157 12',
    email: 'Mantelzorg@sterker.nl',
    website: 'https://mantelzorg-nijmegen.nl/mantelzorgers/',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Educatie',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'ZZG Zorggroep - Mantelzorg',
    beschrijving: 'Informatie en hulp bij mantelzorg. Ondersteuning voor wie zorgt voor partner, ouder, buur of vriend.',
    type: 'THUISZORG',
    website: 'https://www.zzgzorggroep.nl/mantelzorg/',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle mantelzorgers',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'ZorgMies Nijmegen',
    beschrijving: 'Hulp bij boodschappen, maaltijden, licht huishoudelijk werk en persoonlijke verzorging. Ontlast mantelzorgers.',
    type: 'THUISZORG',
    website: 'https://zorgmies.nl/zorgmies-nijmegen/',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Vervangende mantelzorg',
    doelgroep: 'Mantelzorgers die ontlasting nodig hebben',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'VraagHulp Nijmegen',
    beschrijving: 'Onafhankelijk informatiepunt voor mantelzorgers met vragen over zorg en ondersteuning.',
    type: 'GEMEENTE',
    website: 'https://www.vraaghulpnijmegen.nl/wie-helpt/ik-ben-mantelzorger-en-heb-een-vraag/',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Gemeente Nijmegen - Mantelzorgcompliment',
    beschrijving: 'Waardering voor mantelzorgers in de vorm van een jaarlijks compliment van de gemeente.',
    type: 'GEMEENTE',
    website: 'https://www.nijmegen.nl/diensten/zorg-en-hulp/mantelzorgcompliment/',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Financiele regelingen',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Gemeente Nijmegen - Hulp huishouden mantelzorgers',
    beschrijving: 'Tijdelijke huishoudelijke hulp voor mantelzorgers die overbelast zijn.',
    type: 'GEMEENTE',
    website: 'https://www.nijmegen.nl/diensten/zorg-en-hulp/hulp-huishouden-mantelzorgers/',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Huishoudelijke taken',
    soortHulp: 'Praktische hulp',
    doelgroep: 'Overbelaste mantelzorgers',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: false,
    zichtbaarBijHoog: true,
  },
  // Hulp bij taken
  {
    naam: 'Sterker Sociaal Werk Nijmegen',
    beschrijving: 'Breed sociaal werk met ondersteuning voor mantelzorgers bij diverse zorgtaken en hulpvragen.',
    type: 'SOCIAAL_WIJKTEAM',
    website: 'https://www.sterker.nl/diensten/mantelzorg',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Administratie en aanvragen',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle inwoners',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Buurtteams Nijmegen',
    beschrijving: 'Eerste aanspreekpunt voor hulpvragen. Onderzoekt welke hulp nodig is en verwijst door.',
    type: 'SOCIAAL_WIJKTEAM',
    website: 'https://www.nijmegen.nl',
    gemeente: 'Nijmegen',
    onderdeelTest: 'Plannen en organiseren',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle inwoners',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
]

// Arnhem organisaties
const arnhemOrganisaties: ZorgorganisatieData[] = [
  // Mantelzorgondersteuning
  {
    naam: 'MVT Arnhem - Mantelzorg en Vrijwillige Thuishulp',
    beschrijving: 'Ondersteuning voor alle mantelzorgers in Arnhem. Info, advies, luisterend oor, zorgadvies en vrijwillige hulp.',
    type: 'MANTELZORGSTEUNPUNT',
    website: 'https://www.mvtarnhem.nl/',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle mantelzorgers in Arnhem',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'MVT Arnhem - Emotionele ondersteuning',
    beschrijving: 'Luisterend oor, gespreksgroepen en activiteiten voor mantelzorgers die behoefte hebben aan steun.',
    type: 'MANTELZORGSTEUNPUNT',
    website: 'https://www.mvtarnhem.nl/',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Emotionele steun',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'MVT Arnhem - Training en voorlichting',
    beschrijving: 'Trainingen en workshops voor mantelzorgers over zelfzorg en omgaan met zorgsituaties.',
    type: 'MANTELZORGSTEUNPUNT',
    website: 'https://www.mvtarnhem.nl/',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Educatie',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'MVT Arnhem - Jonge mantelzorgers',
    beschrijving: 'Speciale ondersteuning voor jongeren die opgroeien met zorg voor een naaste.',
    type: 'MANTELZORGSTEUNPUNT',
    website: 'https://www.mvtarnhem.nl/',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Emotionele steun',
    doelgroep: 'Jonge mantelzorgers tot 24 jaar',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'MVT Arnhem - Werkende mantelzorgers',
    beschrijving: 'Ondersteuning voor mantelzorgers die werk en zorg combineren.',
    type: 'MANTELZORGSTEUNPUNT',
    website: 'https://www.mvtarnhem.nl/',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Werkende mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'MVT Arnhem - Mantelzorg & Andere cultuur',
    beschrijving: 'Ondersteuning voor mantelzorgers met een migratie-achtergrond.',
    type: 'MANTELZORGSTEUNPUNT',
    website: 'https://www.mvtarnhem.nl/mantelzorg-en-cultuur',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Emotionele steun',
    doelgroep: 'Mantelzorgers met migratie-achtergrond',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'MVT Arnhem - Dementie mantelzorgers',
    beschrijving: 'Speciale ondersteuning voor mantelzorgers die zorgen voor iemand met dementie.',
    type: 'MANTELZORGSTEUNPUNT',
    website: 'https://www.mvtarnhem.nl/',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Emotionele steun',
    doelgroep: 'Mantelzorgers van mensen met dementie',
    kosten: 'Gratis',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Gemeente Arnhem - Mantelzorgcompliment',
    beschrijving: 'Waardering voor mantelzorgers via het mantelzorgcompliment. Aanvragen van 1 april t/m 31 december.',
    type: 'GEMEENTE',
    website: 'https://www.mvtarnhem.nl/mantelzorgcompliment',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Financiele regelingen',
    doelgroep: 'Alle mantelzorgers in Arnhem',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Adviespunt Zorgbelang Arnhem',
    beschrijving: 'Gratis onafhankelijke clientondersteuning. Hulp bij het vinden van passende zorg en ondersteuning.',
    type: 'OVERIG',
    website: 'https://www.mvtarnhem.nl/organisaties-in-arnhem/onafhankelijke-client-ondersteuning',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle inwoners van Arnhem',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Sociale Wijkteams Arnhem',
    beschrijving: 'Eerste aanspreekpunt voor hulp en ondersteuning in de wijk. Advies, begeleiding en doorverwijzing.',
    type: 'SOCIAAL_WIJKTEAM',
    website: 'https://www.arnhem.nl/alle-onderwerpen/zorg-en-welzijn/mantelzorgers-en-vrijwilligers/',
    gemeente: 'Arnhem',
    onderdeelTest: 'Plannen en organiseren',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle inwoners',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  // Hulp bij taken
  {
    naam: 'MVT Arnhem - Vrijwillige Thuishulp',
    beschrijving: 'Vrijwilligers helpen met tuinonderhoud en klusjes in huis. Ook voor mantelzorgers die tijd tekort komen.',
    type: 'VRIJWILLIGERS',
    website: 'https://www.mvtarnhem.nl/',
    gemeente: 'Arnhem',
    onderdeelTest: 'Klusjes in en om het huis',
    soortHulp: 'Praktische hulp',
    doelgroep: 'Mantelzorgers en zorgvragers',
    kosten: 'Gratis',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Bijzonder in Arnhem - Mantelzorg',
    beschrijving: 'Overzicht van alle mantelzorg ondersteuning in Arnhem. Vindt hulp die bij jouw situatie past.',
    type: 'OVERIG',
    website: 'https://www.bijzonderinarnhem.nl/mantelzorg',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Arnhem Doet - Mantelzorg platform',
    beschrijving: 'Platform met informatie over mantelzorg ondersteuning in Arnhem.',
    type: 'OVERIG',
    website: 'https://arnhemdoet.nl/thema-s/mantelzorg/',
    gemeente: 'Arnhem',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
]

async function seedNijmegenArnhem() {
  console.log('Seeding Nijmegen en Arnhem zorgorganisaties...\n')

  const allOrganisaties = [...nijmegenOrganisaties, ...arnhemOrganisaties]
  let created = 0
  let updated = 0
  let errors = 0

  for (const org of allOrganisaties) {
    try {
      // Check of organisatie al bestaat (op basis van naam en gemeente)
      const existing = await prisma.zorgorganisatie.findFirst({
        where: {
          naam: org.naam,
          gemeente: org.gemeente,
        },
      })

      if (existing) {
        // Update bestaande
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
        // Maak nieuwe aan
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

  // Toon statistieken per gemeente
  const statsNijmegen = await prisma.zorgorganisatie.count({
    where: { gemeente: 'Nijmegen', isActief: true },
  })
  const statsArnhem = await prisma.zorgorganisatie.count({
    where: { gemeente: 'Arnhem', isActief: true },
  })

  console.log('\nPer gemeente:')
  console.log(`   Nijmegen: ${statsNijmegen} organisaties`)
  console.log(`   Arnhem: ${statsArnhem} organisaties`)
  console.log('='.repeat(50))

  await prisma.$disconnect()
}

// Run seed
seedNijmegenArnhem()
  .then(() => {
    console.log('\nSeed voltooid!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nSeed gefaald:', error)
    process.exit(1)
  })
