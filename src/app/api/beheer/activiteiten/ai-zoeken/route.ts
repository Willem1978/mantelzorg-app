import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

const ZOEKTERMEN = [
  "mantelzorg activiteiten",
  "lotgenotencontact mantelzorgers",
  "buurthuis activiteiten",
  "wandelgroep senioren",
  "respijtzorg",
  "sociaal contact ouderen",
]

const TYPE_MAP: Record<string, string> = {
  lotgenoten: "LOTGENOTEN",
  lotgenotencontact: "LOTGENOTEN",
  wandel: "SPORT",
  sport: "SPORT",
  bewegen: "SPORT",
  yoga: "SPORT",
  koffie: "SOCIAAL",
  buurthuis: "SOCIAAL",
  sociaal: "SOCIAAL",
  cursus: "EDUCATIE",
  workshop: "EDUCATIE",
  respijt: "RESPIJTZORG",
  dagopvang: "RESPIJTZORG",
  opvang: "RESPIJTZORG",
}

// POST /api/beheer/activiteiten/ai-zoeken — zoek activiteiten per woonplaats via AI
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const { woonplaats } = await req.json()
  if (!woonplaats) {
    return NextResponse.json({ error: "woonplaats is vereist" }, { status: 400 })
  }

  try {
    const anthropic = createAnthropic()

    const zoekPrompt = ZOEKTERMEN.map(t => `${t} ${woonplaats}`).join("\n")

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      maxOutputTokens: 4000,
      prompt: `Zoek lokale activiteiten voor mantelzorgers in ${woonplaats}. Zoek naar:
${zoekPrompt}

Geef per gevonden activiteit terug in dit JSON formaat:
{
  "activiteiten": [
    {
      "naam": "...",
      "beschrijving": "korte beschrijving in B1 Nederlands",
      "locatie": "naam van het gebouw/locatie",
      "adres": "straat + huisnummer",
      "type": "LOTGENOTEN|SPORT|SOCIAAL|EDUCATIE|RESPIJTZORG|OVERIG",
      "frequentie": "WEKELIJKS|MAANDELIJKS|EENMALIG",
      "dag": "MAANDAG|DINSDAG|...",
      "tijd": "14:00-16:00",
      "kosten": "Gratis of bedrag",
      "contactTelefoon": "...",
      "website": "...",
      "bronUrl": "URL waar je dit gevonden hebt"
    }
  ]
}

Zoek minimaal op: buurthuizen, socialekaart.nl, gemeentelijke websites, sportverenigingen, mantelzorgsteunpunten.
Geef ALLEEN activiteiten die echt bestaan. Geen verzonnen resultaten.`,
    })

    // Parse het antwoord
    let activiteiten: Array<Record<string, string>> = []
    const jsonMatch = text.match(/\{[\s\S]*"activiteiten"[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        activiteiten = parsed.activiteiten || []
      } catch {
        // JSON parse failed
      }
    }

    // Sla op in database met deduplicatie
    let toegevoegd = 0
    for (const a of activiteiten) {
      // Check voor duplicaat op naam + woonplaats
      const bestaand = await prisma.activiteit.findFirst({
        where: {
          naam: { equals: a.naam, mode: "insensitive" },
          woonplaats: { equals: woonplaats, mode: "insensitive" },
        },
      })

      if (!bestaand) {
        await prisma.activiteit.create({
          data: {
            naam: a.naam || "Onbekende activiteit",
            beschrijving: a.beschrijving || null,
            locatie: a.locatie || null,
            adres: a.adres || null,
            woonplaats,
            gemeente: woonplaats, // wordt later bijgewerkt via PDOK
            type: a.type || "OVERIG",
            frequentie: a.frequentie || null,
            dag: a.dag || null,
            tijd: a.tijd || null,
            kosten: a.kosten || null,
            contactTelefoon: a.contactTelefoon || null,
            website: a.website || null,
            bronUrl: a.bronUrl || null,
            isGevalideerd: false,
          },
        })
        toegevoegd++
      }
    }

    return NextResponse.json({
      gevonden: activiteiten.length,
      toegevoegd,
      overgeslagen: activiteiten.length - toegevoegd,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "AI zoeken mislukt", details: String(error) },
      { status: 500 }
    )
  }
}
