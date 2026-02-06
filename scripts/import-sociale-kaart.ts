/**
 * Import script voor Sociale Kaart Excel bestand
 * Importeert hulporganisaties naar de Zorgorganisatie tabel
 * Verwerkt ALLE tabbladen en koppelt aan zorgtaken
 */

import * as XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping van tabblad naam naar zorgtaak ID (uit whatsapp-session.ts)
const TABBLAD_NAAR_ZORGTAAK: Record<string, string[]> = {
  'Overbelasting mantelzorger': [], // Algemene overbelasting - geen specifieke taak
  'T - Financiële administratie': ['t5'], // Administratie
  'T - Regelen en afspraken mak': ['t5'], // Administratie
  'T - Boodschappen': ['t2'], // Huishouden
  'T - Bezoek en uitjes': ['t6'], // Emotionele steun
  'T - Brengen Halen Begeleiden': ['t4'], // Vervoer
  'T - Persoonlijke verzorging': ['t1'], // Persoonlijke verzorging
  'T - Eten maken': ['t2'], // Huishouden
  'T - Huishouden': ['t2'], // Huishouden
  'T - Klusjes': ['t2'], // Huishouden
}

// Mapping van "Soort hulp" naar ZorgorganisatieType
function mapSoortHulpToType(soortHulp: string): string {
  const mapping: Record<string, string> = {
    'Informatie en advies': 'MANTELZORGSTEUNPUNT',
    'Emotionele steun': 'MANTELZORGSTEUNPUNT',
    'Persoonlijke begeleiding': 'THUISZORG',
    'Praktische hulp': 'GEMEENTE',
    'Vervangende mantelzorg': 'RESPIJTZORG',
    'Dagbesteding': 'DAGBESTEDING',
    'Vrijwilligers': 'VRIJWILLIGERS',
  }
  return mapping[soortHulp] || 'OVERIG'
}

// Mapping van "Soort hulp" naar diensten array
function mapSoortHulpToDiensten(soortHulp: string, tabbladNaam: string): string[] {
  const baseDiensten: Record<string, string[]> = {
    'Informatie en advies': ['informatie', 'advies', 'ondersteuning'],
    'Emotionele steun': ['emotionele steun', 'begeleiding', 'luisterend oor'],
    'Persoonlijke begeleiding': ['persoonlijke begeleiding', 'thuiszorg', 'hulp aan huis'],
    'Praktische hulp': ['praktische hulp', 'waardering', 'ondersteuning'],
    'Vervangende mantelzorg': ['respijtzorg', 'vervangende zorg', 'logeren', 'dagopvang'],
    'Dagbesteding': ['dagbesteding', 'activiteiten', 'sociale contacten'],
    'Vrijwilligers': ['vrijwilligers', 'hulp', 'ondersteuning'],
  }

  const diensten = baseDiensten[soortHulp] || ['overig']

  // Voeg tabblad-specifieke diensten toe
  if (tabbladNaam.includes('Financiële')) diensten.push('administratie', 'financieel')
  if (tabbladNaam.includes('Boodschappen')) diensten.push('boodschappen')
  if (tabbladNaam.includes('Bezoek')) diensten.push('bezoek', 'uitjes', 'gezelschap')
  if (tabbladNaam.includes('Brengen')) diensten.push('vervoer', 'begeleiding')
  if (tabbladNaam.includes('Persoonlijke verzorging')) diensten.push('verzorging', 'ADL')
  if (tabbladNaam.includes('Eten')) diensten.push('maaltijden', 'koken')
  if (tabbladNaam.includes('Huishouden')) diensten.push('huishouden', 'schoonmaken')
  if (tabbladNaam.includes('Klusjes')) diensten.push('klussen', 'onderhoud')

  return diensten
}

interface ExcelRow {
  'Zichtbaar bij lichte belasting?'?: string
  'Zichtbaar bij matige belasting?'?: string
  'Zichtbaar bij zware belasting?'?: string
  'Soort hulp'?: string
  'Onderdeel mantelzorgtest'?: string
  'Gemeente'?: string
  'Naam organisatie'?: string
  'Dienst'?: string
  'Omschrijving dienst'?: string
  'Doelgroep'?: string
  'Voorwaarden'?: string
  'Voorwaarden vervolg'?: string
  'Locatie omschrijving'?: string
  'Wanneer en/of Openingstijden'?: string
  'Aanmeldprocedure'?: string
  'Telefoonnummer'?: string
  'e-mail'?: string
  'website'?: string
  'Kosten'?: string
  'Opmerking'?: string
}

async function importSocialeKaart(filePath: string) {
  console.log('📂 Lezen van Excel bestand:', filePath)

  // Lees Excel bestand
  const workbook = XLSX.readFile(filePath)

  console.log(`📋 ${workbook.SheetNames.length} tabbladen gevonden:`)
  workbook.SheetNames.forEach((name) => console.log(`   - ${name}`))

  let totalImported = 0
  let totalSkipped = 0
  let totalErrors = 0

  // Verwerk elk tabblad
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n📄 Verwerken: ${sheetName}`)

    const worksheet = workbook.Sheets[sheetName]
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet)

    console.log(`   ${rows.length} rijen`)

    const zorgtaakIds = TABBLAD_NAAR_ZORGTAAK[sheetName] || []

    for (const row of rows) {
      try {
        const organisatieNaam = row['Naam organisatie']?.toString().trim()
        const dienst = row['Dienst']?.toString().trim()
        const gemeente = row['Gemeente']?.toString().trim()

        if (!organisatieNaam || !dienst || !gemeente) {
          totalSkipped++
          continue
        }

        // Combineer beschrijving
        let beschrijving = row['Omschrijving dienst']?.toString() || ''
        if (row['Doelgroep']) {
          beschrijving += `\n\nDoelgroep: ${row['Doelgroep']}`
        }
        if (row['Voorwaarden']) {
          beschrijving += `\n\nVoorwaarden: ${row['Voorwaarden']}`
          if (row['Voorwaarden vervolg']) {
            beschrijving += ` ${row['Voorwaarden vervolg']}`
          }
        }
        if (row['Aanmeldprocedure']) {
          beschrijving += `\n\nAanmelden: ${row['Aanmeldprocedure']}`
        }
        if (row['Kosten']) {
          beschrijving += `\n\nKosten: ${row['Kosten']}`
        }
        if (row['Opmerking']) {
          beschrijving += `\n\nOpmerking: ${row['Opmerking']}`
        }

        // Bepaal zichtbaarheid op basis van belasting
        const zichtbaarBijLaag = row['Zichtbaar bij lichte belasting?'] === 'JA'
        const zichtbaarBijGemiddeld = row['Zichtbaar bij matige belasting?'] === 'JA'
        const zichtbaarBijHoog = row['Zichtbaar bij zware belasting?'] === 'JA'

        // Diensten array
        const diensten = mapSoortHulpToDiensten(row['Soort hulp'] || '', sheetName)
        diensten.push(dienst.toLowerCase())

        // Unique naam maken (organisatie + dienst)
        const uniekNaam = `${organisatieNaam} - ${dienst}`

        // Check of al bestaat
        const bestaand = await prisma.zorgorganisatie.findFirst({
          where: {
            naam: uniekNaam,
            gemeente: gemeente,
          },
        })

        if (bestaand) {
          // Update bestaande met zorgtaak IDs als die nog niet gekoppeld zijn
          const bestaandeZorgtaken = bestaand.zorgtaakIds || []
          const nieuweZorgtaken = [...new Set([...bestaandeZorgtaken, ...zorgtaakIds])]

          if (nieuweZorgtaken.length > bestaandeZorgtaken.length) {
            await prisma.zorgorganisatie.update({
              where: { id: bestaand.id },
              data: {
                zorgtaakIds: nieuweZorgtaken,
                zichtbaarBijLaag: bestaand.zichtbaarBijLaag || zichtbaarBijLaag,
                zichtbaarBijGemiddeld: bestaand.zichtbaarBijGemiddeld || zichtbaarBijGemiddeld,
                zichtbaarBijHoog: bestaand.zichtbaarBijHoog || zichtbaarBijHoog,
              },
            })
            console.log(`   🔄 Bijgewerkt: ${uniekNaam} (+ taken: ${zorgtaakIds.join(', ')})`)
          }
          totalSkipped++
          continue
        }

        // Maak nieuwe organisatie aan
        await prisma.zorgorganisatie.create({
          data: {
            naam: uniekNaam,
            beschrijving: beschrijving.trim(),
            type: mapSoortHulpToType(row['Soort hulp'] || '') as any,
            telefoon: row['Telefoonnummer']?.toString().trim() || null,
            email: row['e-mail']?.toString().trim() || null,
            website: row['website']?.toString().trim() || null,
            adres: row['Locatie omschrijving']?.toString().trim() || null,
            gemeente: gemeente,
            diensten: diensten,
            zorgtaakIds: zorgtaakIds,
            zichtbaarBijLaag: zichtbaarBijLaag,
            zichtbaarBijGemiddeld: zichtbaarBijGemiddeld,
            zichtbaarBijHoog: zichtbaarBijHoog,
            openingstijden: row['Wanneer en/of Openingstijden']?.toString().trim() || null,
            isActief: true,
          },
        })

        console.log(`   ✅ ${uniekNaam}`)
        totalImported++
      } catch (error) {
        console.error(`   ❌ Fout:`, error)
        totalErrors++
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📈 TOTAAL IMPORT SAMENVATTING:')
  console.log(`   ✅ Geïmporteerd: ${totalImported}`)
  console.log(`   ⏭️  Overgeslagen/bijgewerkt: ${totalSkipped}`)
  console.log(`   ❌ Fouten: ${totalErrors}`)
  console.log('='.repeat(50))

  await prisma.$disconnect()
}

// Voer import uit
const filePath =
  process.argv[2] ||
  '/Users/willemveenendaal/Desktop/mantelzorg regiodeal 310126/Sociale kaart Zutphen Digitale Mantelzorgconsulent 18012026.xlsx'

importSocialeKaart(filePath)
  .then(() => {
    console.log('\n🎉 Import voltooid!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Import gefaald:', error)
    process.exit(1)
  })
