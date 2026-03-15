import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  generateEmbeddings,
  artikelToEmbeddingText,
  zorgorganisatieToEmbeddingText,
  toVectorSql,
} from "@/lib/ai/embeddings"

export const maxDuration = 300

const BATCH_SIZE = 50

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY niet geconfigureerd" },
      { status: 503 }
    )
  }

  try {
    const artikelenCount = await embedArtikelen()
    const zorgorganisatiesCount = await embedZorgorganisaties()

    return NextResponse.json({
      success: true,
      message: "Embeddings gegenereerd",
      artikelen: artikelenCount,
      zorgorganisaties: zorgorganisatiesCount,
    })
  } catch (error) {
    console.error("[Cron Embeddings] Fout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Onbekende fout" },
      { status: 500 }
    )
  }
}

async function embedArtikelen(): Promise<number> {
  const artikelen = await prisma.$queryRaw<
    { id: string; titel: string; beschrijving: string; inhoud: string | null; categorie: string }[]
  >`
    SELECT id, titel, beschrijving, inhoud, categorie
    FROM "Artikel"
    WHERE embedding IS NULL AND "isActief" = true
  `

  if (artikelen.length === 0) return 0

  let processed = 0

  for (let i = 0; i < artikelen.length; i += BATCH_SIZE) {
    const batch = artikelen.slice(i, i + BATCH_SIZE)
    const texts = batch.map((a) => artikelToEmbeddingText(a))
    const embeddings = await generateEmbeddings(texts)

    for (let j = 0; j < batch.length; j++) {
      const vectorSql = toVectorSql(embeddings[j])
      await prisma.$executeRawUnsafe(
        `UPDATE "Artikel" SET embedding = $1::vector WHERE id = $2`,
        vectorSql,
        batch[j].id
      )
    }

    processed += batch.length
  }

  return processed
}

async function embedZorgorganisaties(): Promise<number> {
  const orgs = await prisma.$queryRaw<
    {
      id: string
      naam: string
      beschrijving: string | null
      dienst: string | null
      soortHulp: string | null
      onderdeelTest: string | null
      gemeente: string | null
      doelgroep: string | null
    }[]
  >`
    SELECT id, naam, beschrijving, dienst, "soortHulp", "onderdeelTest", gemeente, doelgroep
    FROM "Zorgorganisatie"
    WHERE embedding IS NULL AND "isActief" = true
  `

  if (orgs.length === 0) return 0

  let processed = 0

  for (let i = 0; i < orgs.length; i += BATCH_SIZE) {
    const batch = orgs.slice(i, i + BATCH_SIZE)
    const texts = batch.map((o) => zorgorganisatieToEmbeddingText(o))
    const embeddings = await generateEmbeddings(texts)

    for (let j = 0; j < batch.length; j++) {
      const vectorSql = toVectorSql(embeddings[j])
      await prisma.$executeRawUnsafe(
        `UPDATE "Zorgorganisatie" SET embedding = $1::vector WHERE id = $2`,
        vectorSql,
        orgs[j].id
      )
    }

    processed += batch.length
  }

  return processed
}
