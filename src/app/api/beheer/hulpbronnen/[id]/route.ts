import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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

  const hulpbron = await prisma.zorgorganisatie.update({
    where: { id },
    data: {
      naam: body.naam,
      beschrijving: body.beschrijving ?? null,
      type: body.type,
      telefoon: body.telefoon ?? null,
      email: body.email ?? null,
      website: body.website ?? null,
      adres: body.adres ?? null,
      postcode: body.postcode ?? null,
      woonplaats: body.woonplaats ?? null,
      gemeente: body.gemeente ?? null,
      provincie: body.provincie ?? null,
      dekkingNiveau: body.dekkingNiveau || 'GEMEENTE',
      dekkingWoonplaatsen: body.dekkingWoonplaatsen !== undefined ? body.dekkingWoonplaatsen : undefined,
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
    },
  })

  return NextResponse.json(hulpbron)
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
