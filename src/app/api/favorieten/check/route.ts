import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Bulk check welke items al favoriet zijn
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ favorited: {} })
    }

    const body = await request.json()
    const items: { type: string; itemId: string }[] = body.items || []

    if (items.length === 0) {
      return NextResponse.json({ favorited: {} })
    }

    // Haal alle favorieten op voor deze gebruiker die matchen
    const favorieten = await prisma.favoriet.findMany({
      where: {
        caregiverId: session.user.caregiverId,
        OR: items.map(item => ({
          type: item.type as "HULP" | "INFORMATIE",
          itemId: item.itemId,
        })),
      },
      select: { id: true, type: true, itemId: true },
    })

    // Maak lookup object: "TYPE:itemId" -> favorietId
    const favorited: Record<string, string> = {}
    for (const fav of favorieten) {
      favorited[`${fav.type}:${fav.itemId}`] = fav.id
    }

    return NextResponse.json({ favorited })
  } catch (error) {
    console.error("Favorieten check error:", error)
    return NextResponse.json({ favorited: {} })
  }
}
