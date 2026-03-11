import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Detecteer welke extra kolommen beschikbaar zijn in de database
const EXTRA_COLUMNS = [
  'eersteStap',
  'verwachtingTekst',
  'verschijntIn',
  'routeLabel',
  'bronLabel',
  'zorgverzekeraar',
  'provincie',
] as const

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
  setTimeout(() => { _extraColumnsCache = null }, 5 * 60 * 1000)
  return result
}

// PUT /api/beheer/hulpbronnen/[id] - Update hulpbron
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const extra = await getAvailableExtraColumns()

  // Bouw data-object met alleen bestaande kolommen
  const data: Record<string, unknown> = {
    naam: body.naam,
    beschrijving: body.beschrijving ?? null,
    type: body.type,
    dienst: body.dienst ?? null,
    telefoon: body.telefoon ?? null,
    email: body.email ?? null,
    website: body.website ?? null,
    adres: body.adres ?? null,
    postcode: body.postcode ?? null,
    woonplaats: body.woonplaats ?? null,
    gemeente: body.gemeente ?? null,
    dekkingNiveau: body.dekkingNiveau || 'GEMEENTE',
    dekkingWoonplaatsen: body.dekkingWoonplaatsen !== undefined ? body.dekkingWoonplaatsen : undefined,
    dekkingWijken: body.dekkingWijken !== undefined ? body.dekkingWijken : undefined,
    isActief: body.isActief,
    onderdeelTest: body.onderdeelTest ?? null,
    soortHulp: body.soortHulp ?? null,
    openingstijden: body.openingstijden ?? null,
    zichtbaarBijLaag: body.zichtbaarBijLaag ?? false,
    zichtbaarBijGemiddeld: body.zichtbaarBijGemiddeld ?? false,
    zichtbaarBijHoog: body.zichtbaarBijHoog ?? true,
    kosten: body.kosten ?? null,
    doelgroep: body.doelgroep ?? null,
    aanmeldprocedure: body.aanmeldprocedure ?? null,
  }

  // Voeg extra kolommen toe alleen als ze in de database bestaan
  if (extra.provincie) data.provincie = body.provincie ?? null
  if (extra.eersteStap) data.eersteStap = body.eersteStap ?? null
  if (extra.verwachtingTekst) data.verwachtingTekst = body.verwachtingTekst ?? null
  if (extra.verschijntIn) data.verschijntIn = body.verschijntIn !== undefined ? body.verschijntIn : undefined
  if (extra.routeLabel) data.routeLabel = body.routeLabel ?? null
  if (extra.bronLabel) data.bronLabel = body.bronLabel ?? null
  if (extra.zorgverzekeraar) data.zorgverzekeraar = body.zorgverzekeraar ?? false

  try {
    const hulpbron = await prisma.zorgorganisatie.update({
      where: { id },
      data,
    })
    return NextResponse.json(hulpbron)
  } catch (error: unknown) {
    console.error('Hulpbron update error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/beheer/hulpbronnen/[id] - Delete hulpbron
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { id } = await params

  await prisma.zorgorganisatie.delete({
    where: { id },
  })

  return NextResponse.json({ ok: true })
}
