import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM, logGemeenteAudit } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
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

    // Onbeantwoorde hulpvragen: OPEN en ouder dan 7 dagen
    const zevenDagenGeleden = new Date()
    zevenDagenGeleden.setDate(zevenDagenGeleden.getDate() - 7)

    const onbeantwoord = await prisma.helpRequest.count({
      where: {
        ...gemeenteWhere,
        status: "OPEN",
        createdAt: { lt: zevenDagenGeleden },
      },
    })

    // Gemiddelde reactietijd in dagen (voor RESPONDED en RESOLVED hulpvragen met respondedAt)
    const beantwoordeHulpvragen = await prisma.helpRequest.findMany({
      where: {
        ...gemeenteWhere,
        status: { in: ["RESPONDED", "RESOLVED"] },
        respondedAt: { not: null },
      },
      select: {
        createdAt: true,
        respondedAt: true,
      },
    })

    let gemiddeldeReactietijd: number | null = null
    if (beantwoordeHulpvragen.length > 0) {
      const totaalDagen = beantwoordeHulpvragen.reduce((sum, hr) => {
        const diffMs = new Date(hr.respondedAt!).getTime() - new Date(hr.createdAt).getTime()
        const diffDagen = diffMs / (1000 * 60 * 60 * 24)
        return sum + diffDagen
      }, 0)
      gemiddeldeReactietijd = Math.round((totaalDagen / beantwoordeHulpvragen.length) * 10) / 10
    }

    // Top 5 organisaties op basis van aantal hulpvragen
    const organisatieResults = await prisma.helpRequest.groupBy({
      by: ["organisationId"],
      where: {
        ...gemeenteWhere,
        organisationId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    })

    const organisatieIds = organisatieResults.map((r) => r.organisationId!).filter(Boolean)
    const organisaties = organisatieIds.length > 0
      ? await prisma.organisation.findMany({
          where: { id: { in: organisatieIds } },
          select: { id: true, name: true },
        })
      : []

    const organisatieNaamMap = new Map(organisaties.map((o) => [o.id, o.name]))
    const topOrganisaties = organisatieResults.map((r) => ({
      naam: organisatieNaamMap.get(r.organisationId!) ?? "Onbekend",
      aantal: r._count.id,
    }))

    // Recente trend: hulpvragen afgelopen 30 dagen vs vorige 30 dagen
    const nu = new Date()
    const dertigDagenGeleden = new Date()
    dertigDagenGeleden.setDate(nu.getDate() - 30)
    const zestigDagenGeleden = new Date()
    zestigDagenGeleden.setDate(nu.getDate() - 60)

    const [huidige30Dagen, vorige30Dagen] = await Promise.all([
      prisma.helpRequest.count({
        where: {
          ...gemeenteWhere,
          createdAt: { gte: dertigDagenGeleden },
        },
      }),
      prisma.helpRequest.count({
        where: {
          ...gemeenteWhere,
          createdAt: { gte: zestigDagenGeleden, lt: dertigDagenGeleden },
        },
      }),
    ])

    const trend: "stijgend" | "dalend" | "stabiel" =
      huidige30Dagen > vorige30Dagen
        ? "stijgend"
        : huidige30Dagen < vorige30Dagen
          ? "dalend"
          : "stabiel"

    const recenteTrend = { huidige30Dagen, vorige30Dagen, trend }

    logGemeenteAudit(userId, "BEKEKEN", "Hulpvragen", { gemeente: gemeenteNaam })

    return NextResponse.json({
      gemeenteNaam,
      totaalHulpvragen,
      perCategorie,
      perStatus,
      perUrgentie,
      onbeantwoord,
      gemiddeldeReactietijd,
      topOrganisaties,
      recenteTrend,
    })
  } catch (err) {
    console.error("Gemeente hulpvragen error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
