/**
 * Bulk AI Auto-fill endpoint voor hulpbronnen
 *
 * Verwerkt meerdere hulpbronnen tegelijk: vult ontbrekende velden in
 * en herschrijft beschrijvingen naar B1-taalniveau.
 *
 * POST body:
 *   { ids: string[] }  - IDs van hulpbronnen om te verwerken
 *
 * Streamt voortgang als NDJSON events.
 */
import { NextRequest } from "next/server"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const maxDuration = 300 // 5 minuten voor bulk operaties

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

const COMPLETENESS_FIELDS = [
  "naam", "dienst", "beschrijving", "doelgroep", "onderdeelTest",
  "soortHulp", "kosten", "eersteStap", "verwachtingTekst", "telefoon", "website",
]

function berekenCompleetheid(h: Record<string, unknown>): number {
  const filled = COMPLETENESS_FIELDS.filter(key => {
    const val = h[key]
    return val && val !== "" && val !== "OVERIG"
  }).length
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Niet ingelogd" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const body = await request.json()
  const { ids } = body as { ids?: string[] }

  // Haal hulpbronnen op: of specifieke IDs, of alle onvolledige
  let hulpbronnen: Record<string, unknown>[]
  if (ids && ids.length > 0) {
    hulpbronnen = await prisma.zorgorganisatie.findMany({
      where: { id: { in: ids } },
    }) as unknown as Record<string, unknown>[]
  } else {
    // Alle hulpbronnen ophalen en filteren op <70% compleetheid
    const alle = await prisma.zorgorganisatie.findMany() as unknown as Record<string, unknown>[]
    hulpbronnen = alle.filter(h => berekenCompleetheid(h) < 70)
  }

  if (hulpbronnen.length === 0) {
    return new Response(
      JSON.stringify({ verwerkt: 0, bijgewerkt: 0, fouten: 0, totaal: 0 }),
      { headers: { "Content-Type": "application/json" } }
    )
  }

  // Stream de voortgang als NDJSON
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
      let bijgewerkt = 0
      let fouten = 0

      // Stuur totaal eerst
      controller.enqueue(encoder.encode(
        JSON.stringify({ type: "start", totaal: hulpbronnen.length }) + "\n"
      ))

      for (let i = 0; i < hulpbronnen.length; i++) {
        const h = hulpbronnen[i]

        try {
          // Check welke velden leeg zijn
          const legeVelden: string[] = []
          if (!h.beschrijving) legeVelden.push("beschrijving")
          if (!h.dienst) legeVelden.push("dienst")
          if (!h.doelgroep) legeVelden.push("doelgroep")
          if (!h.onderdeelTest) legeVelden.push("onderdeelTest")
          if (!h.soortHulp) legeVelden.push("soortHulp")
          if (!h.type || h.type === "OVERIG") legeVelden.push("type")
          if (!h.bronLabel) legeVelden.push("bronLabel")
          if (!h.kosten) legeVelden.push("kosten")
          if (!h.eersteStap) legeVelden.push("eersteStap")
          if (!h.verwachtingTekst) legeVelden.push("verwachtingTekst")

          if (legeVelden.length === 0) {
            // Niets te doen, alleen eventueel B1 herschrijving
            controller.enqueue(encoder.encode(
              JSON.stringify({ type: "progress", verwerkt: i + 1, naam: h.naam, status: "overgeslagen" }) + "\n"
            ))
            continue
          }

          const categorieenLijst = h.doelgroep === "ZORGVRAGER"
            ? CATEGORIEEN_ZORGVRAGER
            : h.doelgroep === "MANTELZORGER"
            ? CATEGORIEEN_MANTELZORGER
            : [...CATEGORIEEN_ZORGVRAGER, ...CATEGORIEEN_MANTELZORGER]

          const bekendeInfo = [
            h.naam ? `Naam: ${h.naam}` : null,
            h.beschrijving ? `Beschrijving: ${h.beschrijving}` : null,
            h.dienst ? `Dienst: ${h.dienst}` : null,
            h.website ? `Website: ${h.website}` : null,
            h.gemeente ? `Gemeente: ${h.gemeente}` : null,
            h.doelgroep ? `Doelgroep: ${h.doelgroep}` : null,
            h.onderdeelTest ? `Categorie: ${h.onderdeelTest}` : null,
            h.telefoon ? `Telefoon: ${h.telefoon}` : null,
          ].filter(Boolean).join("\n")

          const { text } = await generateText({
            model: anthropic("claude-sonnet-4-20250514"),
            maxOutputTokens: 1500,
            system: `Je bent een assistent voor het MantelBuddy platform. Je helpt bij het invullen van hulpbronnen voor mantelzorgers en zorgvragers in Nederland.

REGELS:
- Alle teksten MOETEN in B1-taalniveau zijn (korte zinnen, max 15 woorden per zin)
- Beschrijving: 2-4 zinnen over wat de organisatie doet
- Dienst: korte naam (1-3 woorden)
- Eerste stap: concreet wat iemand moet doen
- Verwachting tekst: wat er dan gebeurt
- Kosten: bijv. "Gratis", "Via zorgverzekeraar"
- Als je iets NIET zeker weet, gebruik een lege string

ANTWOORD als JSON (geen markdown):
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
}`,
            prompt: `Analyseer deze hulpbron en vul de ontbrekende velden in.

BEKEND: ${bekendeInfo}
ONTBREKEND: ${legeVelden.join(", ")}

OPTIES:
- Categorieën: ${categorieenLijst.join(", ")}
- Soort hulp: ${SOORT_HULP_OPTIES.join(", ")}
- Type: ${TYPE_OPTIES.join(", ")}
- Bron: ${BRON_LABEL_OPTIES.join(", ")}

${h.beschrijving ? "Herschrijf de beschrijving ook naar B1-taalniveau." : ""}

JSON:`,
          })

          // Parse response
          let suggesties: Record<string, unknown> = {}
          try {
            const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
            suggesties = JSON.parse(cleaned)
          } catch {
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              try { suggesties = JSON.parse(jsonMatch[0]) } catch { /* skip */ }
            }
          }

          // Valideer suggesties
          if (suggesties.onderdeelTest && !categorieenLijst.includes(suggesties.onderdeelTest as string)) {
            suggesties.onderdeelTest = undefined
          }
          if (suggesties.soortHulp && !SOORT_HULP_OPTIES.includes(suggesties.soortHulp as string)) {
            suggesties.soortHulp = undefined
          }
          if (suggesties.type && !TYPE_OPTIES.includes(suggesties.type as string)) {
            suggesties.type = undefined
          }
          if (suggesties.bronLabel && !BRON_LABEL_OPTIES.includes(suggesties.bronLabel as string)) {
            suggesties.bronLabel = undefined
          }
          if (suggesties.doelgroep && !["MANTELZORGER", "ZORGVRAGER"].includes(suggesties.doelgroep as string)) {
            suggesties.doelgroep = undefined
          }

          // Bouw update data: alleen lege velden vullen
          const updateData: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(suggesties)) {
            if (value !== "" && value !== null && value !== undefined) {
              const currentVal = h[key]
              // Beschrijving altijd updaten (B1 herschrijving), rest alleen als leeg
              if (key === "beschrijving" || !currentVal || currentVal === "" || currentVal === "OVERIG") {
                updateData[key] = value
              }
            }
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.zorgorganisatie.update({
              where: { id: h.id as string },
              data: updateData,
            })
            bijgewerkt++
          }

          controller.enqueue(encoder.encode(
            JSON.stringify({
              type: "progress",
              verwerkt: i + 1,
              naam: h.naam,
              status: Object.keys(updateData).length > 0 ? "bijgewerkt" : "geen_wijzigingen",
              veldenIngevuld: Object.keys(updateData).length,
            }) + "\n"
          ))
        } catch (error) {
          fouten++
          controller.enqueue(encoder.encode(
            JSON.stringify({
              type: "progress",
              verwerkt: i + 1,
              naam: h.naam,
              status: "fout",
              error: error instanceof Error ? error.message : "Onbekende fout",
            }) + "\n"
          ))
        }

        // Rate limiting: kleine pauze tussen requests
        if (i < hulpbronnen.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Stuur eindresultaat
      controller.enqueue(encoder.encode(
        JSON.stringify({
          type: "done",
          totaal: hulpbronnen.length,
          bijgewerkt,
          fouten,
        }) + "\n"
      ))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
    },
  })
}
