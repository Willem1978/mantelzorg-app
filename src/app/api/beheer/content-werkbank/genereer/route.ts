/**
 * Genereer endpoint — /api/beheer/content-werkbank/genereer
 *
 * Genereert een volledig artikelconcept op basis van categorie en onderwerp.
 * Gebruikt AI (Anthropic Sonnet) om content te schrijven in B1-niveau Nederlands.
 * Fallback naar een template-concept als AI niet beschikbaar is.
 *
 * POST body: { categorie: string, onderwerp: string }
 * Returns:   { concept: { titel, beschrijving, inhoud, tags } }
 */
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export const maxDuration = 60

const ADMIN_ROLES = ["ADMIN", "ORG_ADMIN"] as const

function templateConcept(categorie: string, onderwerp: string) {
  return {
    titel: onderwerp,
    beschrijving: `Informatie over ${onderwerp.toLowerCase()} voor mantelzorgers.`,
    inhoud: `# ${onderwerp}

## Wat is het?

[Beschrijf hier kort wat ${onderwerp.toLowerCase()} inhoudt voor mantelzorgers.]

## Waarom is dit belangrijk?

Als mantelzorger heb je veel aan je hoofd. ${onderwerp} kan je helpen om beter voor jezelf en je naaste te zorgen.

## Tips

- **Tip 1**: Vraag hulp als je het nodig hebt.
- **Tip 2**: Neem de tijd om informatie te verzamelen.
- **Tip 3**: Bespreek het met je huisarts of wijkteam.

## Meer weten?

Neem contact op met je gemeente of kijk op mantelzorg.nl voor meer informatie.`,
    tags: [categorie],
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role as (typeof ADMIN_ROLES)[number])) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  try {
    const { categorie, onderwerp } = await req.json()

    if (!categorie || !onderwerp) {
      return NextResponse.json({ error: "Categorie en onderwerp zijn vereist" }, { status: 400 })
    }

    // Probeer AI-concept te genereren
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY niet geconfigureerd")
      }

      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      // Haal bestaande artikelen op voor context (vermijd overlap)
      const bestaandeArtikelen = await prisma.artikel.findMany({
        where: { categorie, isActief: true },
        select: { titel: true },
        take: 50,
      })

      const bestaandeTitels = bestaandeArtikelen.map((a) => a.titel).join("\n- ")

      // Haal beschikbare tags op
      const tags = await prisma.contentTag.findMany({
        where: { isActief: true },
        select: { slug: true, naam: true },
        orderBy: { volgorde: "asc" },
      })
      const tagSlugs = tags.map((t) => `${t.slug} (${t.naam})`).join(", ")

      const { text } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        maxOutputTokens: 4000,
        system: `Je bent een content-schrijver voor MantelBuddy, een platform voor mantelzorgers in Nederland.
Je schrijft informatieve, warme en praktische artikelen.

TAALREGELS (B1-niveau):
- Gebruik korte zinnen (max 15 woorden per zin).
- Gebruik eenvoudige woorden. Vermijd jargon.
- Schrijf in de je/jij-vorm, spreek de lezer direct aan.
- Gebruik actieve zinnen, geen passieve constructies.
- Leg moeilijke termen uit als je ze moet gebruiken.
- Gebruik tussenkopjes en lijstjes voor overzicht.

BESCHIKBARE TAGS: ${tagSlugs}

BESTAANDE ARTIKELEN in categorie "${categorie}" (vermijd overlap):
- ${bestaandeTitels || "(geen)"}

Geef je antwoord als een JSON-object met deze structuur:
{
  "titel": "Korte, duidelijke titel",
  "beschrijving": "Samenvatting in 1-2 zinnen (B1-niveau)",
  "inhoud": "Volledige artikeltekst in Markdown (B1-niveau, met tussenkopjes, lijstjes, tips)",
  "tags": ["tag-slug-1", "tag-slug-2", "tag-slug-3"]
}

Antwoord ALLEEN met het JSON-object, geen andere tekst.`,
        prompt: `Schrijf een compleet artikel over "${onderwerp}" in de categorie "${categorie}".

Het artikel moet:
- Minimaal 300 woorden bevatten
- Geschreven zijn in B1-niveau Nederlands
- Tussenkopjes hebben (## in Markdown)
- Praktische tips bevatten
- Empathisch en warm van toon zijn
- Relevant zijn voor mantelzorgers in Nederland

Kies 2-4 passende tags uit de beschikbare tags.`,
      })

      // Parse AI response
      const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim()
      const concept = JSON.parse(cleaned)

      if (!concept.titel || !concept.beschrijving || !concept.inhoud) {
        throw new Error("Onvolledig AI-concept")
      }

      return NextResponse.json({
        concept: {
          titel: concept.titel,
          beschrijving: concept.beschrijving,
          inhoud: concept.inhoud,
          tags: Array.isArray(concept.tags) ? concept.tags : [],
        },
      })
    } catch {
      // Fallback naar template-concept
      const concept = templateConcept(categorie, onderwerp)
      return NextResponse.json({ concept })
    }
  } catch (error) {
    console.error("Genereer fout:", error)
    return NextResponse.json(
      { error: "Kon geen concept genereren" },
      { status: 500 }
    )
  }
}
