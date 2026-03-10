import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { favorietSchema, validateBody } from "@/lib/validations"

export const dynamic = 'force-dynamic'

// GET - Alle favorieten ophalen voor ingelogde gebruiker
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ favorieten: [], count: 0 })
    }

    const favorieten = await prisma.favoriet.findMany({
      where: { caregiverId: session.user.caregiverId },
      orderBy: { createdAt: "desc" },
    })

    const countActief = favorieten.filter(f => !f.isVoltooid).length

    return NextResponse.json({ favorieten, count: countActief })
  } catch (error) {
    console.error("Favorieten fetch error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen" },
      { status: 500 }
    )
  }
}

// POST - Favoriet toevoegen
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = validateBody(body, favorietSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const data = validation.data

    const favoriet = await prisma.favoriet.upsert({
      where: {
        caregiverId_type_itemId: {
          caregiverId: session.user.caregiverId,
          type: data.type,
          itemId: data.itemId,
        }
      },
      update: {},
      create: {
        caregiverId: session.user.caregiverId,
        type: data.type,
        itemId: data.itemId,
        titel: data.titel,
        beschrijving: data.beschrijving || null,
        categorie: data.categorie || null,
        url: data.url || null,
        telefoon: data.telefoon || null,
        icon: data.icon || null,
      }
    })

    return NextResponse.json({ favoriet })
  } catch (error) {
    console.error("Favoriet create error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het opslaan" },
      { status: 500 }
    )
  }
}
