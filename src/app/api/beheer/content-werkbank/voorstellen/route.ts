/**
 * Voorstellen endpoint — /api/beheer/content-werkbank/voorstellen
 *
 * Genereert 3 artikelvoorstellen op basis van categorie en hiaten.
 * Gebruikt AI (Anthropic Sonnet) om relevante onderwerpen te suggereren.
 * Fallback naar hardcoded suggesties als AI niet beschikbaar is.
 *
 * POST body: { categorie: string, hiaten?: string[] }
 * Returns:   { voorstellen: [{ titel, beschrijving, tags, reden }] }
 */
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export const maxDuration = 60

const ADMIN_ROLES = ["ADMIN", "ORG_ADMIN"] as const

const HARDCODED_VOORSTELLEN: Record<string, Array<{ titel: string; beschrijving: string; tags: string[]; reden: string }>> = {
  "dagelijks-zorgen": [
    {
      titel: "Medicatie beheren: tips voor een goed overzicht",
      beschrijving: "Praktische tips om medicijnen bij te houden, fouten te voorkomen en afspraken te onthouden.",
      tags: ["medicatie", "dagritme", "veiligheid"],
      reden: "Medicatiebeheer is een veelvoorkomend knelpunt bij mantelzorgers.",
    },
    {
      titel: "Dagritme opbouwen voor jou en je naaste",
      beschrijving: "Hoe je een voorspelbaar dagritme maakt dat rust geeft aan jullie allebei.",
      tags: ["dagritme", "structuur", "zelfzorg"],
      reden: "Een goed dagritme vermindert stress en overbelasting.",
    },
    {
      titel: "Veilig thuis: valpreventie en aanpassingen",
      beschrijving: "Eenvoudige aanpassingen in huis die vallen voorkomen en de veiligheid verhogen.",
      tags: ["veiligheid", "woningaanpassingen", "preventie"],
      reden: "Vallen is een groot risico bij ouderen en mensen met een beperking.",
    },
  ],
  "zelfzorg-balans": [
    {
      titel: "Signalen van overbelasting herkennen",
      beschrijving: "Leer de vroege signalen van overbelasting herkennen voordat het te laat is.",
      tags: ["overbelasting", "signalen", "zelfzorg"],
      reden: "Veel mantelzorgers herkennen overbelasting pas als het te laat is.",
    },
    {
      titel: "Grenzen stellen zonder schuldgevoel",
      beschrijving: "Hoe je nee leert zeggen en grenzen stelt, zonder je schuldig te voelen.",
      tags: ["grenzen", "emoties", "communicatie"],
      reden: "Schuldgevoel is een veelvoorkomend obstakel voor zelfzorg.",
    },
    {
      titel: "Ontspanningsoefeningen die je in 5 minuten kunt doen",
      beschrijving: "Korte ontspanningsoefeningen die je tussendoor kunt doen, ook als je weinig tijd hebt.",
      tags: ["ontspanning", "zelfzorg", "tijd"],
      reden: "Mantelzorgers hebben vaak weinig tijd voor uitgebreide ontspanning.",
    },
  ],
  "rechten-regelingen": [
    {
      titel: "Wmo aanvragen: stap voor stap uitgelegd",
      beschrijving: "Een duidelijke uitleg over hoe je een Wmo-voorziening aanvraagt bij je gemeente.",
      tags: ["wmo", "aanvragen", "gemeente"],
      reden: "Het Wmo-aanvraagproces is voor veel mantelzorgers onduidelijk.",
    },
    {
      titel: "PGB of zorg in natura: wat past bij jou?",
      beschrijving: "De verschillen tussen een PGB en zorg in natura, en hoe je kiest wat het beste past.",
      tags: ["pgb", "zorg-in-natura", "keuzehulp"],
      reden: "Veel mantelzorgers weten niet welke financieringsvorm het beste past.",
    },
    {
      titel: "Mantelzorgwaardering: waar heb je recht op?",
      beschrijving: "Overzicht van mantelzorgwaardering per gemeente en hoe je het aanvraagt.",
      tags: ["mantelzorgwaardering", "gemeente", "financieel"],
      reden: "Veel mantelzorgers weten niet dat ze recht hebben op waardering.",
    },
  ],
}

const DEFAULT_VOORSTELLEN = [
  {
    titel: "Hulp vragen: hoe doe je dat?",
    beschrijving: "Tips om hulp te durven vragen aan je omgeving, en hoe je dat concreet aanpakt.",
    tags: ["hulp-vragen", "netwerk", "communicatie"],
    reden: "Hulp vragen is voor veel mantelzorgers lastig maar essentieel.",
  },
  {
    titel: "Samenwerken met professionele zorgverleners",
    beschrijving: "Hoe je goed samenwerkt met thuiszorg, huisarts en andere professionals.",
    tags: ["samenwerken", "professionele-zorg", "communicatie"],
    reden: "Goede samenwerking met professionals verlicht de zorglast.",
  },
  {
    titel: "Zorgen op afstand: tips en hulpmiddelen",
    beschrijving: "Hoe je goede zorg biedt als je niet dichtbij woont, met hulp van technologie.",
    tags: ["afstand", "technologie", "organisatie"],
    reden: "Steeds meer mantelzorgers wonen niet in de buurt van hun naaste.",
  },
]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role as (typeof ADMIN_ROLES)[number])) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  try {
    const { categorie, hiaten } = await req.json()

    if (!categorie) {
      return NextResponse.json({ error: "Categorie is vereist" }, { status: 400 })
    }

    // Probeer AI-voorstellen te genereren
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY niet geconfigureerd")
      }

      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      // Haal bestaande artikelen op voor context
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
        maxOutputTokens: 2000,
        system: `Je bent een content-strateeg voor MantelBuddy, een platform voor mantelzorgers in Nederland.
Je stelt nieuwe artikelonderwerpen voor op basis van hiaten in de content.

TAAL: Nederlands, B1-niveau (eenvoudig, korte zinnen, geen jargon).

BESCHIKBARE TAGS: ${tagSlugs}

BESTAANDE ARTIKELEN in categorie "${categorie}":
- ${bestaandeTitels || "(geen)"}

Geef altijd EXACT 3 voorstellen terug in JSON-formaat.`,
        prompt: `Stel 3 nieuwe artikelonderwerpen voor in de categorie "${categorie}".
${hiaten && hiaten.length > 0 ? `\nGeconstateerde hiaten/ontbrekende onderwerpen:\n- ${hiaten.join("\n- ")}` : ""}

Geef je antwoord als JSON array met EXACT 3 objecten:
[
  {
    "titel": "Korte, duidelijke titel",
    "beschrijving": "Eenvoudige beschrijving in 1-2 zinnen (B1-niveau)",
    "tags": ["tag-slug-1", "tag-slug-2"],
    "reden": "Waarom dit onderwerp relevant is voor mantelzorgers"
  }
]

Antwoord ALLEEN met de JSON array, geen andere tekst.`,
      })

      // Parse AI response
      const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim()
      const voorstellen = JSON.parse(cleaned)

      if (!Array.isArray(voorstellen) || voorstellen.length === 0) {
        throw new Error("Ongeldige AI response")
      }

      return NextResponse.json({ voorstellen: voorstellen.slice(0, 3) })
    } catch {
      // Fallback naar hardcoded suggesties
      const voorstellen = HARDCODED_VOORSTELLEN[categorie] || DEFAULT_VOORSTELLEN
      return NextResponse.json({ voorstellen })
    }
  } catch (error) {
    console.error("Voorstellen fout:", error)
    return NextResponse.json(
      { error: "Kon geen voorstellen genereren" },
      { status: 500 }
    )
  }
}
