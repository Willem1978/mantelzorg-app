import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM } from "@/lib/gemeente-auth"

// GET: Genereer een CSV-rapportage met geanonimiseerde data
export async function GET(request: Request) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format") || "json"

  try {
    // Tel mantelzorgers
    const totalCaregivers = await prisma.caregiver.count({
      where: {
        OR: [
          { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
          { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" } },
        ],
      },
    })

    if (totalCaregivers < K_ANONIMITEIT_MINIMUM) {
      return NextResponse.json({
        kAnonimiteit: true,
        bericht: `Onvoldoende gebruikers voor rapportage (minimaal ${K_ANONIMITEIT_MINIMUM}).`,
      })
    }

    // Haal alle voltooide tests op
    const tests = await prisma.belastbaarheidTest.findMany({
      where: {
        isCompleted: true,
        gemeente: { equals: gemeenteNaam, mode: "insensitive" },
      },
      select: {
        totaleBelastingScore: true,
        belastingNiveau: true,
        totaleZorguren: true,
        completedAt: true,
      },
      orderBy: { completedAt: "desc" },
    })

    // Alarmen
    const alarmen = await prisma.alarmLog.groupBy({
      by: ["type"],
      _count: true,
      where: {
        test: { gemeente: { equals: gemeenteNaam, mode: "insensitive" } },
      },
    })

    // Audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          actie: "EXPORT",
          entiteit: "Rapportage",
          details: { format, gemeente: gemeenteNaam },
        },
      })
    }

    if (format === "csv") {
      // Genereer CSV
      const csvHeaders = "Maand,Aantal Tests,Gemiddelde Score,Niveau Laag,Niveau Gemiddeld,Niveau Hoog,Gem. Zorguren"
      const maandData = new Map<string, { count: number; scoreSum: number; uren: number; laag: number; gemiddeld: number; hoog: number }>()

      for (const test of tests) {
        const maand = test.completedAt
          ? `${test.completedAt.getFullYear()}-${String(test.completedAt.getMonth() + 1).padStart(2, "0")}`
          : "onbekend"

        const entry = maandData.get(maand) || { count: 0, scoreSum: 0, uren: 0, laag: 0, gemiddeld: 0, hoog: 0 }
        entry.count++
        entry.scoreSum += test.totaleBelastingScore
        entry.uren += test.totaleZorguren
        if (test.belastingNiveau === "LAAG") entry.laag++
        else if (test.belastingNiveau === "GEMIDDELD") entry.gemiddeld++
        else entry.hoog++
        maandData.set(maand, entry)
      }

      const csvRows = Array.from(maandData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([maand, d]) => `${maand},${d.count},${(d.scoreSum / d.count).toFixed(1)},${d.laag},${d.gemiddeld},${d.hoog},${(d.uren / d.count).toFixed(0)}`)

      const csv = [csvHeaders, ...csvRows].join("\n")

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="mantelbuddy-${gemeenteNaam}-rapportage.csv"`,
        },
      })
    }

    // JSON format
    return NextResponse.json({
      gemeenteNaam,
      periode: "Alle beschikbare data",
      totaalTests: tests.length,
      totaalMantelzorgers: totalCaregivers,
      niveauVerdeling: {
        laag: tests.filter(t => t.belastingNiveau === "LAAG").length,
        gemiddeld: tests.filter(t => t.belastingNiveau === "GEMIDDELD").length,
        hoog: tests.filter(t => t.belastingNiveau === "HOOG").length,
      },
      alarmen: alarmen.map(a => ({ type: a.type, aantal: a._count })),
    })
  } catch (err) {
    console.error("Rapportage error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
