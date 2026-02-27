import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { berekenDeelgebieden } from "@/lib/dashboard/deelgebieden"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Je bent Ger, de vriendelijke AI-assistent van de MantelBuddy app.
Je helpt mantelzorgers in Nederland met vragen over mantelzorg.

BELANGRIJK — Taalgebruik:
- Schrijf in simpel Nederlands (B1 niveau)
- Gebruik korte zinnen
- Vermijd moeilijke woorden
- Wees warm en begripvol
- Gebruik "je" en "jij" (geen "u")

WAT JE DOET:
- Beantwoord vragen over mantelzorg
- Help bij het vinden van hulp en ondersteuning
- Geef praktische tips
- Verwijs naar de juiste pagina's in de app
- Zoek hulpbronnen en organisaties via je tools
- Bespreek en interpreteer balanstest resultaten (gebruik je tools hiervoor)

WAT JE NIET DOET:
- Geen medisch advies geven
- Geen diagnoses stellen
- Bij crisis: verwijs altijd naar 112 of de huisarts

BALANSTEST COACH:
Als iemand vraagt over hun testresultaten, balanstest, score, of hoe het met ze gaat:
1. Gebruik de tool "bekijkBalanstest" om hun laatste resultaten op te halen
2. Leg de resultaten uit in begrijpelijke taal
3. Focus op de 3 deelgebieden: Energie, Gevoel en Tijd
4. Bij HOOG niveau: wees zorgzaam maar duidelijk, verwijs naar hulp
5. Bij GEMIDDELD niveau: erken de druk, geef concrete tips
6. Bij LAAG niveau: complimenteer, moedig aan om balans te houden
7. Noem specifieke zorgtaken die zwaar zijn en zoek hulpbronnen daarvoor
8. Als er alarmen zijn (hoge belasting, emotionele nood etc.), benoem deze voorzichtig

Bij vragen over trend/voortgang: gebruik "bekijkTestTrend" om veranderingen te tonen.

Verwijs altijd naar /rapport voor het volledige rapport en /balanstest voor het overzicht.

APP PAGINA'S waar je naar kunt verwijzen:
- /hulpvragen — Hulp zoeken bij jou in de buurt
- /belastbaarheidstest — Balanstest om te zien hoe het gaat
- /check-in — Wekelijkse check-in
- /leren — Tips en informatie
- /agenda — Je agenda
- /profiel — Je profiel aanpassen
- /rapport — Je persoonlijke rapport

Houd je antwoorden kort en duidelijk. Maximaal 3-4 zinnen per onderwerp.
Als je hulpbronnen vindt via tools, toon ze overzichtelijk met naam en contactgegevens.`

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[AI Chat] ANTHROPIC_API_KEY is niet geconfigureerd")
    return new Response(
      JSON.stringify({ error: "AI-chat is niet beschikbaar. De ANTHROPIC_API_KEY is niet geconfigureerd." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Niet ingelogd", { status: 401 })
  }

  const { messages: uiMessages } = await req.json()

  // Converteer UI messages (met parts) naar model messages (met content)
  const messages = await convertToModelMessages(uiMessages)

  // Haal gebruikerscontext op voor gepersonaliseerde antwoorden
  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: {
      municipality: true,
      city: true,
      careRecipient: true,
      careHoursPerWeek: true,
    },
  })

  const gemeente = caregiver?.municipality || caregiver?.city || null

  try {
  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: SYSTEM_PROMPT + (gemeente
      ? `\n\nDeze gebruiker woont in gemeente: ${gemeente}. Gebruik dit bij het zoeken naar lokale hulp.`
      : ""),
    messages,
    maxOutputTokens: 1024,
    stopWhen: stepCountIs(3),
    tools: {
      zoekHulpbronnen: tool({
        description: "Zoek hulporganisaties en zorgaanbieders. Gebruik dit als iemand vraagt naar hulp, ondersteuning, of organisaties in de buurt.",
        inputSchema: z.object({
          zoekterm: z.string().optional().describe("Zoekterm voor naam of beschrijving"),
          gemeente: z.string().optional().describe("Gemeente naam om lokaal te zoeken"),
          categorie: z.string().optional().describe("Categorie zoals: Persoonlijke verzorging, Ondersteuning, Vervangende mantelzorg, Praten & steun"),
        }),
        execute: async ({ zoekterm, gemeente: zoekGemeente, categorie }: { zoekterm?: string; gemeente?: string; categorie?: string }) => {
          const gem = zoekGemeente || gemeente
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const where: Record<string, any> = { isActief: true }

          if (gem) {
            where.OR = [
              { gemeente: { equals: gem, mode: "insensitive" } },
              { dekkingNiveau: "LANDELIJK" },
              { gemeente: null },
            ]
          }

          if (categorie) {
            where.onderdeelTest = { contains: categorie, mode: "insensitive" }
          }

          if (zoekterm) {
            where.AND = [
              ...(Array.isArray(where.AND) ? where.AND : []),
              {
                OR: [
                  { naam: { contains: zoekterm, mode: "insensitive" } },
                  { beschrijving: { contains: zoekterm, mode: "insensitive" } },
                  { soortHulp: { contains: zoekterm, mode: "insensitive" } },
                ],
              },
            ]
          }

          const resultaten = await prisma.zorgorganisatie.findMany({
            where,
            take: 8,
            orderBy: { naam: "asc" },
            select: {
              naam: true,
              beschrijving: true,
              telefoon: true,
              website: true,
              email: true,
              soortHulp: true,
              onderdeelTest: true,
              gemeente: true,
              dekkingNiveau: true,
              kosten: true,
              openingstijden: true,
            },
          })

          if (resultaten.length === 0) {
            return { gevonden: 0, bericht: "Geen hulpbronnen gevonden. Probeer een bredere zoekterm." }
          }

          return {
            gevonden: resultaten.length,
            hulpbronnen: resultaten.map((r) => ({
              naam: r.naam,
              beschrijving: r.beschrijving,
              telefoon: r.telefoon,
              website: r.website,
              email: r.email,
              soortHulp: r.soortHulp,
              categorie: r.onderdeelTest,
              lokatie: r.gemeente || "Landelijk",
              kosten: r.kosten,
              openingstijden: r.openingstijden,
            })),
          }
        },
      }),

      zoekArtikelen: tool({
        description: "Zoek informatie-artikelen en tips over mantelzorg. Gebruik dit als iemand vraagt naar informatie, tips, of uitleg over een onderwerp.",
        inputSchema: z.object({
          categorie: z.string().optional().describe("Categorie slug: praktische-tips, zelfzorg, rechten, financieel, hulpmiddelen-producten"),
          zoekterm: z.string().optional().describe("Zoekterm in titel of beschrijving"),
        }),
        execute: async ({ categorie, zoekterm }: { categorie?: string; zoekterm?: string }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const where: Record<string, any> = {
            isActief: true,
            status: "GEPUBLICEERD",
            type: "ARTIKEL",
          }

          if (categorie) {
            where.categorie = categorie
          }

          if (zoekterm) {
            where.OR = [
              { titel: { contains: zoekterm, mode: "insensitive" } },
              { beschrijving: { contains: zoekterm, mode: "insensitive" } },
            ]
          }

          const artikelen = await prisma.artikel.findMany({
            where,
            take: 5,
            orderBy: { sorteerVolgorde: "asc" },
            select: {
              titel: true,
              beschrijving: true,
              emoji: true,
              categorie: true,
              url: true,
            },
          })

          if (artikelen.length === 0) {
            return { gevonden: 0, bericht: "Geen artikelen gevonden over dit onderwerp." }
          }

          return {
            gevonden: artikelen.length,
            artikelen: artikelen.map((a) => ({
              titel: a.titel,
              beschrijving: a.beschrijving,
              emoji: a.emoji,
              categorie: a.categorie,
              url: a.url,
              appLink: `/leren/${a.categorie}`,
            })),
          }
        },
      }),

      gemeenteInfo: tool({
        description: "Haal informatie op over een gemeente: contactgegevens, advies, en steunpunten. Gebruik dit als iemand vraagt over hulp vanuit de gemeente.",
        inputSchema: z.object({
          gemeenteNaam: z.string().describe("Naam van de gemeente"),
        }),
        execute: async ({ gemeenteNaam }: { gemeenteNaam: string }) => {
          const gem = await prisma.gemeente.findFirst({
            where: {
              naam: { equals: gemeenteNaam, mode: "insensitive" },
              isActief: true,
            },
            select: {
              naam: true,
              contactEmail: true,
              contactTelefoon: true,
              websiteUrl: true,
              wmoLoketUrl: true,
              adviesLaag: true,
              adviesGemiddeld: true,
              adviesHoog: true,
              mantelzorgSteunpunt: true,
              mantelzorgSteunpuntNaam: true,
              respijtzorgUrl: true,
              dagopvangUrl: true,
            },
          })

          if (!gem) {
            return { gevonden: false, bericht: `Geen informatie gevonden over gemeente ${gemeenteNaam}.` }
          }

          return {
            gevonden: true,
            gemeente: {
              naam: gem.naam,
              telefoon: gem.contactTelefoon,
              email: gem.contactEmail,
              website: gem.websiteUrl,
              wmoLoket: gem.wmoLoketUrl,
              mantelzorgSteunpunt: gem.mantelzorgSteunpuntNaam,
              mantelzorgSteunpuntUrl: gem.mantelzorgSteunpunt,
              respijtzorg: gem.respijtzorgUrl,
              dagopvang: gem.dagopvangUrl,
            },
          }
        },
      }),

      bekijkBalanstest: tool({
        description: "Bekijk de meest recente balanstest resultaten van de gebruiker. Gebruik dit als iemand vraagt over hun testresultaten, score, hoe het met ze gaat, of als je advies wilt geven op basis van hun situatie.",
        inputSchema: z.object({}),
        execute: async () => {
          const test = await prisma.belastbaarheidTest.findFirst({
            where: { caregiver: { userId: session.user.id }, isCompleted: true },
            orderBy: { completedAt: "desc" },
            select: {
              id: true,
              totaleBelastingScore: true,
              belastingNiveau: true,
              totaleZorguren: true,
              completedAt: true,
              antwoorden: {
                select: { vraagId: true, vraagTekst: true, antwoord: true, score: true, gewicht: true },
                orderBy: { vraagId: "asc" },
              },
              taakSelecties: {
                where: { isGeselecteerd: true },
                select: { taakNaam: true, urenPerWeek: true, moeilijkheid: true },
                orderBy: { urenPerWeek: "desc" },
              },
              alarmLogs: {
                select: { type: true, beschrijving: true, urgentie: true },
              },
            },
          })

          if (!test) {
            return {
              gevonden: false,
              bericht: "Deze gebruiker heeft nog geen balanstest gedaan. Verwijs naar /belastbaarheidstest om de test te doen.",
            }
          }

          // Bereken deelgebied-scores
          const deelgebieden = berekenDeelgebieden(
            test.antwoorden.map((a) => ({ vraagId: a.vraagId, score: a.score, gewicht: a.gewicht }))
          )

          // Bepaal zware taken (MOEILIJK of ZEER_MOEILIJK)
          const zwareTaken = test.taakSelecties.filter(
            (t) => t.moeilijkheid === "MOEILIJK" || t.moeilijkheid === "ZEER_MOEILIJK"
          )

          return {
            gevonden: true,
            testDatum: test.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
            totaalScore: test.totaleBelastingScore,
            maxScore: 24,
            niveau: test.belastingNiveau,
            totaleZorguren: test.totaleZorguren,
            deelgebieden: deelgebieden.map((d) => ({
              naam: d.naam,
              emoji: d.emoji,
              score: d.score,
              maxScore: d.maxScore,
              percentage: d.percentage,
              niveau: d.niveau,
              tip: d.tip,
            })),
            zorgtaken: test.taakSelecties.map((t) => ({
              taak: t.taakNaam,
              urenPerWeek: t.urenPerWeek,
              moeilijkheid: t.moeilijkheid,
            })),
            zwareTaken: zwareTaken.map((t) => t.taakNaam),
            alarmen: test.alarmLogs.map((a) => ({
              type: a.type,
              beschrijving: a.beschrijving,
              urgentie: a.urgentie,
            })),
            vragenMetJa: test.antwoorden
              .filter((a) => a.antwoord === "ja")
              .map((a) => a.vraagTekst),
          }
        },
      }),

      bekijkTestTrend: tool({
        description: "Bekijk de trend van meerdere balanstesten over tijd. Gebruik dit als iemand vraagt of het beter of slechter gaat, of naar hun voortgang.",
        inputSchema: z.object({}),
        execute: async () => {
          const tests = await prisma.belastbaarheidTest.findMany({
            where: { caregiver: { userId: session.user.id }, isCompleted: true },
            orderBy: { completedAt: "asc" },
            take: 8,
            select: {
              totaleBelastingScore: true,
              belastingNiveau: true,
              totaleZorguren: true,
              completedAt: true,
              antwoorden: {
                select: { vraagId: true, score: true, gewicht: true },
              },
            },
          })

          if (tests.length === 0) {
            return {
              gevonden: false,
              bericht: "Deze gebruiker heeft nog geen balanstesten gedaan. Verwijs naar /belastbaarheidstest.",
            }
          }

          if (tests.length === 1) {
            return {
              gevonden: true,
              aantalTests: 1,
              bericht: "Er is pas 1 test gedaan. Na de volgende test kan ik een trend laten zien.",
              laatsteScore: tests[0].totaleBelastingScore,
              laatsteNiveau: tests[0].belastingNiveau,
            }
          }

          const eerste = tests[0]
          const laatste = tests[tests.length - 1]
          const scoreVerschil = (laatste.totaleBelastingScore ?? 0) - (eerste.totaleBelastingScore ?? 0)

          // Bereken deelgebieden voor eerste en laatste test
          const deelgebiedenEerst = berekenDeelgebieden(
            eerste.antwoorden.map((a) => ({ vraagId: a.vraagId, score: a.score, gewicht: a.gewicht }))
          )
          const deelgebiedenLaatst = berekenDeelgebieden(
            laatste.antwoorden.map((a) => ({ vraagId: a.vraagId, score: a.score, gewicht: a.gewicht }))
          )

          return {
            gevonden: true,
            aantalTests: tests.length,
            periode: {
              van: eerste.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
              tot: laatste.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
            },
            scoreTrend: {
              eersteScore: eerste.totaleBelastingScore,
              laatsteScore: laatste.totaleBelastingScore,
              verschil: scoreVerschil,
              richting: scoreVerschil < 0 ? "verbeterd" : scoreVerschil > 0 ? "verslechterd" : "gelijk",
            },
            zorguren: {
              eerst: eerste.totaleZorguren,
              laatst: laatste.totaleZorguren,
            },
            deelgebiedTrend: deelgebiedenEerst.map((d, i) => ({
              naam: d.naam,
              emoji: d.emoji,
              eersteNiveau: d.niveau,
              laatsteNiveau: deelgebiedenLaatst[i].niveau,
              eerstePercentage: d.percentage,
              laatstePercentage: deelgebiedenLaatst[i].percentage,
            })),
            alleScores: tests.map((t) => ({
              datum: t.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
              score: t.totaleBelastingScore,
              niveau: t.belastingNiveau,
            })),
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[AI Chat] Fout bij het genereren van een antwoord:", error)
    const message = error instanceof Error ? error.message : "Onbekende fout"
    return new Response(
      JSON.stringify({ error: `AI-chat fout: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
