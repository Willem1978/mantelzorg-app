import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/beheer/content-werkbank — alle artikelen met status en tags
export async function GET() {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const artikelen = await prisma.artikel.findMany({
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      categorie: true,
      status: true,
      emoji: true,
      updatedAt: true,
      tags: {
        select: {
          tag: { select: { naam: true, slug: true } },
        },
      },
      _count: {
        select: { interacties: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ artikelen })
}

// PATCH /api/beheer/content-werkbank — verplaats artikel naar andere status
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const { artikelId, status } = await req.json()

  if (!artikelId || !status) {
    return NextResponse.json({ error: "artikelId en status zijn vereist" }, { status: 400 })
  }

  const validStatussen = ["VOORSTEL", "CONCEPT", "HERSCHREVEN", "VERRIJKT", "GEPUBLICEERD", "GEARCHIVEERD"]
  if (!validStatussen.includes(status)) {
    return NextResponse.json({ error: "Ongeldige status" }, { status: 400 })
  }

  const artikel = await prisma.artikel.update({
    where: { id: artikelId },
    data: {
      status,
      // Bij publicatie: publicatieDatum instellen
      ...(status === "GEPUBLICEERD" ? { publicatieDatum: new Date(), isActief: true } : {}),
      // Bij archiveren: deactiveren
      ...(status === "GEARCHIVEERD" ? { isActief: false } : {}),
    },
  })

  return NextResponse.json({ artikel })
}
