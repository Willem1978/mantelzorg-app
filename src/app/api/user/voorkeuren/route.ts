import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateBody, voorkeurenSchema } from "@/lib/validations"
import type { VoorkeurType } from "@prisma/client"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  try {
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!caregiver) {
      return NextResponse.json({ voorkeuren: [], zorgthemas: [] })
    }

    const voorkeuren = await prisma.gebruikerVoorkeur.findMany({
      where: { caregiverId: caregiver.id },
      select: { type: true, slug: true },
    })

    // Haal zorgthema-tag-slugs op uit ContentTag
    const zorgthemaTagSlugs = await prisma.contentTag.findMany({
      where: { type: "ZORGTHEMA", isActief: true },
      select: { slug: true },
    })
    const zorgthemaSlugs = new Set(zorgthemaTagSlugs.map((t) => t.slug))

    // Filter zorgthema's uit voorkeuren
    const zorgthemas = voorkeuren
      .filter((v) => v.type === "TAG" && zorgthemaSlugs.has(v.slug))
      .map((v) => v.slug)

    return NextResponse.json({
      voorkeuren,
      zorgthemas,
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
    const raw = await request.json()
    const validated = validateBody(raw, voorkeurenSchema)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }
    const { voorkeuren, zorgthemas } = validated.data

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!caregiver) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    // Sla primaire zorgthema op in caregiver.aandoening (legacy veld)
    if (zorgthemas !== undefined) {
      await prisma.caregiver.update({
        where: { id: caregiver.id },
        data: { aandoening: zorgthemas?.[0] || null },
      })
    }

    // Bouw de volledige voorkeuren-lijst: handmatige tags + categorieën + zorgthemas als TAG
    const alleVoorkeuren = [...(voorkeuren || [])]

    // Voeg zorgthemas toe als TAG-voorkeuren
    if (zorgthemas && zorgthemas.length > 0) {
      for (const slug of zorgthemas) {
        if (!alleVoorkeuren.some((v) => v.type === "TAG" && v.slug === slug)) {
          alleVoorkeuren.push({ type: "TAG", slug })
        }
      }
    }

    // Vervang alle voorkeuren
    await prisma.gebruikerVoorkeur.deleteMany({
      where: { caregiverId: caregiver.id },
    })

    if (alleVoorkeuren.length > 0) {
      await prisma.gebruikerVoorkeur.createMany({
        data: alleVoorkeuren.map((v) => ({
          caregiverId: caregiver.id,
          type: v.type as VoorkeurType,
          slug: v.slug,
        })),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Voorkeuren opslaan mislukt:", error)
    return NextResponse.json({ error: "Voorkeuren opslaan mislukt" }, { status: 500 })
  }
}
