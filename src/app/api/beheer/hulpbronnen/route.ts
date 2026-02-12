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

  const where: any = {}

  if (modus === 'landelijk') {
    where.dekkingNiveau = { in: ['LANDELIJK', 'PROVINCIE'] }
    if (provincie) where.provincie = provincie
  } else if (modus === 'gemeentelijk') {
    where.dekkingNiveau = { in: ['GEMEENTE', 'WOONPLAATS', 'WIJK'] }
    if (gemeente) where.gemeente = gemeente
  } else {
    if (gemeente) where.gemeente = gemeente
    if (landelijk === 'true') where.gemeente = null
  }
  if (onderdeelTest) where.onderdeelTest = onderdeelTest
  if (soortHulp) where.soortHulp = soortHulp
  if (actief === 'true') where.isActief = true
  if (actief === 'false') where.isActief = false

  if (zoek) {
    where.OR = [
      { naam: { contains: zoek, mode: 'insensitive' } },
      { beschrijving: { contains: zoek, mode: 'insensitive' } },
      { gemeente: { contains: zoek, mode: 'insensitive' } },
    ]
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

  const provincies = await prisma.zorgorganisatie.findMany({
    where: { provincie: { not: null } },
    select: { provincie: true },
    distinct: ['provincie'],
    orderBy: { provincie: 'asc' },
  })

  return NextResponse.json({
    hulpbronnen,
    filters: {
      gemeenten: gemeenten.map((g) => g.gemeente).filter(Boolean),
      onderdelen: onderdelen.map((o) => o.onderdeelTest).filter(Boolean),
      provincies: provincies.map((p) => p.provincie).filter(Boolean),
    },
  })
}

// POST /api/beheer/hulpbronnen - Create new hulpbron
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()

  const hulpbron = await prisma.zorgorganisatie.create({
    data: {
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
    },
  })

  return NextResponse.json(hulpbron, { status: 201 })
}
