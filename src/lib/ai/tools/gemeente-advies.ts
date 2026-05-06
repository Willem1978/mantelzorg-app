/**
 * Tool: bekijkGemeenteAdvies
 *
 * Haalt het gemeente-specifieke advies per belastingniveau op,
 * inclusief de gekoppelde organisatie en contactgegevens.
 *
 * Dit is het PRIMAIRE advies dat de MantelCoach moet geven —
 * beheerd via het beheerportaal per gemeente.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { safeExecute } from "@/lib/ai/tools/_helpers"

export function createBekijkGemeenteAdviesTool(ctx: {
  gemeenteZorgvrager: string | null
  gemeenteMantelzorger: string | null
}) {
  return tool({
    description:
      "Haal het advies en de aanbevolen organisatie op voor een belastingniveau, specifiek voor de gemeente van de gebruiker. Dit is het primaire advies dat je moet geven. Gebruik dit na het bekijken van de balanstest.",
    inputSchema: z.object({
      niveau: z
        .enum(["LAAG", "GEMIDDELD", "HOOG"])
        .describe("Het belastingniveau waarvoor je advies wilt ophalen"),
    }),
    execute: async ({ niveau }) => safeExecute("bekijkGemeenteAdvies", async () => {
      const gemeenteNaam = ctx.gemeenteZorgvrager || ctx.gemeenteMantelzorger
      if (!gemeenteNaam) {
        return {
          gevonden: false,
          bericht: "Gemeente van de gebruiker is niet bekend. Vraag de mantelzorger om het profiel aan te vullen.",
        }
      }

      // Haal gemeente config op
      const gemeente = await prisma.gemeente.findUnique({
        where: { naam: gemeenteNaam },
      })

      if (!gemeente) {
        return {
          gevonden: false,
          bericht: `Gemeente "${gemeenteNaam}" is nog niet geconfigureerd in het systeem. Gebruik de algemene adviezen.`,
        }
      }

      // Selecteer het advies en de organisatie voor het juiste niveau
      let adviesTekst: string | null = null
      let organisatieId: string | null = null

      switch (niveau) {
        case "LAAG":
          adviesTekst = gemeente.adviesLaag
          organisatieId = gemeente.organisatieLaagId
          break
        case "GEMIDDELD":
          adviesTekst = gemeente.adviesGemiddeld
          organisatieId = gemeente.organisatieGemiddeldId
          break
        case "HOOG":
          adviesTekst = gemeente.adviesHoog
          organisatieId = gemeente.organisatieHoogId
          break
      }

      // Haal de gekoppelde organisatie op als die er is
      let organisatie = null
      if (organisatieId) {
        organisatie = await prisma.zorgorganisatie.findUnique({
          where: { id: organisatieId },
          select: {
            naam: true,
            beschrijving: true,
            dienst: true,
            telefoon: true,
            website: true,
            email: true,
            gemeente: true,
            kosten: true,
            openingstijden: true,
            soortHulp: true,
          },
        })
      }

      // Haal de stappen op voor dit niveau
      const stappen = await prisma.gemeenteStap.findMany({
        where: {
          gemeenteNaam: gemeenteNaam,
          niveau,
          isActief: true,
        },
        orderBy: { stapNummer: "asc" },
        select: {
          stapNummer: true,
          titel: true,
          beschrijving: true,
          emoji: true,
          externeUrl: true,
          organisatieId: true,
          artikelId: true,
        },
      })

      // Fallback naar _default stappen als er geen gemeente-specifieke zijn
      const effectieveStappen = stappen.length > 0
        ? stappen
        : await prisma.gemeenteStap.findMany({
            where: {
              gemeenteNaam: "_default",
              niveau,
              isActief: true,
            },
            orderBy: { stapNummer: "asc" },
            select: {
              stapNummer: true,
              titel: true,
              beschrijving: true,
              emoji: true,
              externeUrl: true,
              organisatieId: true,
              artikelId: true,
            },
          })

      return {
        gevonden: true,
        gemeente: gemeenteNaam,
        niveau,
        advies: adviesTekst || `Geen specifiek advies voor niveau ${niveau} bij gemeente ${gemeenteNaam}.`,
        organisatie: organisatie
          ? {
              naam: organisatie.naam,
              beschrijving: organisatie.beschrijving,
              dienst: organisatie.dienst,
              telefoon: organisatie.telefoon,
              website: organisatie.website,
              email: organisatie.email,
              kosten: organisatie.kosten,
              openingstijden: organisatie.openingstijden,
              soortHulp: organisatie.soortHulp,
            }
          : null,
        contactGegevens: {
          email: gemeente.contactEmail,
          telefoon: gemeente.contactTelefoon,
          website: gemeente.websiteUrl,
          wmoLoket: gemeente.wmoLoketUrl,
          mantelzorgSteunpunt: gemeente.mantelzorgSteunpuntNaam
            ? { naam: gemeente.mantelzorgSteunpuntNaam, url: gemeente.mantelzorgSteunpunt }
            : null,
          respijtzorg: gemeente.respijtzorgUrl,
          dagopvang: gemeente.dagopvangUrl,
        },
        stappen: effectieveStappen.map(s => ({
          stap: s.stapNummer,
          emoji: s.emoji,
          titel: s.titel,
          beschrijving: s.beschrijving,
          url: s.externeUrl,
        })),
      }
    }),
  })
}
