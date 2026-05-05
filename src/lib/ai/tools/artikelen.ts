/**
 * Tool: zoekArtikelen
 * Zoekt gepubliceerde artikelen en tips over mantelzorg.
 * Geeft ook de artikelinhoud mee zodat de coach concrete informatie
 * uit het artikel kan gebruiken in zijn advies.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { prioritizeUnshown, toKeySet } from "@/lib/ai/variation"

/**
 * Strip HTML tags en trim tot maxLengte tekens.
 * Zo kan de coach de inhoud gebruiken zonder HTML-rommel.
 */
function stripHtmlAndTrim(html: string | null, maxLengte = 1500): string | null {
  if (!html) return null
  const tekst = html
    .replace(/<[^>]*>/g, " ")    // HTML tags verwijderen
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")        // Meerdere spaties samenvoegen
    .trim()
  if (tekst.length <= maxLengte) return tekst
  return tekst.slice(0, maxLengte) + "..."
}

export function createZoekArtikelenTool(ctx: { shownTitels?: string[] } = {}) {
  const shownSet = toKeySet(ctx.shownTitels)

  return tool({
    description:
      "Zoek informatie-artikelen en tips over mantelzorg. Gebruik dit voor advies en informatie over specifieke onderwerpen (slaap, energie, zelfzorg, rechten, financieel). Je krijgt de artikelinhoud zodat je er concreet uit kunt putten in je antwoord. BELANGRIJK: toon gevonden artikelen als {{artikelkaart:ID|titel|emoji|categorie}} (4 velden, GEEN inhoud — die haalt de client zelf op via de id). De gebruiker kan op de kaart klikken om te lezen, opslaan als favoriet en mailen.",
    inputSchema: z.object({
      categorie: z
        .string()
        .optional()
        .describe("Categorie slug: dagelijks-zorgen, zelfzorg-balans, rechten-regelingen, geld-financien, hulpmiddelen-technologie, werk-mantelzorg, samenwerken-netwerk"),
      tag: z
        .string()
        .optional()
        .describe("Tag slug voor aandoening of situatie, bijv: dementie, kanker, psychisch, jong, werkend, op-afstand"),
      zoekterm: z.string().optional().describe("Zoekterm in titel of beschrijving"),
    }),
    execute: async ({ categorie, tag, zoekterm }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {
        isActief: true,
        status: "GEPUBLICEERD",
        type: "ARTIKEL",
      }

      if (categorie) {
        where.categorie = categorie
      }

      if (tag) {
        where.tags = { some: { tag: { slug: tag } } }
      }

      if (zoekterm) {
        where.OR = [
          { titel: { contains: zoekterm, mode: "insensitive" } },
          { beschrijving: { contains: zoekterm, mode: "insensitive" } },
        ]
      }

      // Haal een ruimere set op zodat we kunnen variëren tussen chat-beurten:
      // titels die de gebruiker al heeft gezien gaan achteraan.
      const ruwe = await prisma.artikel.findMany({
        where,
        take: 15,
        orderBy: { sorteerVolgorde: "asc" },
        select: {
          id: true,
          titel: true,
          beschrijving: true,
          inhoud: true,
          emoji: true,
          categorie: true,
          url: true,
          tags: {
            select: { tag: { select: { slug: true, naam: true } } },
          },
        },
      })

      const gesorteerd = prioritizeUnshown(ruwe, (a) => a.titel, shownSet)
      const artikelen = gesorteerd.slice(0, 5)

      if (artikelen.length === 0) {
        return { gevonden: 0, bericht: "Geen artikelen gevonden over dit onderwerp." }
      }

      return {
        gevonden: artikelen.length,
        // De `id` is wat in de {{artikelkaart:...}} token moet komen.
        // De `inhoud` krijgt het model mee als context, maar mag NIET in de
        // kaart-token verschijnen — de client haalt de volledige inhoud zelf
        // op via /api/artikelen/[id] zodragebruiker de kaart aanklikt.
        artikelen: artikelen.map((a) => ({
          id: a.id,
          titel: a.titel,
          beschrijving: a.beschrijving,
          inhoudVoorJou: stripHtmlAndTrim(a.inhoud),
          emoji: a.emoji,
          categorie: a.categorie,
          url: a.url,
          tags: a.tags.map((t) => t.tag.naam),
          appLink: `/leren/${a.categorie}`,
          kaartSyntax: `{{artikelkaart:${a.id}|${a.titel}|${a.emoji || "📄"}|${a.categorie}}}`,
        })),
      }
    },
  })
}
