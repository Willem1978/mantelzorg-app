/**
 * Tool: bekijkBalanstest
 * Haalt de meest recente balanstest resultaten op met deelgebieden,
 * zorgtaken, alarmen, coach-adviezen en gemeente-hulpbron.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { berekenDeelgebieden } from "@/lib/dashboard/deelgebieden"
import { loadCoachAdviezen } from "@/lib/ai/coach-advies"
import { resolveGemeenteContact } from "@/lib/ai/gemeente-resolver"
import { DEELGEBIED_SLEUTEL_MAP, TAAK_ID_MAP } from "@/lib/ai/types"
import type { HulpbronResult } from "@/lib/ai/types"

export function createBekijkBalanstestTool(ctx: { userId: string; gemeente: string | null }) {
  return tool({
    description:
      "Bekijk de meest recente balanstest resultaten van de gebruiker. ROEP DIT ALTIJD AAN als de gebruiker vraagt hoe het gaat, over resultaten, of als je wilt coachen. Retourneert scores, deelgebieden, zorgtaken, alarmen, EN de gekoppelde gemeente-hulpbron.",
    inputSchema: z.object({}),
    execute: async () => {
      const test = await prisma.belastbaarheidTest.findFirst({
        where: { caregiver: { userId: ctx.userId }, isCompleted: true },
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

      const deelgebieden = berekenDeelgebieden(
        test.antwoorden.map((a) => ({ vraagId: a.vraagId, score: a.score, gewicht: a.gewicht }))
      )

      const zwareTaken = test.taakSelecties.filter(
        (t) => t.moeilijkheid === "MOEILIJK" || t.moeilijkheid === "ZEER_MOEILIJK"
      )

      const probleemDeelgebieden = deelgebieden.filter(
        (d) => d.niveau === "HOOG" || d.niveau === "GEMIDDELD"
      )

      const adviesMap = await loadCoachAdviezen()

      // Gemeente contact
      const gemeenteContact =
        ctx.gemeente && test.belastingNiveau
          ? await resolveGemeenteContact(ctx.gemeente, test.belastingNiveau)
          : null

      // Hulpbronnen per zware taak (max 3 taken, 3 bronnen per taak)
      const hulpPerTaak: Record<string, HulpbronResult[]> = {}
      for (const taak of zwareTaken.slice(0, 3)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const taakWhere: Record<string, any> = {
          isActief: true,
          onderdeelTest: { contains: taak.taakNaam, mode: "insensitive" },
        }
        if (ctx.gemeente) {
          taakWhere.OR = [
            { gemeente: { equals: ctx.gemeente, mode: "insensitive" } },
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

      return {
        gevonden: true,
        testDatum: test.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
        totaalScore: test.totaleBelastingScore,
        maxScore: 24,
        niveau: test.belastingNiveau,
        totaleZorguren: test.totaleZorguren,
        adviesVoorTotaal: adviesMap[`totaal.${test.belastingNiveau}`] || null,
        deelgebieden: deelgebieden.map((d) => {
          const sleutel = DEELGEBIED_SLEUTEL_MAP[d.naam] || ""
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
          const sleutel = DEELGEBIED_SLEUTEL_MAP[d.naam] || ""
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
          const tid = TAAK_ID_MAP[t.taakNaam]
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
  })
}
