/**
 * Import script voor Sociale Kaart Excel bestand
 * Importeert hulporganisaties naar de Zorgorganisatie tabel
 *
 * Structuur Excel:
 * - "Soort hulp" = categorie voor mantelzorger zelf (Financieel, Educatie, Praktisch, etc.)
 * - "Onderdeel mantelzorgtest" = bij welke taak (Administratie, Huishouden, Vervoer, etc.)
 */

import XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping van "Soort hulp" naar ZorgorganisatieType
function mapSoortHulpToType(soortHulp: string): string {
  const mapping: Record<string, string> = {
    'Financiële regelingen': 'GEMEENTE',
    'Educatie': 'MANTELZORGSTEUNPUNT',
    'Praktische hulp': 'VRIJWILLIGERS',
    'Informatie en advies': 'MANTELZORGSTEUNPUNT',
    'Emotionele steun': 'MANTELZORGSTEUNPUNT',
    'Persoonlijke begeleiding': 'THUISZORG',
    'Vervangende mantelzorg': 'RESPIJTZORG',
    'Nog geen lokale oplossingen': 'OVERIG',
  }
  return mapping[soortHulp] || 'OVERIG'
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
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet)

  console.log(`📊 ${rows.length} rijen gevonden in "${sheetName}"`)

  // Eerst alle bestaande records verwijderen
  console.log('🗑️  Bestaande records verwijderen...')
  await prisma.zorgorganisatie.deleteMany({})

  let totalImported = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const row of rows) {
    try {
      const organisatieNaam = row['Naam organisatie']?.toString().trim()
      const dienst = row['Dienst']?.toString().trim()
      const gemeente = row['Gemeente']?.toString().trim() || 'Zutphen'
      const soortHulp = row['Soort hulp']?.toString().trim() || ''
      const onderdeelTest = row['Onderdeel mantelzorgtest']?.toString().trim() || ''

      if (!organisatieNaam) {
        totalSkipped++
        continue
      }

      // Bepaal zichtbaarheid op basis van belasting
      const zichtbaarBijLaag = row['Zichtbaar bij lichte belasting?']?.toString().toUpperCase() === 'JA'
      const zichtbaarBijGemiddeld = row['Zichtbaar bij matige belasting?']?.toString().toUpperCase() === 'JA'
      const zichtbaarBijHoog = row['Zichtbaar bij zware belasting?']?.toString().toUpperCase() === 'JA'

      // Combineer voorwaarden
      const voorwaarden1 = row['Voorwaarden']?.toString().trim() || ''
      const voorwaarden2 = row['Voorwaarden vervolg']?.toString().trim() || ''
      const voorwaarden = [voorwaarden1, voorwaarden2].filter(Boolean).join(' ') || null

      // Unique naam maken (organisatie + dienst als beide aanwezig)
      const uniekNaam = dienst ? `${organisatieNaam} - ${dienst}` : organisatieNaam

      // Maak nieuwe organisatie aan
      await prisma.zorgorganisatie.create({
        data: {
          naam: uniekNaam,
          dienst: dienst || null,
          beschrijving: row['Omschrijving dienst']?.toString().trim() || null,
          type: mapSoortHulpToType(soortHulp) as any,

          // Categorisatie
          soortHulp: soortHulp || null,
          onderdeelTest: onderdeelTest || null,

          // Doelgroep en voorwaarden
          doelgroep: row['Doelgroep']?.toString().trim() || null,
          voorwaarden: voorwaarden,

          // Contact
          telefoon: row['Telefoonnummer']?.toString().trim() || null,
          email: row['e-mail']?.toString().trim() || null,
          website: row['website']?.toString().trim() || null,

          // Locatie
          gemeente: gemeente,
          locatieOmschrijving: row['Locatie omschrijving']?.toString().trim() || null,

          // Praktische info
          aanmeldprocedure: row['Aanmeldprocedure']?.toString().trim() || null,
          openingstijden: row['Wanneer en/of Openingstijden']?.toString().trim() || null,
          kosten: row['Kosten']?.toString().trim() || null,

          // Zichtbaarheid
          zichtbaarBijLaag,
          zichtbaarBijGemiddeld,
          zichtbaarBijHoog,

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

  console.log('\n' + '='.repeat(50))
  console.log('📈 IMPORT SAMENVATTING:')
  console.log(`   ✅ Geïmporteerd: ${totalImported}`)
  console.log(`   ⏭️  Overgeslagen: ${totalSkipped}`)
  console.log(`   ❌ Fouten: ${totalErrors}`)

  // Toon statistieken per soort hulp
  const statsSoort = await prisma.zorgorganisatie.groupBy({
    by: ['soortHulp'],
    _count: true,
  })
  console.log('\n📊 Per "Soort hulp" (hulp voor mantelzorger):')
  statsSoort.forEach((s) => {
    console.log(`   - ${s.soortHulp || 'Onbekend'}: ${s._count}`)
  })

  // Toon statistieken per onderdeel test
  const statsOnderdeel = await prisma.zorgorganisatie.groupBy({
    by: ['onderdeelTest'],
    _count: true,
  })
  console.log('\n📊 Per "Onderdeel mantelzorgtest" (hulp bij taak):')
  statsOnderdeel.forEach((s) => {
    console.log(`   - ${s.onderdeelTest || 'Onbekend'}: ${s._count}`)
  })

  console.log('='.repeat(50))

  await prisma.$disconnect()
}

// Voer import uit
const filePath =
  process.argv[2] ||
  '/Users/willemveenendaal/Desktop/Sociale kaart Zutphen inclusief FB 19082025.xlsx'

importSocialeKaart(filePath)
  .then(() => {
    console.log('\n🎉 Import voltooid!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Import gefaald:', error)
    process.exit(1)
  })
