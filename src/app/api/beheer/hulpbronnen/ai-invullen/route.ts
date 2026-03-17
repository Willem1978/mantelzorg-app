/**
 * AI Auto-fill endpoint voor hulpbronnen
 *
 * Analyseert bestaande velden (naam, website, beschrijving) en vult
 * ontbrekende velden automatisch in met AI. Beschrijvingen worden
 * herschreven naar B1-taalniveau.
 *
 * POST body:
 *   { formulier: Partial<Hulpbron>, modus: "alles" | "b1" }
 *   - "alles": vul alle lege velden + herschrijf beschrijving naar B1
 *   - "b1": alleen beschrijving herschrijven naar B1
 */
import { NextRequest, NextResponse } from "next/server"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { auth } from "@/lib/auth"

export const maxDuration = 30

const CATEGORIEEN_ZORGVRAGER = [
  "Administratie", "Plannen", "Boodschappen", "Sociaal & activiteiten",
  "Vervoer", "Verzorging", "Maaltijden", "Huishouden", "Klusjes", "Huisdieren",
]

const CATEGORIEEN_MANTELZORGER = [
  "Ondersteuning", "Vervangende mantelzorg", "Praten & steun",
  "Lotgenoten", "Leren & training",
]

const SOORT_HULP_OPTIES = [
  "Belangenorganisatie", "Educatie", "Emotionele steun", "Financiele regelingen",
  "Hulplijn", "Informatie en advies", "Overheid en financieel",
  "Persoonlijke begeleiding", "Praktische hulp", "Professionele zorg",
  "Vervangende mantelzorg",
]

const TYPE_OPTIES = [
  "GEMEENTE", "THUISZORG", "MANTELZORGSTEUNPUNT", "RESPIJTZORG",
  "DAGBESTEDING", "HUISARTS", "SOCIAAL_WIJKTEAM", "VRIJWILLIGERS",
  "OVERIG", "LANDELIJK",
]

const BRON_LABEL_OPTIES = ["Landelijk", "Gemeente", "Zvw", "Wlz", "Wmo", "Overig"]

interface FormulierData {
  naam?: string
  beschrijving?: string
  dienst?: string
  type?: string
  doelgroep?: string
  onderdeelTest?: string
  soortHulp?: string
  bronLabel?: string
  kosten?: string
  eersteStap?: string
  verwachtingTekst?: string
  website?: string
  telefoon?: string
  email?: string
  gemeente?: string
  woonplaats?: string
  zorgverzekeraar?: boolean
  openingstijden?: string
  dekkingNiveau?: string
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd" },
      { status: 503 }
    )
  }

  const body = await request.json()
  const { formulier, modus = "alles" } = body as {
    formulier: FormulierData
    modus?: "alles" | "b1"
  }

  if (!formulier?.naam && !formulier?.beschrijving && !formulier?.website) {
    return NextResponse.json(
      { error: "Vul minimaal een naam, website of beschrijving in om AI-invulling te starten" },
      { status: 400 }
    )
  }

  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    if (modus === "b1") {
      // Alleen B1 herschrijving van beschrijving
      if (!formulier.beschrijving) {
        return NextResponse.json(
          { error: "Geen beschrijving om te herschrijven" },
          { status: 400 }
        )
      }

      const { text } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        maxOutputTokens: 500,
        system: `Je herschrijft teksten naar B1-taalniveau (ERK/CEFR) in het Nederlands.

B1-REGELS:
- Korte zinnen (max 15 woorden per zin)
- Eenvoudige, dagelijkse woorden
- Geen jargon of vaktaal
- Actieve zinsbouw
- Directe aanspreking (je/jij)
- Concrete taal, geen abstracte begrippen
- 2-4 zinnen maximaal

Geef ALLEEN de herschreven tekst terug, zonder uitleg of aanhalingstekens.`,
        prompt: `Herschrijf deze tekst naar B1-taalniveau:\n\n${formulier.beschrijving}`,
      })

      return NextResponse.json({
        suggesties: { beschrijving: text.trim() },
        modus: "b1",
      })
    }

    // Modus "alles": analyseer en vul ontbrekende velden in
    const categorieenLijst = formulier.doelgroep === "ZORGVRAGER"
      ? CATEGORIEEN_ZORGVRAGER
      : formulier.doelgroep === "MANTELZORGER"
      ? CATEGORIEEN_MANTELZORGER
      : [...CATEGORIEEN_ZORGVRAGER, ...CATEGORIEEN_MANTELZORGER]

    const legeVelden: string[] = []
    if (!formulier.beschrijving) legeVelden.push("beschrijving")
    if (!formulier.dienst) legeVelden.push("dienst")
    if (!formulier.doelgroep) legeVelden.push("doelgroep")
    if (!formulier.onderdeelTest) legeVelden.push("onderdeelTest (categorie)")
    if (!formulier.soortHulp) legeVelden.push("soortHulp")
    if (!formulier.type || formulier.type === "OVERIG") legeVelden.push("type (organisatietype)")
    if (!formulier.bronLabel) legeVelden.push("bronLabel")
    if (!formulier.kosten) legeVelden.push("kosten")
    if (!formulier.eersteStap) legeVelden.push("eersteStap")
    if (!formulier.verwachtingTekst) legeVelden.push("verwachtingTekst")

    const bekendeInfo = [
      formulier.naam ? `Naam: ${formulier.naam}` : null,
      formulier.beschrijving ? `Beschrijving: ${formulier.beschrijving}` : null,
      formulier.dienst ? `Dienst: ${formulier.dienst}` : null,
      formulier.website ? `Website: ${formulier.website}` : null,
      formulier.gemeente ? `Gemeente: ${formulier.gemeente}` : null,
      formulier.woonplaats ? `Woonplaats: ${formulier.woonplaats}` : null,
      formulier.doelgroep ? `Doelgroep: ${formulier.doelgroep}` : null,
      formulier.onderdeelTest ? `Categorie: ${formulier.onderdeelTest}` : null,
      formulier.telefoon ? `Telefoon: ${formulier.telefoon}` : null,
      formulier.dekkingNiveau ? `Dekkingsniveau: ${formulier.dekkingNiveau}` : null,
    ].filter(Boolean).join("\n")

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      maxOutputTokens: 1500,
      system: `Je bent een assistent voor het MantelBuddy platform. Je helpt beheerders met het invullen van hulpbronnen (zorg- en welzijnsorganisaties) voor mantelzorgers en zorgvragers in Nederland.

Je taak: analyseer de bekende informatie over een organisatie en genereer suggesties voor ontbrekende velden.

BELANGRIJKE REGELS:
- Alle teksten MOETEN in B1-taalniveau zijn (korte zinnen, eenvoudige woorden, max 15 woorden per zin)
- Beschrijving: 2-4 zinnen, beschrijf wat de organisatie doet in eenvoudige taal
- Dienst: korte naam van de dienst (1-3 woorden)
- Eerste stap: concreet wat iemand moet doen, bijv. "Bel en vraag naar een intake-gesprek"
- Verwachting tekst: wat er dan gebeurt, bijv. "Ze komen bij je thuis kijken wat er nodig is"
- Kosten: bijv. "Gratis", "Afhankelijk van organisatie", "Via zorgverzekeraar"
- Als je iets NIET zeker weet, laat het veld dan LEEG (lege string)

ANTWOORD ALTIJD in exact dit JSON-formaat (geen markdown, geen code blocks):
{
  "beschrijving": "...",
  "dienst": "...",
  "doelgroep": "MANTELZORGER" of "ZORGVRAGER",
  "onderdeelTest": "...",
  "soortHulp": "...",
  "type": "...",
  "bronLabel": "...",
  "kosten": "...",
  "eersteStap": "...",
  "verwachtingTekst": "",
  "zorgverzekeraar": true of false
}

Vul alleen velden in die je met redelijke zekerheid kunt afleiden. Gebruik "" voor onzekere velden.`,
      prompt: `Analyseer deze hulpbron en geef suggesties voor de ontbrekende velden.

BEKENDE INFORMATIE:
${bekendeInfo}

ONTBREKENDE VELDEN: ${legeVelden.join(", ")}

KEUZE-OPTIES:
- Categorieën: ${categorieenLijst.join(", ")}
- Soort hulp: ${SOORT_HULP_OPTIES.join(", ")}
- Type organisatie: ${TYPE_OPTIES.join(", ")}
- Bron label: ${BRON_LABEL_OPTIES.join(", ")}
- Doelgroep: MANTELZORGER, ZORGVRAGER

${formulier.beschrijving ? `\nDe bestaande beschrijving moet ook herschreven worden naar B1-taalniveau als dat nog niet zo is.` : ""}

Geef je antwoord als JSON.`,
    })

    // Parse AI response
    let suggesties: Record<string, unknown> = {}
    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      suggesties = JSON.parse(cleaned)
    } catch {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          suggesties = JSON.parse(jsonMatch[0])
        } catch {
          return NextResponse.json(
            { error: "AI-antwoord kon niet worden verwerkt", raw: text },
            { status: 500 }
          )
        }
      }
    }

    // Validate suggestions against allowed values
    if (suggesties.onderdeelTest && !categorieenLijst.includes(suggesties.onderdeelTest as string)) {
      suggesties.onderdeelTest = ""
    }
    if (suggesties.soortHulp && !SOORT_HULP_OPTIES.includes(suggesties.soortHulp as string)) {
      suggesties.soortHulp = ""
    }
    if (suggesties.type && !TYPE_OPTIES.includes(suggesties.type as string)) {
      suggesties.type = ""
    }
    if (suggesties.bronLabel && !BRON_LABEL_OPTIES.includes(suggesties.bronLabel as string)) {
      suggesties.bronLabel = ""
    }
    if (suggesties.doelgroep && !["MANTELZORGER", "ZORGVRAGER"].includes(suggesties.doelgroep as string)) {
      suggesties.doelgroep = ""
    }

    // Remove empty suggestions
    const filtered: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(suggesties)) {
      if (value !== "" && value !== null && value !== undefined) {
        filtered[key] = value
      }
    }

    return NextResponse.json({
      suggesties: filtered,
      legeVelden,
      modus: "alles",
    })
  } catch (error) {
    console.error("[AI Invullen] Fout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI-invulling mislukt" },
      { status: 500 }
    )
  }
}
