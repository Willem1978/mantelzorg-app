/**
 * Tool: gemeenteInfo
 * Haalt contactgegevens en advies op voor een specifieke gemeente.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createGemeenteInfoTool() {
  return tool({
    description:
      "Haal contactgegevens en advies op voor een specifieke gemeente. Gebruik als je meer gemeenteinfo nodig hebt dan wat bekijkBalanstest al geeft.",
    inputSchema: z.object({
      gemeenteNaam: z.string().describe("Naam van de gemeente"),
    }),
    execute: async ({ gemeenteNaam }) => {
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
  })
}
