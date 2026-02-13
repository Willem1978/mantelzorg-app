import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/beheer/hulpbronnen - List all hulpbronnen with filters (public endpoint)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const gemeente = searchParams.get('gemeente')
  const onderdeelTest = searchParams.get('onderdeelTest')
  const soortHulp = searchParams.get('soortHulp')
  const zoek = searchParams.get('zoek')
  const actief = searchParams.get('actief') // 'true', 'false', or null (all)
  const landelijk = searchParams.get('landelijk') // 'true' for gemeente IS NULL
  const modus = searchParams.get('modus') // 'landelijk' or 'gemeentelijk'
  const provincie = searchParams.get('provincie')
  const debug = searchParams.get('debug')

  try {
    const where: any = {}

    if (modus === 'landelijk') {
      where.OR = [
        { dekkingNiveau: { in: ['LANDELIJK', 'PROVINCIE'] } },
        { gemeente: null },
      ]
    } else if (modus === 'gemeentelijk') {
      if (gemeente) {
        where.OR = [
          { gemeente },
          { gemeente: null, woonplaats: { contains: gemeente, mode: 'insensitive' as const } },
        ]
      }
    } else {
      if (gemeente) where.gemeente = gemeente
      if (landelijk === 'true') where.gemeente = null
    }

    if (onderdeelTest) where.onderdeelTest = onderdeelTest
    if (soortHulp) where.soortHulp = soortHulp
    if (actief === 'true') where.isActief = true
    if (actief === 'false') where.isActief = false

    if (zoek) {
      const zoekCondition = {
        OR: [
          { naam: { contains: zoek, mode: 'insensitive' as const } },
          { beschrijving: { contains: zoek, mode: 'insensitive' as const } },
          { gemeente: { contains: zoek, mode: 'insensitive' as const } },
        ],
      }
      if (where.OR) {
        const existingOR = where.OR
        delete where.OR
        where.AND = [{ OR: existingOR }, zoekCondition]
      } else {
        where.OR = zoekCondition.OR
      }
    }

    const hulpbronnen = await prisma.zorgorganisatie.findMany({
      where,
      orderBy: [{ gemeente: 'asc' }, { naam: 'asc' }],
    })

    // Get distinct values for filter dropdowns
    const gemeenten = await prisma.zorgorganisatie.findMany({
      where: { gemeente: { not: null } },
      select: { gemeente: true },
      distinct: ['gemeente'],
      orderBy: { gemeente: 'asc' },
    })

    const onderdelen = await prisma.zorgorganisatie.findMany({
      where: { onderdeelTest: { not: null } },
      select: { onderdeelTest: true },
      distinct: ['onderdeelTest'],
      orderBy: { onderdeelTest: 'asc' },
    })

    // Provincie column may not exist yet in DB - fetch safely
    let provinciesList: string[] = []
    try {
      const provincies = await prisma.zorgorganisatie.findMany({
        where: { provincie: { not: null } },
        select: { provincie: true },
        distinct: ['provincie'],
        orderBy: { provincie: 'asc' },
      })
      provinciesList = provincies.map((p) => p.provincie).filter(Boolean) as string[]
    } catch {
      // provincie column not yet in database - will be added on next deploy
    }

    const response: any = {
      hulpbronnen,
      filters: {
        gemeenten: gemeenten.map((g) => g.gemeente).filter(Boolean),
        onderdelen: onderdelen.map((o) => o.onderdeelTest).filter(Boolean),
        provincies: provinciesList,
      },
    }

    if (debug === 'true') {
      const totalCount = await prisma.zorgorganisatie.count()
      response.debug = {
        query: where,
        params: { modus, gemeente, provincie, zoek, actief },
        resultCount: hulpbronnen.length,
        totalInDb: totalCount,
        allGemeenten: gemeenten.map((g) => g.gemeente),
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Hulpbronnen API error:', error)
    return NextResponse.json({ error: error.message, hulpbronnen: [], filters: { gemeenten: [], onderdelen: [], provincies: [] } }, { status: 500 })
  }
}

// POST /api/beheer/hulpbronnen - Create new hulpbron
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()

  const data: any = {
    naam: body.naam,
    beschrijving: body.beschrijving || null,
    type: body.type || 'OVERIG',
    telefoon: body.telefoon || null,
    email: body.email || null,
    website: body.website || null,
    adres: body.adres || null,
    postcode: body.postcode || null,
    woonplaats: body.woonplaats || null,
    gemeente: body.gemeente || null,
    provincie: body.provincie || null,
    dekkingNiveau: body.dekkingNiveau || 'GEMEENTE',
    dekkingWoonplaatsen: body.dekkingWoonplaatsen || undefined,
    dekkingWijken: body.dekkingWijken || undefined,
    isActief: body.isActief ?? false,
    onderdeelTest: body.onderdeelTest || null,
    soortHulp: body.soortHulp || null,
    openingstijden: body.openingstijden || null,
    zichtbaarBijLaag: body.zichtbaarBijLaag ?? false,
    zichtbaarBijGemiddeld: body.zichtbaarBijGemiddeld ?? false,
    zichtbaarBijHoog: body.zichtbaarBijHoog ?? true,
    kosten: body.kosten || null,
    doelgroep: body.doelgroep || null,
    aanmeldprocedure: body.aanmeldprocedure || null,
  }

  try {
    const hulpbron = await prisma.zorgorganisatie.create({ data })
    return NextResponse.json(hulpbron, { status: 201 })
  } catch (error: any) {
    // If provincie column doesn't exist yet, retry without it
    if (error.message?.includes('provincie')) {
      delete data.provincie
      const hulpbron = await prisma.zorgorganisatie.create({ data })
      return NextResponse.json(hulpbron, { status: 201 })
    }
    throw error
  }
}

// PATCH /api/beheer/hulpbronnen - Batch fix: set gemeente on records where it's missing
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const { gemeente, woonplaats } = body

  if (!gemeente) {
    return NextResponse.json({ error: 'Gemeente is verplicht' }, { status: 400 })
  }

  // Find records without gemeente that have matching woonplaats
  const where: any = { gemeente: null }
  if (woonplaats) {
    where.woonplaats = { contains: woonplaats, mode: 'insensitive' }
  }

  const updated = await prisma.zorgorganisatie.updateMany({
    where,
    data: { gemeente },
  })

  return NextResponse.json({ updated: updated.count, gemeente })
}
