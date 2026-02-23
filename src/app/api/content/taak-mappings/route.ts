import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  try {
    // Haal taak-categorie mappings op inclusief de zorgtaak (met taakId)
    const [mappings, contentCategorieen] = await Promise.all([
      prisma.taakCategorieMapping.findMany({
        where: { isActief: true },
        include: {
          zorgtaak: {
            select: { taakId: true, naam: true },
          },
        },
      }),
      // ContentCategorie HULP_ZORGVRAGER bevat de weergavenamen (bijv. "Administratie")
      prisma.contentCategorie.findMany({
        where: { type: "HULP_ZORGVRAGER", isActief: true },
        select: { naam: true, volgorde: true },
        orderBy: { volgorde: "asc" },
      }),
    ])

    // Map taakId (t1, t2, ...) → ContentCategorie naam via volgorde
    // t1=volgorde 1, t2=volgorde 2, etc.
    const taakIdNaarCategorie: Record<string, string> = {}
    for (const cc of contentCategorieen) {
      const taakId = `t${cc.volgorde}`
      taakIdNaarCategorie[taakId] = cc.naam
    }

    // Frontend verwacht { taak: bronNaam, categorie: weergavenaam }
    const formatted = mappings.map(m => ({
      taak: m.bronNaam,
      categorie: taakIdNaarCategorie[m.zorgtaak.taakId] || m.zorgtaak.naam,
    }))

    return NextResponse.json({ mappings: formatted })
  } catch (error) {
    console.error("Taak mappings ophalen mislukt:", error)
    return NextResponse.json(
      { error: "Taak mappings ophalen mislukt" },
      { status: 500 }
    )
  }
}
