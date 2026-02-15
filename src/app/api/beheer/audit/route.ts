import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const entiteit = searchParams.get("entiteit") || ""
  const actie = searchParams.get("actie") || ""
  const pagina = parseInt(searchParams.get("pagina") || "1")
  const perPagina = 50

  try {
    const where: any = {}
    if (entiteit) where.entiteit = entiteit
    if (actie) where.actie = actie

    const [logs, totaal] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * perPagina,
        take: perPagina,
      }),
      prisma.auditLog.count({ where }),
    ])

    // Haal gebruikersnamen op
    const userIds = [...new Set(logs.map((l) => l.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    })
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

    const logsMetGebruiker = logs.map((log) => ({
      ...log,
      gebruiker: userMap[log.userId] || { name: "Onbekend", email: "onbekend" },
    }))

    return NextResponse.json({
      logs: logsMetGebruiker,
      totaal,
      totaalPaginas: Math.ceil(totaal / perPagina),
    })
  } catch (error) {
    console.error("Audit logs ophalen mislukt:", error)
    return NextResponse.json({ error: "Audit logs ophalen mislukt" }, { status: 500 })
  }
}
