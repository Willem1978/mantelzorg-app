import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const caregiverId = session.user.caregiverId
  if (!caregiverId) {
    return NextResponse.json({ error: "Geen mantelzorger profiel gevonden" }, { status: 404 })
  }

  try {
    const voorkeuren = await prisma.gebruikerVoorkeur.findMany({
      where: { caregiverId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ voorkeuren })
  } catch (error) {
    console.error("Voorkeuren ophalen mislukt:", error)
    return NextResponse.json({ error: "Voorkeuren ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const caregiverId = session.user.caregiverId
  if (!caregiverId) {
    return NextResponse.json({ error: "Geen mantelzorger profiel gevonden" }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { voorkeuren } = body

    if (!Array.isArray(voorkeuren)) {
      return NextResponse.json(
        { error: "Voorkeuren moet een array zijn" },
        { status: 400 }
      )
    }

    // Valideer elk voorkeur-item
    for (const v of voorkeuren) {
      if (!v.type || !v.slug) {
        return NextResponse.json(
          { error: "Elke voorkeur moet type en slug bevatten" },
          { status: 400 }
        )
      }
      if (v.type !== "CATEGORIE" && v.type !== "TAG") {
        return NextResponse.json(
          { error: "Type moet CATEGORIE of TAG zijn" },
          { status: 400 }
        )
      }
    }

    // Vervangstrategie: verwijder bestaande en maak nieuwe aan
    await prisma.$transaction(async (tx) => {
      await tx.gebruikerVoorkeur.deleteMany({
        where: { caregiverId },
      })

      if (voorkeuren.length > 0) {
        await tx.gebruikerVoorkeur.createMany({
          data: voorkeuren.map((v: { type: "CATEGORIE" | "TAG"; slug: string }) => ({
            caregiverId,
            type: v.type,
            slug: v.slug,
          })),
        })
      }
    })

    // Haal de nieuwe voorkeuren op om terug te geven
    const nieuweVoorkeuren = await prisma.gebruikerVoorkeur.findMany({
      where: { caregiverId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      bericht: "Voorkeuren opgeslagen",
      voorkeuren: nieuweVoorkeuren,
    })
  } catch (error) {
    console.error("Voorkeuren opslaan mislukt:", error)
    return NextResponse.json({ error: "Voorkeuren opslaan mislukt" }, { status: 500 })
  }
}
