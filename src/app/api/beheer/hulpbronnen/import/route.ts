import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ZorgorganisatieType } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Mapping van CSV-kolomnamen naar database-velden
const KOLOM_MAPPING: Record<string, string> = {
  'Naam organisatie': 'naam',
  'Naam dienst': 'dienst',
  'Omschrijving dienst': 'beschrijving',
  'Doelgroep': 'doelgroep',
  'Categorie': 'categorie',
  'Soort hulp': 'soortHulp',
  'Gemeente': 'gemeente',
  'Soort organisatie': 'type',
  'Telefoonnummer': 'telefoon',
  'Telefonisch te bereiken op': 'openingstijden',
  'Website': 'website',
  'Kosten': 'kosten',
}

// Geldige ZorgorganisatieType enum-waarden
const VALID_TYPES = [
  'GEMEENTE', 'THUISZORG', 'MANTELZORGSTEUNPUNT', 'RESPIJTZORG',
  'DAGBESTEDING', 'HUISARTS', 'SOCIAAL_WIJKTEAM', 'VRIJWILLIGERS',
  'OVERIG', 'LANDELIJK',
]

function mapType(soortOrganisatie: string | undefined): ZorgorganisatieType {
  if (!soortOrganisatie) return ZorgorganisatieType.OVERIG
  const upper = soortOrganisatie.toUpperCase().replace(/\s+/g, '_')
  if (VALID_TYPES.includes(upper)) return upper as ZorgorganisatieType
  // Probeer fuzzy match
  if (upper.includes('THUISZORG')) return ZorgorganisatieType.THUISZORG
  if (upper.includes('MANTELZORG')) return ZorgorganisatieType.MANTELZORGSTEUNPUNT
  if (upper.includes('RESPIJT')) return ZorgorganisatieType.RESPIJTZORG
  if (upper.includes('DAGBESTEDING')) return ZorgorganisatieType.DAGBESTEDING
  if (upper.includes('HUISARTS')) return ZorgorganisatieType.HUISARTS
  if (upper.includes('WIJKTEAM') || upper.includes('SOCIAAL')) return ZorgorganisatieType.SOCIAAL_WIJKTEAM
  if (upper.includes('VRIJWILLIG')) return ZorgorganisatieType.VRIJWILLIGERS
  if (upper.includes('GEMEENTE')) return ZorgorganisatieType.GEMEENTE
  if (upper.includes('LANDELIJK')) return ZorgorganisatieType.LANDELIJK
  return ZorgorganisatieType.OVERIG
}

// Categorieën die bij mantelzorger horen
const MANTELZORGER_CATEGORIEEN = [
  'mantelzorgondersteuning', 'vervangende mantelzorg', 'emotionele steun',
  'lotgenotencontact', 'leren en training', 'respijtzorg',
  'mantelzorgsteunpunt', 'mantelzorgwaardering',
]

function mapDoelgroep(doelgroepCsv: string | undefined, categorie: string | undefined): string | null {
  // Als de CSV expliciet een doelgroep heeft, normaliseer die
  if (doelgroepCsv) {
    const lower = doelgroepCsv.toLowerCase()
    if (lower.includes('mantelzorg')) return 'MANTELZORGER'
    if (lower.includes('zorgvrager') || lower.includes('cliënt') || lower.includes('client')) return 'ZORGVRAGER'
    // Tekst bevat beide of iets anders -> bewaar als vrije tekst
    return doelgroepCsv
  }
  // Anders: afleiden uit categorie
  if (categorie) {
    const lower = categorie.toLowerCase()
    if (MANTELZORGER_CATEGORIEEN.some((mc) => lower.includes(mc))) return 'MANTELZORGER'
  }
  return null
}

function mapRow(csvRow: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {}
  for (const [csvKolom, dbVeld] of Object.entries(KOLOM_MAPPING)) {
    // Case-insensitive match op kolomnaam
    const key = Object.keys(csvRow).find(
      (k) => k.trim().toLowerCase() === csvKolom.toLowerCase()
    )
    if (key && csvRow[key]?.trim()) {
      mapped[dbVeld] = csvRow[key].trim()
    }
  }
  return mapped
}

// POST /api/beheer/hulpbronnen/import - Import CSV hulpbronnen
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { rows } = body as {
      rows: Record<string, string>[]
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Geen rijen gevonden in het bestand' }, { status: 400 })
    }

    let toegevoegd = 0
    let fouten = 0
    const foutDetails: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = mapRow(rows[i])
      const naam = row.naam || ''
      if (!naam) {
        fouten++
        foutDetails.push(`Rij ${i + 2}: "Naam organisatie" ontbreekt`)
        continue
      }

      const gemeente = row.gemeente || null

      try {
        await prisma.zorgorganisatie.create({
          data: {
            naam,
            beschrijving: row.beschrijving || null,
            type: mapType(row.type),
            locatieOmschrijving: row.type || null, // Originele "Soort organisatie" tekst bewaren
            doelgroep: mapDoelgroep(row.doelgroep, row.categorie),
            onderdeelTest: row.categorie || null,
            soortHulp: row.soortHulp || null,
            dienst: row.dienst || null,
            telefoon: row.telefoon || null,
            website: row.website || null,
            openingstijden: row.openingstijden || null,
            kosten: row.kosten || null,
            gemeente,
            dekkingNiveau: gemeente ? 'GEMEENTE' : 'LANDELIJK',
            isActief: true,
            zichtbaarBijLaag: false,
            zichtbaarBijGemiddeld: false,
            zichtbaarBijHoog: true,
          },
        })
        toegevoegd++
      } catch (err) {
        fouten++
        const msg = err instanceof Error ? err.message : 'Onbekende fout'
        foutDetails.push(`Rij ${i + 2} (${naam}): ${msg}`)
      }
    }

    return NextResponse.json({
      success: true,
      toegevoegd,
      fouten,
      totaalRijen: rows.length,
      foutDetails: foutDetails.slice(0, 20),
    })
  } catch (error) {
    console.error('Import error:', error)
    const message = error instanceof Error ? error.message : 'Onbekende fout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
