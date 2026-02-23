import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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

function mapType(soortOrganisatie: string | undefined): string {
  if (!soortOrganisatie) return 'OVERIG'
  const upper = soortOrganisatie.toUpperCase().replace(/\s+/g, '_')
  if (VALID_TYPES.includes(upper)) return upper
  // Probeer fuzzy match
  if (upper.includes('THUISZORG')) return 'THUISZORG'
  if (upper.includes('MANTELZORG')) return 'MANTELZORGSTEUNPUNT'
  if (upper.includes('RESPIJT')) return 'RESPIJTZORG'
  if (upper.includes('DAGBESTEDING')) return 'DAGBESTEDING'
  if (upper.includes('HUISARTS')) return 'HUISARTS'
  if (upper.includes('WIJKTEAM') || upper.includes('SOCIAAL')) return 'SOCIAAL_WIJKTEAM'
  if (upper.includes('VRIJWILLIG')) return 'VRIJWILLIGERS'
  if (upper.includes('GEMEENTE')) return 'GEMEENTE'
  if (upper.includes('LANDELIJK')) return 'LANDELIJK'
  return 'OVERIG'
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
            doelgroep: row.doelgroep || null,
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
