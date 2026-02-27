import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { berekenDeelgebieden } from "@/lib/dashboard/deelgebieden"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Je bent Ger, de vriendelijke maar doortastende coach van de MantelBuddy app.
Je helpt mantelzorgers in Nederland. Je geeft geen vage antwoorden, maar concrete hulp.

TAALGEBRUIK:
- Simpel Nederlands (B1 niveau), korte zinnen
- Warm en begripvol, maar ook duidelijk en eerlijk
- Gebruik "je" en "jij" (geen "u")

JE BENT EEN PROACTIEVE COACH. VOLG DIT PAD:

STAP 1 — ALTIJD EERST CHECKEN:
Roep ALTIJD als eerste "bekijkBalanstest" aan om te zien of de gebruiker een test heeft gedaan.
- Geen test? → Moedig aan om de balanstest te doen: "Ik kan je beter helpen als je eerst de balanstest doet. Dat duurt maar 5 minuten." Verwijs naar /belastbaarheidstest.
- Wel een test? → Ga naar stap 2.

STAP 2 — TOTAALSCORE BEOORDELEN:
Gebruik het "adviesVoorTotaal" veld als dat gevuld is — dat is het door de beheerder ingestelde advies.
- HOOG (rood, score 13-24): Dit is urgent. Gebruik adviesVoorTotaal als dat er is.
  • Als er een gemeenteContact in de resultaten zit, verwijs daar EERST naar: "Bij [naam] kun je terecht voor een gesprek over jouw situatie. Bel [telefoon]." Dit is de belangrijkste stap.
  • Noem ook de Mantelzorglijn (030-205 90 59).
  • Verwijs naar /rapport voor het volledige rapport.
- GEMIDDELD (oranje, score 7-12): Gebruik adviesVoorTotaal. Erken de druk.
  • Als er een gemeenteContact is, noem die als optie voor ondersteuning.
- LAAG (groen, score 0-6): Gebruik adviesVoorTotaal. Complimenteer!

STAP 3 — DEELGEBIEDEN CHECKEN (Energie, Gevoel, Tijd):
Kijk welke deelgebieden HOOG of GEMIDDELD scoren. Bespreek die:
- Noem het deelgebied bij naam
- Gebruik de "tip" tekst die per deelgebied wordt meegegeven (dit is het door de beheerder ingestelde advies)
- Zoek hulpbronnen die relevant zijn via "zoekHulpbronnen"
- Verwijs naar artikelen via "zoekArtikelen" voor tips
Prioriteer: eerst HOOG deelgebieden, dan GEMIDDELD.

STAP 4 — ZORGTAKEN CHECKEN:
Kijk welke zorgtaken MOEILIJK of ZEER_MOEILIJK scoren (de "zwareTaken" lijst).
- Noem deze taken concreet: "Je geeft aan dat [taak] zwaar is."
- Gebruik het "advies" veld per zware taak als dat gevuld is (dit is door de beheerder ingesteld)
- Kijk of er hulpbronnen in "hulpPerTaak" staan en noem die met contactgegevens
- Zoek eventueel extra hulpbronnen via "zoekHulpbronnen" met de taak als categorie
- Verwijs naar /hulpvragen voor meer opties

STAP 5 — AFSLUITING:
- Verwijs naar /rapport voor het volledige rapport
- Bij HOOG: eindig met "Je hoeft dit niet alleen te doen."
- Bij GEMIDDELD: eindig met "Kleine stappen helpen ook."
- Bij LAAG: eindig met "Blijf goed voor jezelf zorgen."

BELANGRIJK:
- Geef ALTIJD contactgegevens als je een hulpbron noemt (telefoon, email, website)
- Alles uit de database, geen verzonnen telefoonnummers of websites
- Bij alarmen (HOGE_BELASTING, EMOTIONELE_NOOD etc.): wees extra zorgzaam
- Geen medisch advies, geen diagnoses. Bij crisis → 112 of huisarts.
- Als iemand een gewone vraag stelt (niet over resultaten), beantwoord die gewoon. Maar als je merkt dat ze het zwaar hebben, check hun resultaten.

ACTIEKNOPPEN — Je kunt klikbare knoppen tonen aan de gebruiker:
Gebruik deze syntax aan het EINDE van je bericht (na de tekst, op eigen regels):

Navigatieknop (gaat naar een pagina):
{{knop:Label:/pad}}

Vraagknop (stuurt een vraag naar jou):
{{vraag:Vraagtekst}}

Voorbeelden:
{{knop:Doe de balanstest:/belastbaarheidstest}}
{{knop:Bekijk je rapport:/rapport}}
{{knop:Zoek hulp in de buurt:/hulpvragen}}
{{vraag:Hoe zijn mijn resultaten?}}
{{vraag:Welke hulp is er bij mij in de buurt?}}
{{vraag:Gaat het beter dan vorige keer?}}

Regels voor knoppen:
- Gebruik ALTIJD minstens 1 knop aan het einde van je antwoord
- Na coaching met testresultaten: toon "Bekijk je rapport" knop + relevante vervolgvragen
- Als er geen test is: toon "Doe de balanstest" knop
- Bij zware taken: toon "Zoek hulp in de buurt" knop
- Max 3-4 knoppen per bericht, mix van navigatie en vraagknoppen
- Zet knoppen ALTIJD aan het einde, na alle tekst

APP PAGINA'S:
- /belastbaarheidstest — Balanstest doen
- /rapport — Je persoonlijke rapport bekijken
- /balanstest — Overzicht van al je testen
- /hulpvragen — Hulp zoeken bij jou in de buurt
- /check-in — Maandelijkse check-in
- /leren — Tips en informatie
- /agenda — Je agenda
- /profiel — Je profiel aanpassen`

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
    maxOutputTokens: 2048,
    stopWhen: stepCountIs(5),
    tools: {
      bekijkBalanstest: tool({
        description: "Bekijk de meest recente balanstest resultaten van de gebruiker. ROEP DIT ALTIJD AAN als de gebruiker vraagt hoe het gaat, over resultaten, of als je wilt coachen. Retourneert scores, deelgebieden, zorgtaken, alarmen, EN de gekoppelde gemeente-hulpbron.",
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
              bericht: "Deze gebruiker heeft nog geen balanstest gedaan.",
              actie: "Verwijs naar /belastbaarheidstest om de test te doen. Leg uit dat het 5 minuten duurt en dat je daarna veel beter kunt helpen.",
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

          // Bepaal probleem-deelgebieden (HOOG of GEMIDDELD)
          const probleemDeelgebieden = deelgebieden.filter(
            (d) => d.niveau === "HOOG" || d.niveau === "GEMIDDELD"
          )

          // Haal configureerbare coach-adviezen op uit de database
          const coachAdviezen = await prisma.coachAdvies.findMany({
            where: { isActief: true },
            select: { sleutel: true, advies: true },
          })
          const adviesMap = Object.fromEntries(coachAdviezen.map((a) => [a.sleutel, a.advies]))

          // Haal gemeente-gekoppelde hulpbron op voor het juiste niveau
          let gemeenteContact: {
            naam: string
            telefoon: string | null
            email: string | null
            website: string | null
            beschrijving: string | null
            gemeente: string
            adviesTekst: string | null
          } | null = null

          if (gemeente) {
            const gem = await prisma.gemeente.findFirst({
              where: { naam: { equals: gemeente, mode: "insensitive" }, isActief: true },
              select: {
                naam: true,
                organisatieLaagId: true,
                organisatieGemiddeldId: true,
                organisatieHoogId: true,
                adviesLaag: true,
                adviesGemiddeld: true,
                adviesHoog: true,
                contactTelefoon: true,
                contactEmail: true,
                websiteUrl: true,
                mantelzorgSteunpuntNaam: true,
                mantelzorgSteunpunt: true,
                wmoLoketUrl: true,
              },
            })

            if (gem) {
              // Pak de organisatie-ID die hoort bij het niveau van de gebruiker
              const orgId = test.belastingNiveau === "HOOG"
                ? gem.organisatieHoogId
                : test.belastingNiveau === "GEMIDDELD"
                  ? gem.organisatieGemiddeldId
                  : gem.organisatieLaagId

              // Pak het advies dat hoort bij het niveau
              const adviesTekst = test.belastingNiveau === "HOOG"
                ? gem.adviesHoog
                : test.belastingNiveau === "GEMIDDELD"
                  ? gem.adviesGemiddeld
                  : gem.adviesLaag

              if (orgId) {
                const org = await prisma.zorgorganisatie.findUnique({
                  where: { id: orgId },
                  select: { naam: true, telefoon: true, email: true, website: true, beschrijving: true },
                })
                if (org) {
                  gemeenteContact = {
                    naam: org.naam,
                    telefoon: org.telefoon,
                    email: org.email,
                    website: org.website,
                    beschrijving: org.beschrijving,
                    gemeente: gem.naam,
                    adviesTekst,
                  }
                }
              }

              // Fallback: als er geen gekoppelde org is, gebruik gemeente-contactgegevens
              if (!gemeenteContact && (gem.contactTelefoon || gem.contactEmail || gem.mantelzorgSteunpuntNaam)) {
                gemeenteContact = {
                  naam: gem.mantelzorgSteunpuntNaam || `Gemeente ${gem.naam}`,
                  telefoon: gem.contactTelefoon,
                  email: gem.contactEmail,
                  website: gem.mantelzorgSteunpunt || gem.websiteUrl,
                  beschrijving: gem.mantelzorgSteunpuntNaam
                    ? "Steunpunt mantelzorg in jouw gemeente"
                    : "Neem contact op met je gemeente voor ondersteuning",
                  gemeente: gem.naam,
                  adviesTekst,
                }
              }
            }
          }

          // Zoek automatisch lokale hulpbronnen voor zware taken
          const hulpPerTaak: Record<string, { naam: string; telefoon: string | null; website: string | null; soortHulp: string | null }[]> = {}
          for (const taak of zwareTaken.slice(0, 3)) { // Max 3 taken om query's beperkt te houden
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const taakWhere: Record<string, any> = {
              isActief: true,
              onderdeelTest: { contains: taak.taakNaam, mode: "insensitive" },
            }
            if (gemeente) {
              taakWhere.OR = [
                { gemeente: { equals: gemeente, mode: "insensitive" } },
                { dekkingNiveau: "LANDELIJK" },
                { gemeente: null },
              ]
            }
            const hulp = await prisma.zorgorganisatie.findMany({
              where: taakWhere,
              take: 3,
              orderBy: { naam: "asc" },
              select: { naam: true, telefoon: true, website: true, soortHulp: true },
            })
            if (hulp.length > 0) {
              hulpPerTaak[taak.taakNaam] = hulp
            }
          }

          // Map deelgebied-namen naar sleutels voor advies-lookup
          const deelgebiedSleutelMap: Record<string, string> = {
            "Jouw energie": "energie",
            "Jouw gevoel": "gevoel",
            "Jouw tijd": "tijd",
          }

          // Map taak-namen naar taak-IDs voor advies-lookup
          const taakIdMap: Record<string, string> = {
            "Persoonlijke verzorging": "t1",
            "Huishoudelijke taken": "t2",
            "Bereiden en/of nuttigen van maaltijden": "t3",
            "Boodschappen": "t4",
            "Administratie en aanvragen": "t5",
            "Vervoer": "t6",
            "Sociaal contact en activiteiten": "t7",
            "Klusjes in en om het huis": "t8",
            "Plannen en organiseren": "t9",
            "Huisdieren": "t10",
          }

          return {
            gevonden: true,
            testDatum: test.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
            totaalScore: test.totaleBelastingScore,
            maxScore: 24,
            niveau: test.belastingNiveau,
            totaleZorguren: test.totaleZorguren,
            adviesVoorTotaal: adviesMap[`totaal.${test.belastingNiveau}`] || null,
            deelgebieden: deelgebieden.map((d) => {
              const sleutel = deelgebiedSleutelMap[d.naam] || ""
              return {
                naam: d.naam,
                emoji: d.emoji,
                score: d.score,
                maxScore: d.maxScore,
                percentage: d.percentage,
                niveau: d.niveau,
                tip: adviesMap[`${sleutel}.${d.niveau}`] || d.tip,
              }
            }),
            probleemDeelgebieden: probleemDeelgebieden.map((d) => {
              const sleutel = deelgebiedSleutelMap[d.naam] || ""
              return {
                naam: d.naam,
                niveau: d.niveau,
                tip: adviesMap[`${sleutel}.${d.niveau}`] || d.tip,
              }
            }),
            zorgtaken: test.taakSelecties.map((t) => ({
              taak: t.taakNaam,
              urenPerWeek: t.urenPerWeek,
              moeilijkheid: t.moeilijkheid,
            })),
            zwareTaken: zwareTaken.map((t) => {
              const tid = taakIdMap[t.taakNaam]
              return {
                taak: t.taakNaam,
                urenPerWeek: t.urenPerWeek,
                moeilijkheid: t.moeilijkheid,
                advies: tid ? (adviesMap[`taak.${tid}.advies`] || null) : null,
              }
            }),
            hulpPerTaak,
            gemeenteContact,
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

      zoekHulpbronnen: tool({
        description: "Zoek hulporganisaties en zorgaanbieders. Gebruik dit om lokale hulp te vinden voor specifieke problemen, deelgebieden of zorgtaken.",
        inputSchema: z.object({
          zoekterm: z.string().optional().describe("Zoekterm voor naam of beschrijving"),
          gemeente: z.string().optional().describe("Gemeente naam om lokaal te zoeken"),
          categorie: z.string().optional().describe("Categorie/taak zoals: Persoonlijke verzorging, Huishoudelijke taken, Vervangende mantelzorg, Emotionele steun, etc."),
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
        description: "Zoek informatie-artikelen en tips over mantelzorg. Gebruik dit voor advies en informatie over specifieke onderwerpen (slaap, energie, zelfzorg, rechten, financieel).",
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
        description: "Haal contactgegevens en advies op voor een specifieke gemeente. Gebruik als je meer gemeenteinfo nodig hebt dan wat bekijkBalanstest al geeft.",
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
