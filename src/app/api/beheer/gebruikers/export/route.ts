import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const gebruikers = await prisma.user.findMany({
      include: {
        caregiver: {
          include: {
            belastbaarheidTests: {
              where: { isCompleted: true },
              orderBy: { completedAt: "desc" },
              take: 1,
              select: {
                totaleBelastingScore: true,
                belastingNiveau: true,
                completedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // CSV header
    const header = [
      "Naam",
      "Email",
      "Rol",
      "Gemeente",
      "Telefoon",
      "Status",
      "Onboarding",
      "Zorguren/week",
      "Laatste test score",
      "Belastingniveau",
      "Laatste test datum",
      "Geregistreerd",
    ].join(";")

    const rolLabels: Record<string, string> = {
      CAREGIVER: "Mantelzorger",
      BUDDY: "MantelBuddy",
      ORG_MEMBER: "Organisatie",
      ORG_ADMIN: "Org. Admin",
      ADMIN: "Beheerder",
    }

    const rows = gebruikers.map((g) => {
      const test = g.caregiver?.belastbaarheidTests?.[0]
      return [
        g.name || "",
        g.email,
        rolLabels[g.role] || g.role,
        g.caregiver?.municipality || "",
        g.caregiver?.phoneNumber || "",
        g.isActive ? "Actief" : "Inactief",
        g.caregiver?.onboardedAt ? "Ja" : "Nee",
        g.caregiver?.careHoursPerWeek?.toString() || "",
        test?.totaleBelastingScore?.toString() || "",
        test?.belastingNiveau || "",
        test?.completedAt ? new Date(test.completedAt).toLocaleDateString("nl-NL") : "",
        new Date(g.createdAt).toLocaleDateString("nl-NL"),
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(";")
    })

    const csv = "\uFEFF" + [header, ...rows].join("\n")

    await logAudit({
      userId: session.user.id!,
      actie: "EXPORT",
      entiteit: "User",
      details: { aantal: gebruikers.length, formaat: "CSV" },
    })

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gebruikers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export mislukt:", error)
    return NextResponse.json({ error: "Export mislukt" }, { status: 500 })
  }
}
