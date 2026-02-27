/**
 * Utility om embeddings automatisch te genereren na content-wijzigingen.
 *
 * Gebruik in admin API routes:
 *   await embedArtikelAsync(artikelId)
 *   await embedZorgorganisatieAsync(orgId)
 *
 * De embedding wordt async gegenereerd (fire-and-forget) zodat
 * de admin-response niet vertraagd wordt.
 */
import { prisma } from "@/lib/prisma"
import {
  generateEmbedding,
  artikelToEmbeddingText,
  zorgorganisatieToEmbeddingText,
  toVectorSql,
} from "@/lib/ai/embeddings"

/**
 * Genereer en sla een embedding op voor een artikel.
 * Fire-and-forget: fouten worden gelogd maar niet gegooid.
 */
export function embedArtikelAsync(artikelId: string): void {
  if (!process.env.OPENAI_API_KEY) return

  // Fire-and-forget
  doEmbedArtikel(artikelId).catch((err) =>
    console.error(`[Embedding] Artikel ${artikelId} mislukt:`, err)
  )
}

async function doEmbedArtikel(artikelId: string): Promise<void> {
  const artikel = await prisma.artikel.findUnique({
    where: { id: artikelId },
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      inhoud: true,
      categorie: true,
      isActief: true,
    },
  })

  if (!artikel || !artikel.isActief) return

  const text = artikelToEmbeddingText(artikel)
  const embedding = await generateEmbedding(text)
  const vectorSql = toVectorSql(embedding)

  await prisma.$executeRawUnsafe(
    `UPDATE "Artikel" SET embedding = $1::vector WHERE id = $2`,
    vectorSql,
    artikelId
  )
}

/**
 * Genereer en sla een embedding op voor een zorgorganisatie.
 * Fire-and-forget: fouten worden gelogd maar niet gegooid.
 */
export function embedZorgorganisatieAsync(orgId: string): void {
  if (!process.env.OPENAI_API_KEY) return

  doEmbedZorgorganisatie(orgId).catch((err) =>
    console.error(`[Embedding] Zorgorganisatie ${orgId} mislukt:`, err)
  )
}

async function doEmbedZorgorganisatie(orgId: string): Promise<void> {
  const org = await prisma.zorgorganisatie.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      naam: true,
      beschrijving: true,
      dienst: true,
      soortHulp: true,
      onderdeelTest: true,
      gemeente: true,
      doelgroep: true,
      isActief: true,
    },
  })

  if (!org || !org.isActief) return

  const text = zorgorganisatieToEmbeddingText(org)
  const embedding = await generateEmbedding(text)
  const vectorSql = toVectorSql(embedding)

  await prisma.$executeRawUnsafe(
    `UPDATE "Zorgorganisatie" SET embedding = $1::vector WHERE id = $2`,
    vectorSql,
    orgId
  )
}
