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
      select: { id: true, aandoening: true },
    })

    if (!caregiver) {
      return NextResponse.json({ voorkeuren: [], aandoening: null })
    }

    const voorkeuren = await prisma.gebruikerVoorkeur.findMany({
      where: { caregiverId: caregiver.id },
      select: { type: true, slug: true },
    })

    // Haal aandoening-tag-slugs op uit ContentTag om te weten welke TAG-voorkeuren aandoeningen zijn
    const aandoeningTagSlugs = await prisma.contentTag.findMany({
      where: { type: "AANDOENING", isActief: true },
      select: { slug: true },
    })
    const aandoeningSlugs = new Set(aandoeningTagSlugs.map((t) => t.slug))

    // Filter aandoeningen uit voorkeuren
    const aandoeningen = voorkeuren
      .filter((v) => v.type === "TAG" && aandoeningSlugs.has(v.slug))
      .map((v) => v.slug)

    return NextResponse.json({
      voorkeuren,
      aandoening: caregiver.aandoening, // backward-compat
      aandoeningen, // multi-select
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
    const { voorkeuren, aandoening, aandoeningen } = validated.data

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!caregiver) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    // Multi-aandoening: sla primaire op in caregiver.aandoening (backward-compat)
    const primaryAandoening = aandoeningen?.[0] || aandoening || null
    if (aandoening !== undefined || aandoeningen !== undefined) {
      await prisma.caregiver.update({
        where: { id: caregiver.id },
        data: { aandoening: primaryAandoening },
      })
    }

    // Bouw de volledige voorkeuren-lijst: handmatige tags + categorieën + aandoeningen als TAG
    const alleVoorkeuren = [...(voorkeuren || [])]

    // Voeg multi-aandoeningen toe als TAG-voorkeuren
    if (aandoeningen && aandoeningen.length > 0) {
      for (const slug of aandoeningen) {
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
