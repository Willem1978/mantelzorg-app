import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PDOK_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1'

// Look up a woonplaats via PDOK → returns gemeente + provincie
async function pdokLookupWoonplaats(woonplaats: string): Promise<{ gemeente: string; provincie: string } | null> {
  try {
    const params = new URLSearchParams({ q: woonplaats, fq: 'type:woonplaats', rows: '1' })
    const res = await fetch(`${PDOK_URL}/free?${params}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    const doc = data.response?.docs?.[0]
    if (!doc) return null
    return {
      gemeente: doc.gemeentenaam || '',
      provincie: doc.provincienaam || '',
    }
  } catch {
    return null
  }
}

// Look up a gemeente via PDOK → returns provincie
async function pdokLookupGemeente(gemeente: string): Promise<{ provincie: string } | null> {
  try {
    const params = new URLSearchParams({ q: gemeente, fq: 'type:gemeente', rows: '1' })
    const res = await fetch(`${PDOK_URL}/free?${params}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    const doc = data.response?.docs?.[0]
    if (!doc) return null
    return { provincie: doc.provincienaam || '' }
  } catch {
    return null
  }
}

// Check if a column exists in the database by trying a query
async function hasProvincieColumn(): Promise<boolean> {
  try {
    await prisma.zorgorganisatie.findFirst({ select: { provincie: true } })
    return true
  } catch {
    return false
  }
}

// POST /api/beheer/hulpbronnen/verrijk - Enrich all records with missing location data
export async function POST(_request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  try {
    const provincieExists = await hasProvincieColumn()

    // 1. Get all records
    const records = await prisma.zorgorganisatie.findMany()

    // 2. Collect unique values to look up (avoid duplicate PDOK calls)
    const uniqueWoonplaatsen = new Set<string>()
    const uniqueGemeenten = new Set<string>()

    for (const r of records) {
      if (r.woonplaats) uniqueWoonplaatsen.add(r.woonplaats)
      if (r.gemeente) uniqueGemeenten.add(r.gemeente)
    }

    // 3. Look up all unique woonplaatsen via PDOK
    const wpInfo = new Map<string, { gemeente: string; provincie: string }>()
    for (const wp of uniqueWoonplaatsen) {
      const info = await pdokLookupWoonplaats(wp)
      if (info && info.gemeente) wpInfo.set(wp, info)
    }

    // 4. Look up all unique gemeenten via PDOK
    const gemInfo = new Map<string, { provincie: string }>()
    for (const gem of uniqueGemeenten) {
      const info = await pdokLookupGemeente(gem)
      if (info && info.provincie) gemInfo.set(gem, info)
    }

    // Also add gemeenten we discovered from woonplaats lookups
    for (const [, info] of wpInfo) {
      if (info.gemeente && !gemInfo.has(info.gemeente)) {
        const gInfo = await pdokLookupGemeente(info.gemeente)
        if (gInfo && gInfo.provincie) gemInfo.set(info.gemeente, gInfo)
      }
    }

    // 5. Update each record
    let updated = 0
    const log: string[] = []

    for (const r of records) {
      const updates: Record<string, string> = {}

      // a. Set gemeente from woonplaats if missing
      if (!r.gemeente && r.woonplaats) {
        const info = wpInfo.get(r.woonplaats)
        if (info) {
          updates.gemeente = info.gemeente
          if (provincieExists) updates.provincie = info.provincie
        }
      }

      // b. Set provincie from gemeente if missing (only if column exists)
      if (provincieExists) {
        const effectiveGemeente = r.gemeente || updates.gemeente
        if (!r.provincie && !updates.provincie && effectiveGemeente) {
          const info = gemInfo.get(effectiveGemeente)
          if (info) updates.provincie = info.provincie
        }
      }

      // c. Set woonplaats from gemeente if woonplaats is missing but gemeente is set
      if (!r.woonplaats && (r.gemeente || updates.gemeente)) {
        updates.woonplaats = r.gemeente || updates.gemeente
      }

      // d. Fix dekkingNiveau: records without gemeente should not be GEMEENTE level
      const hasGemeente = r.gemeente || updates.gemeente
      if (!hasGemeente && r.dekkingNiveau === 'GEMEENTE') {
        updates.dekkingNiveau = 'LANDELIJK'
      }

      if (Object.keys(updates).length > 0) {
        await prisma.zorgorganisatie.update({
          where: { id: r.id },
          data: updates,
        })
        updated++
        log.push(`${r.naam}: ${Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ')}`)
      }
    }

    return NextResponse.json({
      success: true,
      total: records.length,
      updated,
      provincieColumnExists: provincieExists,
      pdokLookups: {
        woonplaatsen: Object.fromEntries(wpInfo),
        gemeenten: Object.fromEntries(gemInfo),
      },
      log,
    })
  } catch (error: unknown) {
    console.error('Verrijk API error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// GET /api/beheer/hulpbronnen/verrijk - Preview what would be updated
export async function GET() {
  try {
    const provincieExists = await hasProvincieColumn()

    // Build select dynamically based on available columns
    const select: Prisma.ZorgorganisatieSelect = {
      id: true,
      naam: true,
      woonplaats: true,
      gemeente: true,
      dekkingNiveau: true,
    }
    if (provincieExists) select.provincie = true

    const records = await prisma.zorgorganisatie.findMany({ select })

    type VerrijkRecord = {
      gemeente?: string | null
      woonplaats?: string | null
      provincie?: string | null
      naam?: string | null
      dekkingNiveau?: string
    }

    const missingGemeente = records.filter((r) => !(r as VerrijkRecord).gemeente)
    const missingProvincie = provincieExists ? records.filter((r) => !(r as VerrijkRecord).provincie) : records
    const missingWoonplaats = records.filter((r) => !(r as VerrijkRecord).woonplaats)

    return NextResponse.json({
      total: records.length,
      missingGemeente: missingGemeente.length,
      missingProvincie: missingProvincie.length,
      missingWoonplaats: missingWoonplaats.length,
      provincieColumnExists: provincieExists,
      records: records.map((r) => {
        const rec = r as VerrijkRecord
        return {
          naam: rec.naam,
          woonplaats: rec.woonplaats,
          gemeente: rec.gemeente,
          provincie: rec.provincie || null,
          dekkingNiveau: rec.dekkingNiveau,
          needsUpdate: !rec.gemeente || (provincieExists ? !rec.provincie : true),
        }
      }),
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
