import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Lichtgewicht endpoint: alleen landelijke hulpbronnen (zorgorganisaties zonder gemeente)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const landelijk = await prisma.zorgorganisatie.findMany({
      where: {
        isActief: true,
        gemeente: null,
      },
      orderBy: { naam: 'asc' },
      select: {
        naam: true,
        telefoon: true,
        website: true,
        beschrijving: true,
        soortHulp: true,
        dienst: true,
        openingstijden: true,
        kosten: true,
        bronLabel: true,
        doelgroep: true,
      },
    })

    return NextResponse.json({ landelijk })
  } catch (error) {
    console.error("Fout bij ophalen landelijke hulpbronnen:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
