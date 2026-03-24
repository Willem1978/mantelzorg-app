/**
 * Bulk-tagging endpoint — /api/ai/admin/bulk-tag
 *
 * Tagt alle artikelen die nog geen ArtikelTag records hebben.
 * Gebruikt Anthropic Claude Haiku voor snelle analyse.
 */
import { NextResponse } from "next/server"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const maxDuration = 300

export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY niet geconfigureerd" }, { status: 503 })
  }

  try {
    // Haal artikelen op die nog geen tags hebben
    const artikelenZonderTags = await prisma.artikel.findMany({
      where: {
        isActief: true,
        tags: { none: {} },
      },
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        inhoud: true,
        categorie: true,
      },
    })

    if (artikelenZonderTags.length === 0) {
      return NextResponse.json({ message: "Alle artikelen zijn al getagd", getagd: 0 })
    }

    // Haal alle actieve tags op
    const tags = await prisma.contentTag.findMany({
      where: { isActief: true },
      orderBy: [{ type: "asc" }, { volgorde: "asc" }],
      select: { id: true, type: true, slug: true, naam: true },
    })

    const tagLijst = tags.map((t) => `- ${t.type}/${t.slug}: ${t.naam}`).join("\n")
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const resultaten: Array<{ artikelId: string; titel: string; tags: string[] }> = []

    // Verwerk artikelen in batches van 5
    for (let i = 0; i < artikelenZonderTags.length; i += 5) {
      const batch = artikelenZonderTags.slice(i, i + 5)

      const batchResults = await Promise.all(
        batch.map(async (artikel) => {
          const plainInhoud = artikel.inhoud
            ? artikel.inhoud.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800)
            : ""

          try {
            const { text } = await generateText({
              model: anthropic("claude-haiku-4-5-20251001"),
              maxOutputTokens: 200,
              prompt: `Je bent een content-tagger voor een mantelzorg-platform. Analyseer het artikel en kies de meest relevante tags.

ARTIKEL:
Titel: ${artikel.titel}
Beschrijving: ${artikel.beschrijving || ""}
Categorie: ${artikel.categorie || "onbekend"}
${plainInhoud ? `Inhoud (fragment): ${plainInhoud}` : ""}

BESCHIKBARE TAGS:
${tagLijst}

Kies 2-5 tags die het beste passen. Kies MINSTENS 1 zorgthema (ZORGTHEMA/) als het artikel over een specifiek zorgthema gaat.
Antwoord ALLEEN met de slugs, gescheiden door komma's. Geen uitleg.`,
            })

            const gesuggeerdeSlugs = text
              .split(",")
              .map((s) => s.trim().toLowerCase().replace(/^.*\//, ""))
              .filter(Boolean)

            const gevondenTags = tags.filter((t) => gesuggeerdeSlugs.includes(t.slug))

            if (gevondenTags.length > 0) {
              await prisma.artikelTag.createMany({
                data: gevondenTags.map((t) => ({
                  artikelId: artikel.id,
                  tagId: t.id,
                })),
                skipDuplicates: true,
              })
            }

            return {
              artikelId: artikel.id,
              titel: artikel.titel,
              tags: gevondenTags.map((t) => t.slug),
            }
          } catch (error) {
            console.error(`[Bulk-tag] Fout bij artikel "${artikel.titel}":`, error)
            return {
              artikelId: artikel.id,
              titel: artikel.titel,
              tags: [] as string[],
            }
          }
        })
      )

      resultaten.push(...batchResults)
    }

    const getagd = resultaten.filter((r) => r.tags.length > 0).length

    return NextResponse.json({
      message: `${getagd} van ${artikelenZonderTags.length} artikelen getagd`,
      getagd,
      totaal: artikelenZonderTags.length,
      resultaten,
    })
  } catch (error) {
    console.error("[Bulk-tag] Fout:", error)
    return NextResponse.json({ error: "Bulk-tagging mislukt" }, { status: 500 })
  }
}
