/**
 * Publiceer endpoint — /api/beheer/content-werkbank/publiceer
 *
 * Publiceert een artikel in de database met status GEPUBLICEERD.
 * Koppelt tags via ArtikelTag (lookup ContentTag by slug).
 *
 * POST body: { titel, beschrijving, inhoud, categorie, tags: string[] }
 * Returns:   { artikelId: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ADMIN_ROLES = ["ADMIN", "ORG_ADMIN"] as const

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role as (typeof ADMIN_ROLES)[number])) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  try {
    const { titel, beschrijving, inhoud, categorie, tags } = await req.json()

    if (!titel || !beschrijving || !categorie) {
      return NextResponse.json(
        { error: "Titel, beschrijving en categorie zijn vereist" },
        { status: 400 }
      )
    }

    // Maak het artikel aan met status GEPUBLICEERD
    const artikel = await prisma.artikel.create({
      data: {
        titel,
        beschrijving,
        inhoud: inhoud || null,
        categorie,
        status: "GEPUBLICEERD",
        publicatieDatum: new Date(),
        isActief: true,
        aangemaaaktDoor: session.user.id,
      },
    })

    // Koppel tags via ArtikelTag (lookup ContentTag by slug)
    if (Array.isArray(tags) && tags.length > 0) {
      const contentTags = await prisma.contentTag.findMany({
        where: {
          slug: { in: tags },
          isActief: true,
        },
        select: { id: true, slug: true },
      })

      if (contentTags.length > 0) {
        await prisma.artikelTag.createMany({
          data: contentTags.map((tag) => ({
            artikelId: artikel.id,
            tagId: tag.id,
          })),
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json({ artikelId: artikel.id })
  } catch (error) {
    console.error("Publiceer fout:", error)
    return NextResponse.json(
      { error: "Kon artikel niet publiceren" },
      { status: 500 }
    )
  }
}
