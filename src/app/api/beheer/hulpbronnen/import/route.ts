import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/beheer/hulpbronnen/import - Import CSV hulpbronnen
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { rows, gemeente, dekkingNiveau, provincie } = body as {
      rows: Record<string, string>[]
      gemeente: string | null
      dekkingNiveau: string
      provincie: string | null
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Geen rijen gevonden in het bestand' }, { status: 400 })
    }

    let toegevoegd = 0
    let fouten = 0
    const foutDetails: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const naam = (row.naam || '').trim()
      if (!naam) {
        fouten++
        foutDetails.push(`Rij ${i + 2}: Naam ontbreekt`)
        continue
      }

      const jaValues = ['ja', 'yes', 'true', '1', 'waar']
      const isZorgverzekeraar = jaValues.includes((row.zorgverzekeraar || '').toLowerCase().trim())
      const isActief = row.isActief
        ? jaValues.includes(row.isActief.toLowerCase().trim())
        : true // default actief

      try {
        await prisma.zorgorganisatie.create({
          data: {
            naam,
            beschrijving: row.beschrijving?.trim() || null,
            type: row.type?.trim() || 'OVERIG',
            doelgroep: row.doelgroep?.trim() || null,
            onderdeelTest: row.categorie?.trim() || null,
            soortHulp: row.soortHulp?.trim() || null,
            telefoon: row.telefoon?.trim() || null,
            email: row.email?.trim() || null,
            website: row.website?.trim() || null,
            adres: row.adres?.trim() || null,
            postcode: row.postcode?.trim() || null,
            woonplaats: row.woonplaats?.trim() || null,
            gemeente: gemeente || null,
            provincie: provincie || null,
            dekkingNiveau: dekkingNiveau || 'GEMEENTE',
            openingstijden: row.openingstijden?.trim() || null,
            kosten: row.kosten?.trim() || null,
            aanmeldprocedure: row.aanmeldprocedure?.trim() || null,
            bronLabel: row.bronLabel?.trim() || null,
            zorgverzekeraar: isZorgverzekeraar,
            isActief,
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
      foutDetails: foutDetails.slice(0, 20), // max 20 fouten teruggeven
    })
  } catch (error) {
    console.error('Import error:', error)
    const message = error instanceof Error ? error.message : 'Onbekende fout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
