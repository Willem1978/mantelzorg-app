/**
 * Tool: zoekHulpbronnen
 *
 * Zoekt zorgorganisaties met een EXPLICIETE keuze welke kant (hulp voor de
 * mantelzorger zelf, of hulp bij een taak voor de zorgvrager). De kant
 * bepaalt de gemeente-scope:
 *
 *   - kant = "zorgvrager-taak" → alleen gemeente zorgvrager
 *   - kant = "mantelzorger" en lotgenoten/praatgroep → alleen gemeente mantelzorger
 *   - kant = "mantelzorger" anders → BEIDE gemeenten
 *
 * De keuze van Ger om een tweesplitsing aan de gebruiker voor te leggen
 * gebeurt in de prompt; deze tool dwingt af dat de keuze daarna expliciet
 * in een parameter zit.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { TAAK_NAAM_VARIANTEN, HULP_VOOR_MANTELZORGER } from "@/config/options"
import { prioritizeUnshown, toKeySet } from "@/lib/ai/variation"
import { bepaalGemeenteScope, gemeentenVoorScope } from "@/lib/ai/hulp-categorisatie"
import { safeExecute } from "@/lib/ai/tools/_helpers"

// Bouwt een lijst van alle mogelijke onderdeelTest waarden voor een categorie
function getCategorieVarianten(categorie: string): string[] {
  const directVarianten = TAAK_NAAM_VARIANTEN[categorie]
  if (directVarianten) return [categorie, ...directVarianten]
  for (const [dbValue, varianten] of Object.entries(TAAK_NAAM_VARIANTEN)) {
    if (varianten.some((v) => v.toLowerCase() === categorie.toLowerCase())) {
      return [dbValue, ...varianten]
    }
  }
  return [categorie]
}

const MANTELZORGER_DBVALUES = HULP_VOOR_MANTELZORGER.map((c) => c.dbValue)

export function createZoekHulpbronnenTool(
  ctx:
    | { gemeenteZorgvrager: string | null; gemeenteMantelzorger: string | null; shownNamen?: string[] }
    | { gemeente: string | null; shownNamen?: string[] },
) {
  const ctxZorgvrager = "gemeenteZorgvrager" in ctx ? ctx.gemeenteZorgvrager : ctx.gemeente
  const ctxMantelzorger = "gemeenteMantelzorger" in ctx ? ctx.gemeenteMantelzorger : ctx.gemeente
  const shownSet = toKeySet(ctx.shownNamen)

  return tool({
    description:
      "Zoek hulporganisaties. Je MOET de parameter 'kant' meegeven: " +
      "'mantelzorger' (hulp voor de mantelzorger zelf — mantelzorgmakelaar, lotgenoten, respijtzorg, praten, ondersteuning) " +
      "of 'zorgvrager-taak' (hulp bij een taak die de mantelzorger doet voor de naaste — boodschappen, verzorging, vervoer, huishouden). " +
      "De gemeente-scope wordt automatisch bepaald: lotgenoten alleen in de stad van de mantelzorger, " +
      "andere mantelzorger-hulp in BEIDE steden, taken alleen in de stad van de zorgvrager.",
    inputSchema: z.object({
      kant: z
        .enum(["mantelzorger", "zorgvrager-taak"])
        .describe("Welke soort hulp: 'mantelzorger' (voor de mantelzorger zelf) of 'zorgvrager-taak' (bij een taak voor de naaste)"),
      categorie: z
        .string()
        .optional()
        .describe(
          "Specifieke categorie. Bij kant='mantelzorger': Informatie en advies / Educatie / Emotionele steun / " +
          "Persoonlijke begeleiding / Praktische hulp / Vervangende mantelzorg. " +
          "Bij kant='zorgvrager-taak': Boodschappen / Persoonlijke verzorging / Huishoudelijke taken / " +
          "Vervoer / Maaltijden / Klusjes / Administratie / Plannen / Sociaal contact / Huisdieren.",
        ),
      zoekterm: z.string().optional().describe("Zoekterm voor naam of beschrijving"),
    }),
    execute: async ({ kant, categorie, zoekterm }) => safeExecute("zoekHulpbronnen", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = { isActief: true }

      // Categorie-filter
      if (kant === "zorgvrager-taak") {
        if (categorie) {
          const varianten = getCategorieVarianten(categorie)
          where.onderdeelTest = { in: varianten }
        }
      } else {
        // kant = mantelzorger
        if (categorie) {
          const varianten = getCategorieVarianten(categorie)
          where.onderdeelTest = { in: varianten }
        } else {
          // Geen specifieke categorie: pak alle MANTELZORGER-categorieën + doelgroep MANTELZORGER
          where.OR = [
            { onderdeelTest: { in: MANTELZORGER_DBVALUES } },
            { doelgroep: "MANTELZORGER" },
          ]
        }
      }

      // Zoekterm
      if (zoekterm) {
        const zoektermFilter = {
          OR: [
            { naam: { contains: zoekterm, mode: "insensitive" as const } },
            { beschrijving: { contains: zoekterm, mode: "insensitive" as const } },
            { soortHulp: { contains: zoekterm, mode: "insensitive" as const } },
          ],
        }
        where.AND = Array.isArray(where.AND) ? [...where.AND, zoektermFilter] : [zoektermFilter]
      }

      // Haal kandidaten op (ruim, voor variatie). Gemeente-filter doen we
      // PER ORGANISATIE op basis van bepaalGemeenteScope, omdat lotgenoten
      // strikt lokaal moeten zijn maar mantelzorgmakelaar uit beide steden mag.
      const kandidaten = await prisma.zorgorganisatie.findMany({
        where,
        take: 50,
        orderBy: { naam: "asc" },
        select: {
          naam: true,
          beschrijving: true,
          telefoon: true,
          website: true,
          email: true,
          soortHulp: true,
          dienst: true,
          onderdeelTest: true,
          gemeente: true,
          dekkingNiveau: true,
          kosten: true,
          openingstijden: true,
          doelgroep: true,
          lokaalGebonden: true,
        },
      })

      // Filter per organisatie op de juiste gemeente(n) op basis van scope.
      // De DB-waarde `lokaalGebonden` overschrijft de heuristiek wanneer gezet.
      const passend = kandidaten.filter((k) => {
        // Landelijk (gemeente=null) mag altijd
        if (!k.gemeente) return true
        const scope = bepaalGemeenteScope(k.onderdeelTest, k.naam, k.dienst, {
          lokaalGebonden: k.lokaalGebonden,
        })
        const toegestaneGemeenten = gemeentenVoorScope(scope, ctxMantelzorger, ctxZorgvrager)
        if (toegestaneGemeenten.length === 0) {
          // Geen gemeenten bekend: laat alles toe (anders krijg je 0 resultaten)
          return true
        }
        return toegestaneGemeenten.some(
          (g) => g.toLowerCase() === (k.gemeente || "").toLowerCase(),
        )
      })

      const gesorteerd = prioritizeUnshown(passend, (r) => r.naam, shownSet)
      const resultaten = gesorteerd.slice(0, 8)

      if (resultaten.length === 0) {
        const gemSpec =
          kant === "zorgvrager-taak"
            ? ctxZorgvrager || "deze regio"
            : `${ctxMantelzorger || ""}${ctxZorgvrager && ctxZorgvrager !== ctxMantelzorger ? ` of ${ctxZorgvrager}` : ""}`.trim() || "deze regio"
        return {
          gevonden: 0,
          bericht: `Geen hulpbronnen gevonden voor ${kant} in ${gemSpec}. Geef de gebruiker algemeen advies en verwijs naar de gemeente of huisarts.`,
        }
      }

      return {
        gevonden: resultaten.length,
        kant,
        hulpbronnen: resultaten.map((r) => ({
          naam: r.naam,
          dienst: r.dienst,
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
    }),
  })
}
