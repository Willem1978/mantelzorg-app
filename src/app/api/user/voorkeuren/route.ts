import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { voorkeurenSchema, validateBody } from "@/lib/validations"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  try {
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
      select: { id: true, aandoening: true },
    })

    if (!caregiver) {
      return NextResponse.json({ voorkeuren: [], aandoening: null })
    }

    const voorkeuren = await prisma.gebruikerVoorkeur.findMany({
      where: { caregiverId: caregiver.id },
      select: { type: true, slug: true },
    })

    return NextResponse.json({
      voorkeuren,
      aandoening: caregiver.aandoening,
    })
  } catch (error) {
    console.error("Voorkeuren ophalen mislukt:", error)
    return NextResponse.json({ error: "Voorkeuren ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = validateBody(body, voorkeurenSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { voorkeuren, aandoening } = validation.data

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!caregiver) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    // Update aandoening op profiel
    if (aandoening !== undefined) {
      await prisma.caregiver.update({
        where: { id: caregiver.id },
        data: { aandoening: aandoening || null },
      })
    }

    // Vervang alle voorkeuren als ze meegegeven zijn
    if (voorkeuren) {
      await prisma.gebruikerVoorkeur.deleteMany({
        where: { caregiverId: caregiver.id },
      })

      if (voorkeuren.length > 0) {
        await prisma.gebruikerVoorkeur.createMany({
          data: voorkeuren.map((v) => ({
            caregiverId: caregiver.id,
            type: v.type,
            slug: v.slug,
          })),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Voorkeuren opslaan mislukt:", error)
    return NextResponse.json({ error: "Voorkeuren opslaan mislukt" }, { status: 500 })
  }
}
