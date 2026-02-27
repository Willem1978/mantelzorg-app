import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  generateEmbedding,
  generateEmbeddings,
  artikelToEmbeddingText,
  zorgorganisatieToEmbeddingText,
  toVectorSql,
} from "@/lib/ai/embeddings"

// Langere timeout voor batch embedding generatie
export const maxDuration = 300

/**
 * POST /api/ai/embeddings
 *
 * Genereer en sla embeddings op voor Artikelen en/of Zorgorganisaties.
 * Alleen toegankelijk voor ADMIN gebruikers.
 *
 * Body:
 *   { type: "artikelen" | "zorgorganisaties" | "all", force?: boolean }
 *
 * - type: welke content embedden
 * - force: true = herbereken alle embeddings, false = alleen missende
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is niet geconfigureerd" },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const type = body.type || "all"
    const force = body.force === true

    const results: { artikelen?: number; zorgorganisaties?: number } = {}

    if (type === "artikelen" || type === "all") {
      results.artikelen = await embedArtikelen(force)
    }

    if (type === "zorgorganisaties" || type === "all") {
      results.zorgorganisaties = await embedZorgorganisaties(force)
    }

    return NextResponse.json({
      success: true,
      message: "Embeddings gegenereerd",
      ...results,
    })
  } catch (error) {
    console.error("[Embeddings] Fout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Onbekende fout" },
      { status: 500 }
    )
  }
}

/**
 * Genereer embeddings voor alle actieve artikelen.
 */
async function embedArtikelen(force: boolean): Promise<number> {
  // Haal artikelen op die een embedding nodig hebben
  const artikelen = await prisma.artikel.findMany({
    where: { isActief: true },
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      inhoud: true,
      categorie: true,
    },
  })

  if (!force) {
    // Filter alleen artikelen zonder embedding
    const idsWithEmbedding = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Artikel" WHERE embedding IS NOT NULL AND "isActief" = true
    `
    const embeddedIds = new Set(idsWithEmbedding.map((r) => r.id))
    const toEmbed = artikelen.filter((a) => !embeddedIds.has(a.id))
    return await processArtikelBatch(toEmbed)
  }

  return await processArtikelBatch(artikelen)
}

async function processArtikelBatch(
  artikelen: { id: string; titel: string; beschrijving: string; inhoud: string | null; categorie: string }[]
): Promise<number> {
  if (artikelen.length === 0) return 0

  const texts = artikelen.map((a) => artikelToEmbeddingText(a))
  const embeddings = await generateEmbeddings(texts)

  for (let i = 0; i < artikelen.length; i++) {
    const vectorSql = toVectorSql(embeddings[i])
    await prisma.$executeRawUnsafe(
      `UPDATE "Artikel" SET embedding = $1::vector WHERE id = $2`,
      vectorSql,
      artikelen[i].id
    )
  }

  return artikelen.length
}

/**
 * Genereer embeddings voor alle actieve zorgorganisaties.
 */
async function embedZorgorganisaties(force: boolean): Promise<number> {
  const orgs = await prisma.zorgorganisatie.findMany({
    where: { isActief: true },
    select: {
      id: true,
      naam: true,
      beschrijving: true,
      dienst: true,
      soortHulp: true,
      onderdeelTest: true,
      gemeente: true,
      doelgroep: true,
    },
  })

  if (!force) {
    const idsWithEmbedding = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Zorgorganisatie" WHERE embedding IS NOT NULL AND "isActief" = true
    `
    const embeddedIds = new Set(idsWithEmbedding.map((r) => r.id))
    const toEmbed = orgs.filter((o) => !embeddedIds.has(o.id))
    return await processOrgBatch(toEmbed)
  }

  return await processOrgBatch(orgs)
}

async function processOrgBatch(
  orgs: { id: string; naam: string; beschrijving: string | null; dienst: string | null; soortHulp: string | null; onderdeelTest: string | null; gemeente: string | null; doelgroep: string | null }[]
): Promise<number> {
  if (orgs.length === 0) return 0

  const texts = orgs.map((o) => zorgorganisatieToEmbeddingText(o))
  const embeddings = await generateEmbeddings(texts)

  for (let i = 0; i < orgs.length; i++) {
    const vectorSql = toVectorSql(embeddings[i])
    await prisma.$executeRawUnsafe(
      `UPDATE "Zorgorganisatie" SET embedding = $1::vector WHERE id = $2`,
      vectorSql,
      orgs[i].id
    )
  }

  return orgs.length
}
