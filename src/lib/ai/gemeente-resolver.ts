/**
 * Resolves gemeente contact information based on belastingniveau.
 * Used by multiple agents to find the right support organization.
 */
import { prisma } from "@/lib/prisma"
import type { GemeenteContact } from "./types"

/**
 * Zoek de juiste contactpersoon/organisatie voor een gemeente op basis van belastingniveau.
 * Retourneert de gekoppelde zorgorganisatie, of valt terug op gemeente-contactgegevens.
 */
export async function resolveGemeenteContact(
  gemeente: string,
  belastingNiveau: string
): Promise<GemeenteContact | null> {
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

  if (!gem) return null

  const orgId =
    belastingNiveau === "HOOG"
      ? gem.organisatieHoogId
      : belastingNiveau === "GEMIDDELD"
        ? gem.organisatieGemiddeldId
        : gem.organisatieLaagId

  const adviesTekst =
    belastingNiveau === "HOOG"
      ? gem.adviesHoog
      : belastingNiveau === "GEMIDDELD"
        ? gem.adviesGemiddeld
        : gem.adviesLaag

  if (orgId) {
    const org = await prisma.zorgorganisatie.findUnique({
      where: { id: orgId },
      select: { naam: true, telefoon: true, email: true, website: true, beschrijving: true },
    })
    if (org) {
      return {
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

  // Fallback: gemeente-contactgegevens
  if (gem.contactTelefoon || gem.contactEmail || gem.mantelzorgSteunpuntNaam) {
    return {
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

  return null
}
