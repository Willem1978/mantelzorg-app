import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Basiskolommen die altijd in de database bestaan
const BASE_SELECT = {
  id: true,
  naam: true,
  beschrijving: true,
  type: true,
  dienst: true,
  telefoon: true,
  email: true,
  website: true,
  adres: true,
  postcode: true,
  woonplaats: true,
  gemeente: true,
  dekkingNiveau: true,
  dekkingWoonplaatsen: true,
  dekkingWijken: true,
  isActief: true,
  onderdeelTest: true,
  soortHulp: true,
  openingstijden: true,
  zichtbaarBijLaag: true,
  zichtbaarBijGemiddeld: true,
  zichtbaarBijHoog: true,
  kosten: true,
  doelgroep: true,
  aanmeldprocedure: true,
  createdAt: true,
  updatedAt: true,
} as const

// Nieuwere kolommen die mogelijk nog niet in de productie-database staan
const EXTRA_COLUMNS = [
  'eersteStap',
  'verwachtingTekst',
  'verschijntIn',
  'routeLabel',
  'bronLabel',
  'zorgverzekeraar',
  'provincie',
] as const

// Detecteer welke extra kolommen beschikbaar zijn in de database
let _extraColumnsCache: Record<string, boolean> | null = null
async function getAvailableExtraColumns(): Promise<Record<string, boolean>> {
  if (_extraColumnsCache) return _extraColumnsCache

  const result: Record<string, boolean> = {}
  for (const col of EXTRA_COLUMNS) {
    try {
      await prisma.zorgorganisatie.findFirst({ select: { [col]: true } })
      result[col] = true
    } catch {
      result[col] = false
    }
  }
  _extraColumnsCache = result
  // Cache 5 minuten, daarna opnieuw detecteren
  setTimeout(() => { _extraColumnsCache = null }, 5 * 60 * 1000)
  return result
}

// Bouw een select-object dat alleen bestaande kolommen bevat
async function buildSafeSelect() {
  const extra = await getAvailableExtraColumns()
  const select: Record<string, boolean> = { ...BASE_SELECT }
  for (const col of EXTRA_COLUMNS) {
    if (extra[col]) select[col] = true
  }
  return select
}

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
  const doelgroep = searchParams.get('doelgroep') // 'MANTELZORGER' or 'ZORGVRAGER'
  const debug = searchParams.get('debug')

  try {
    const where: Record<string, unknown> = {}

    if (modus === 'landelijk') {
      where.OR = [
        { dekkingNiveau: { in: ['LANDELIJK', 'PROVINCIE'] } },
        { gemeente: null },
      ]
    } else if (modus === 'gemeentelijk') {
      if (gemeente) {
        where.OR = [
          { gemeente: { equals: gemeente, mode: 'insensitive' as const } },
          { gemeente: null },
        ]
      }
    } else {
      if (gemeente) where.gemeente = { equals: gemeente, mode: 'insensitive' as const }
      if (landelijk === 'true') where.gemeente = null
    }

    if (onderdeelTest) where.onderdeelTest = onderdeelTest
    if (soortHulp) where.soortHulp = soortHulp
    if (actief === 'true') where.isActief = true
    if (actief === 'false') where.isActief = false

    // Bouw AND-condities op (doelgroep + zoek + eventueel bestaande OR)
    const andConditions: Record<string, unknown>[] = []

    // Doelgroep filter: gebruik het doelgroep-veld in de database
    // Bij import wordt doelgroep nu correct als MANTELZORGER/ZORGVRAGER opgeslagen
    const MANTELZORGER_CATEGORIEEN = [
      'Ondersteuning',
      'Vervangende mantelzorg',
      'Praten, steun & lotgenoten',
      'Leren & training',
    ]
    if (doelgroep === "MANTELZORGER") {
      andConditions.push({ OR: [
        { doelgroep: { equals: 'MANTELZORGER', mode: 'insensitive' as const } },
        { onderdeelTest: { in: MANTELZORGER_CATEGORIEEN } },
      ] })
    } else if (doelgroep === "ZORGVRAGER") {
      andConditions.push({ OR: [
        { doelgroep: { equals: 'ZORGVRAGER', mode: 'insensitive' as const } },
        { AND: [
          { onderdeelTest: { notIn: MANTELZORGER_CATEGORIEEN } },
          { OR: [{ doelgroep: null }, { doelgroep: { not: 'MANTELZORGER' } }] },
        ] },
      ] })
    }

    if (zoek) {
      andConditions.push({
        OR: [
          { naam: { contains: zoek, mode: 'insensitive' as const } },
          { beschrijving: { contains: zoek, mode: 'insensitive' as const } },
          { gemeente: { contains: zoek, mode: 'insensitive' as const } },
        ],
      })
    }

    // Als er AND-condities zijn EN een bestaande OR (van modus/gemeente), combineer alles
    if (andConditions.length > 0) {
      if (where.OR) {
        const existingOR = where.OR
        delete where.OR
        andConditions.unshift({ OR: existingOR })
      }
      where.AND = andConditions
    }

    const select = await buildSafeSelect()

    const hulpbronnen = await prisma.zorgorganisatie.findMany({
      where,
      select,
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
    const extra = await getAvailableExtraColumns()
    let provinciesList: string[] = []
    if (extra.provincie) {
      try {
        const provincies = await prisma.zorgorganisatie.findMany({
          where: { provincie: { not: null } },
          select: { provincie: true },
          distinct: ['provincie'],
          orderBy: { provincie: 'asc' },
        })
        provinciesList = provincies.map((p) => p.provincie).filter(Boolean) as string[]
      } catch {
        // provincie column not yet in database
      }
    }

    const response: Record<string, unknown> = {
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
        availableColumns: extra,
      }
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('Hulpbronnen API error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message, hulpbronnen: [], filters: { gemeenten: [], onderdelen: [], provincies: [] } }, { status: 500 })
  }
}

// POST /api/beheer/hulpbronnen - Create new hulpbron
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const extra = await getAvailableExtraColumns()

  // Bouw data-object met alleen bestaande kolommen
  const data: Record<string, unknown> = {
    naam: body.naam,
    beschrijving: body.beschrijving || null,
    type: body.type || 'OVERIG',
    dienst: body.dienst || null,
    telefoon: body.telefoon || null,
    email: body.email || null,
    website: body.website || null,
    adres: body.adres || null,
    postcode: body.postcode || null,
    woonplaats: body.woonplaats || null,
    gemeente: body.gemeente || null,
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

  // Voeg extra kolommen toe alleen als ze in de database bestaan
  if (extra.provincie) data.provincie = body.provincie || null
  if (extra.eersteStap) data.eersteStap = body.eersteStap || null
  if (extra.verwachtingTekst) data.verwachtingTekst = body.verwachtingTekst || null
  if (extra.verschijntIn) data.verschijntIn = body.verschijntIn || []
  if (extra.routeLabel) data.routeLabel = body.routeLabel || null
  if (extra.bronLabel) data.bronLabel = body.bronLabel || null
  if (extra.zorgverzekeraar) data.zorgverzekeraar = body.zorgverzekeraar ?? false

  try {
    const hulpbron = await (prisma.zorgorganisatie.create as Function)({ data })
    return NextResponse.json(hulpbron, { status: 201 })
  } catch (error: unknown) {
    console.error('Hulpbron create error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
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
  const where: Record<string, unknown> = { gemeente: null }
  if (woonplaats) {
    where.woonplaats = { contains: woonplaats, mode: 'insensitive' }
  }

  const updated = await prisma.zorgorganisatie.updateMany({
    where,
    data: { gemeente },
  })

  return NextResponse.json({ updated: updated.count, gemeente })
}
