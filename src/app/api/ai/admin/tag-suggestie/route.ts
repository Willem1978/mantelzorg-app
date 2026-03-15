/**
 * Tag-suggestie endpoint — /api/ai/admin/tag-suggestie
 *
 * Analyseert artikeltekst en suggereert relevante ContentTags.
 * Gebruikt Anthropic Claude voor analyse.
 */
import { NextResponse } from "next/server"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const maxDuration = 30

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY niet geconfigureerd" }, { status: 503 })
  }

  try {
    const { titel, beschrijving, inhoud, categorie } = await req.json()

    if (!titel && !beschrijving) {
      return NextResponse.json({ error: "Titel of beschrijving verplicht" }, { status: 400 })
    }

    // Haal alle beschikbare tags op
    const tags = await prisma.contentTag.findMany({
      where: { isActief: true },
      orderBy: [{ type: "asc" }, { volgorde: "asc" }],
      select: { id: true, type: true, slug: true, naam: true },
    })

    const tagLijst = tags.map((t) => `- ${t.type}/${t.slug}: ${t.naam}`).join("\n")

    // Strip HTML uit inhoud
    const plainInhoud = inhoud
      ? inhoud.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000)
      : ""

    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      maxOutputTokens: 500,
      prompt: `Je bent een content-tagger voor een mantelzorg-platform. Analyseer het artikel en kies de meest relevante tags.

ARTIKEL:
Titel: ${titel}
Beschrijving: ${beschrijving}
Categorie: ${categorie || "onbekend"}
${plainInhoud ? `Inhoud (fragment): ${plainInhoud}` : ""}

BESCHIKBARE TAGS:
${tagLijst}

Kies 2-6 tags die het beste passen bij dit artikel. Antwoord ALLEEN met de slugs, gescheiden door komma's. Geen uitleg.
Voorbeeld: dementie,werkend,overbelasting`,
    })

    // Parse gesuggereerde slugs en map naar tag IDs
    const gesuggeerdeSlugs = text
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    const gevondenTags = tags.filter((t) => gesuggeerdeSlugs.includes(t.slug))

    return NextResponse.json({
      tagIds: gevondenTags.map((t) => t.id),
      tagSlugs: gevondenTags.map((t) => t.slug),
      tagNamen: gevondenTags.map((t) => t.naam),
    })
  } catch (error) {
    console.error("[Tag-suggestie] Fout:", error)
    return NextResponse.json({ error: "Tag-suggestie mislukt" }, { status: 500 })
  }
}
