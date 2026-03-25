import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/beheer/content-werkbank/ai-actie — inline AI acties op artikelen
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const { artikelId, actie } = await req.json()

  if (!artikelId || !actie) {
    return NextResponse.json({ error: "artikelId en actie zijn vereist" }, { status: 400 })
  }

  const artikel = await prisma.artikel.findUnique({
    where: { id: artikelId },
    include: { tags: { include: { tag: true } } },
  })

  if (!artikel) {
    return NextResponse.json({ error: "Artikel niet gevonden" }, { status: 404 })
  }

  // Stuur door naar de bestaande content-agent endpoint
  // Dit is een proxy die de juiste actie triggert
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000"

  if (actie === "herschrijf") {
    // Trigger B1 herschrijving via curator
    const res = await fetch(`${baseUrl}/api/ai/admin/curator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({ type: "b1check", artikelId }),
    })
    const data = await res.json()
    return NextResponse.json({ succes: true, resultaat: data })
  }

  if (actie === "verrijk") {
    // Trigger verrijking via content-agent
    const res = await fetch(`${baseUrl}/api/ai/admin/content-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({ stap: "verrijken", artikelId }),
    })
    const data = await res.json()
    return NextResponse.json({ succes: true, resultaat: data })
  }

  if (actie === "tags") {
    // Trigger tag-suggesties via bulk-tag endpoint
    const res = await fetch(`${baseUrl}/api/ai/admin/bulk-tag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({ artikelIds: [artikelId] }),
    })
    const data = await res.json()
    return NextResponse.json({ succes: true, resultaat: data })
  }

  return NextResponse.json({ error: "Onbekende actie" }, { status: 400 })
}
