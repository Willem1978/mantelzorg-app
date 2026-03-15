import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateEmbedding, toVectorSql } from "@/lib/ai/embeddings"

export const maxDuration = 30

interface SearchResult {
  id: string
  bronType: "artikel" | "hulpbron"
  titel: string
  beschrijving: string | null
  relevantie: string | null
  extraInfo: Record<string, unknown>
}

interface SemanticRow {
  id: string
  bronType: "artikel" | "hulpbron"
  titel: string
  beschrijving: string | null
  similarity: number
  extraInfo: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()
  const gemeente =
    searchParams.get("gemeente") || session.user.gemeenteNaam || null
  const type = searchParams.get("type") || "all"

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Zoekterm moet minimaal 2 tekens zijn" },
      { status: 400 }
    )
  }

  if (!["all", "artikelen", "hulpbronnen"].includes(type)) {
    return NextResponse.json(
      { error: "Ongeldig type. Kies uit: all, artikelen, hulpbronnen" },
      { status: 400 }
    )
  }

  try {
    const semanticResults = await trySemanticSearch(q, gemeente, type)
    if (semanticResults) {
      return NextResponse.json(semanticResults)
    }
  } catch (error) {
    console.warn("[Search API] Semantisch zoeken mislukt, fallback naar tekst:", error)
  }

  const textResults = await textSearch(q, gemeente, type)
  return NextResponse.json(textResults)
}

async function trySemanticSearch(
  q: string,
  gemeente: string | null,
  type: string
): Promise<{ resultaten: SearchResult[]; methode: string; aantal: number } | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  const embedding = await generateEmbedding(q)
  const vectorSql = toVectorSql(embedding)

  const rows = await prisma.$queryRawUnsafe<SemanticRow[]>(
    `SELECT * FROM semantic_search($1::vector, $2, $3, $4, $5)`,
    vectorSql,
    0.3,
    20,
    gemeente,
    type
  )

  if (!rows || rows.length === 0) {
    return null
  }

  const resultaten: SearchResult[] = rows.map((r) => ({
    id: r.id,
    bronType: r.bronType,
    titel: r.titel,
    beschrijving: r.beschrijving,
    relevantie: Math.round(r.similarity * 100) + "%",
    extraInfo: r.extraInfo ?? {},
  }))

  return { resultaten, methode: "semantisch", aantal: resultaten.length }
}

async function textSearch(
  q: string,
  gemeente: string | null,
  type: string
): Promise<{ resultaten: SearchResult[]; methode: string; aantal: number }> {
  const resultaten: SearchResult[] = []

  if (type === "all" || type === "artikelen") {
    const artikelen = await prisma.artikel.findMany({
      where: {
        isActief: true,
        status: "GEPUBLICEERD",
        OR: [
          { titel: { contains: q, mode: "insensitive" } },
          { beschrijving: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        emoji: true,
        categorie: true,
      },
    })

    resultaten.push(
      ...artikelen.map((a) => ({
        id: a.id,
        bronType: "artikel" as const,
        titel: a.titel,
        beschrijving: a.beschrijving,
        relevantie: null,
        extraInfo: {
          categorie: a.categorie,
          emoji: a.emoji,
        },
      }))
    )
  }

  if (type === "all" || type === "hulpbronnen") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgWhere: Record<string, any> = {
      isActief: true,
      OR: [
        { naam: { contains: q, mode: "insensitive" } },
        { beschrijving: { contains: q, mode: "insensitive" } },
        { dienst: { contains: q, mode: "insensitive" } },
      ],
    }

    if (gemeente) {
      orgWhere.AND = [
        {
          OR: [{ gemeente }, { gemeente: null }],
        },
      ]
    }

    const orgs = await prisma.zorgorganisatie.findMany({
      where: orgWhere,
      take: 20,
      select: {
        id: true,
        naam: true,
        beschrijving: true,
        telefoon: true,
        website: true,
        email: true,
      },
    })

    resultaten.push(
      ...orgs.map((o) => ({
        id: o.id,
        bronType: "hulpbron" as const,
        titel: o.naam,
        beschrijving: o.beschrijving,
        relevantie: null,
        extraInfo: {
          telefoon: o.telefoon,
          website: o.website,
          email: o.email,
        },
      }))
    )
  }

  return { resultaten, methode: "tekstzoek", aantal: resultaten.length }
}
