import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM, logGemeenteAudit } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    // Gemeenschappelijke where-clause voor alarmen in deze gemeente
    const gemeenteWhere = {
      test: {
        gemeente: { equals: gemeenteNaam, mode: "insensitive" as const },
      },
    }

    // Totaal aantal alarmen voor K-anonimiteit check
    const totaalAlarmen = await prisma.alarmLog.count({
      where: gemeenteWhere,
    })

    if (totaalAlarmen < K_ANONIMITEIT_MINIMUM) {
      return NextResponse.json({
        kAnonimiteit: true,
        minimumNietBereikt: true,
        bericht: `Er zijn nog onvoldoende alarmen (minimaal ${K_ANONIMITEIT_MINIMUM}) in ${gemeenteNaam} voor geanonimiseerde statistieken.`,
        aantalAlarmen: totaalAlarmen,
      })
    }

    // Telling per type
    const typeResults = await prisma.alarmLog.groupBy({
      by: ["type"],
      where: gemeenteWhere,
      _count: { id: true },
    })

    const perType: Record<string, number> = {
      HOGE_BELASTING: 0,
      KRITIEKE_COMBINATIE: 0,
      VEEL_ZORGUREN: 0,
      EMOTIONELE_NOOD: 0,
      SOCIAAL_ISOLEMENT: 0,
      FYSIEKE_KLACHTEN: 0,
    }
    for (const row of typeResults) {
      perType[row.type] = row._count.id
    }

    // Telling per urgentie
    const urgentieResults = await prisma.alarmLog.groupBy({
      by: ["urgentie"],
      where: gemeenteWhere,
      _count: { id: true },
    })

    const perUrgentie: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    }
    for (const row of urgentieResults) {
      perUrgentie[row.urgentie] = row._count.id
    }

    // Telling afgehandeld vs niet-afgehandeld
    const afgehandeld = await prisma.alarmLog.count({
      where: {
        ...gemeenteWhere,
        isAfgehandeld: true,
      },
    })

    const nietAfgehandeld = await prisma.alarmLog.count({
      where: {
        ...gemeenteWhere,
        isAfgehandeld: false,
      },
    })

    // Recente alarmen (afgelopen 30 dagen)
    const dertigDagenGeleden = new Date()
    dertigDagenGeleden.setDate(dertigDagenGeleden.getDate() - 30)

    const recenteAlarmen = await prisma.alarmLog.count({
      where: {
        ...gemeenteWhere,
        createdAt: { gte: dertigDagenGeleden },
      },
    })

    logGemeenteAudit(userId, "BEKEKEN", "Alarmen", { gemeente: gemeenteNaam })

    return NextResponse.json({
      gemeenteNaam,
      totaalAlarmen,
      perType,
      perUrgentie,
      afhandelStatus: {
        afgehandeld,
        nietAfgehandeld,
      },
      recenteAlarmen,
    })
  } catch (err) {
    console.error("Gemeente alarmen error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
