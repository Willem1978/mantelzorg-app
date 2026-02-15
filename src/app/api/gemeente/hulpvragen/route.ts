import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam } = await getGemeenteSession()
  if (error) return error

  try {
    // Gemeenschappelijke where-clause voor hulpvragen in deze gemeente
    const gemeenteWhere = {
      caregiver: {
        OR: [
          { municipality: { equals: gemeenteNaam, mode: "insensitive" as const } },
          { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" as const } },
        ],
      },
    }

    // Totaal aantal hulpvragen voor K-anonimiteit check
    const totaalHulpvragen = await prisma.helpRequest.count({
      where: gemeenteWhere,
    })

    if (totaalHulpvragen < K_ANONIMITEIT_MINIMUM) {
      return NextResponse.json({
        kAnonimiteit: true,
        minimumNietBereikt: true,
        bericht: `Er zijn nog onvoldoende hulpvragen (minimaal ${K_ANONIMITEIT_MINIMUM}) in ${gemeenteNaam} voor geanonimiseerde statistieken.`,
        aantalHulpvragen: totaalHulpvragen,
      })
    }

    // Telling per categorie
    const categorieResults = await prisma.helpRequest.groupBy({
      by: ["category"],
      where: gemeenteWhere,
      _count: { id: true },
    })

    const perCategorie: Record<string, number> = {
      RESPITE_CARE: 0,
      EMOTIONAL_SUPPORT: 0,
      PRACTICAL_HELP: 0,
      FINANCIAL_ADVICE: 0,
      INFORMATION: 0,
      OTHER: 0,
    }
    for (const row of categorieResults) {
      perCategorie[row.category] = row._count.id
    }

    // Telling per status
    const statusResults = await prisma.helpRequest.groupBy({
      by: ["status"],
      where: gemeenteWhere,
      _count: { id: true },
    })

    const perStatus: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESPONDED: 0,
      RESOLVED: 0,
      CLOSED: 0,
    }
    for (const row of statusResults) {
      perStatus[row.status] = row._count.id
    }

    // Telling per urgentie
    const urgentieResults = await prisma.helpRequest.groupBy({
      by: ["urgency"],
      where: gemeenteWhere,
      _count: { id: true },
    })

    const perUrgentie: Record<string, number> = {
      LOW: 0,
      NORMAL: 0,
      HIGH: 0,
      URGENT: 0,
    }
    for (const row of urgentieResults) {
      perUrgentie[row.urgency] = row._count.id
    }

    return NextResponse.json({
      gemeenteNaam,
      totaalHulpvragen,
      perCategorie,
      perStatus,
      perUrgentie,
    })
  } catch (err) {
    console.error("Gemeente hulpvragen error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
