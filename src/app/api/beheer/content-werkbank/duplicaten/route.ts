import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/beheer/content-werkbank/duplicaten — check voor duplicaten op basis van titel/beschrijving
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const { titel, beschrijving, excludeId } = await req.json()

  if (!titel) {
    return NextResponse.json({ error: "titel is vereist" }, { status: 400 })
  }

  const zoekTekst = `${titel} ${beschrijving || ""}`.toLowerCase()

  // Stap 1: Zoek op vector similarity als embedding beschikbaar is
  let vectorMatches: { id: string; titel: string; categorie: string; similarity: number }[] = []

  try {
    // Genereer embedding voor de zoektekst
    const { generateEmbedding } = await import("@/lib/ai/embeddings")
    const embedding = await generateEmbedding(zoekTekst)

    if (embedding) {
      const vectorSql = `[${embedding.join(",")}]`
      // S3: Gescheiden queries voor met/zonder excludeId — voorkomt nested $queryRaw interpolatie
      const results = excludeId
        ? await prisma.$queryRaw<
            { id: string; titel: string; categorie: string; similarity: number }[]
          >`
            SELECT id, titel, categorie,
              1 - (embedding <=> ${vectorSql}::vector) as similarity
            FROM "Artikel"
            WHERE embedding IS NOT NULL
              AND "isActief" = true
              AND id != ${excludeId}
            ORDER BY embedding <=> ${vectorSql}::vector
            LIMIT 5
          `
        : await prisma.$queryRaw<
            { id: string; titel: string; categorie: string; similarity: number }[]
          >`
            SELECT id, titel, categorie,
              1 - (embedding <=> ${vectorSql}::vector) as similarity
            FROM "Artikel"
            WHERE embedding IS NOT NULL
              AND "isActief" = true
            ORDER BY embedding <=> ${vectorSql}::vector
            LIMIT 5
          `
      vectorMatches = results
        .filter(r => r.similarity > 0.85)
        .map(r => ({
          ...r,
          similarity: Math.round(r.similarity * 100),
        }))
    }
  } catch {
    // Vector search niet beschikbaar, val terug op tekst
  }

  // Stap 2: Fallback — zoek op woordovereenkomst in titel
  if (vectorMatches.length === 0) {
    const woorden = titel.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)

    if (woorden.length > 0) {
      const alleArtikelen = await prisma.artikel.findMany({
        where: {
          isActief: true,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true, titel: true, categorie: true },
      })

      vectorMatches = alleArtikelen
        .map(a => {
          const titelLower = a.titel.toLowerCase()
          const matchCount = woorden.filter((w: string) => titelLower.includes(w)).length
          const similarity = Math.round((matchCount / woorden.length) * 100)
          return { ...a, similarity }
        })
        .filter(a => a.similarity >= 60)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
    }
  }

  return NextResponse.json({
    duplicaten: vectorMatches,
    heeftDuplicaten: vectorMatches.length > 0,
  })
}
