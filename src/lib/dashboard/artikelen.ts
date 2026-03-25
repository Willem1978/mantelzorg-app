/**
 * Dashboard helper: gepersonaliseerde artikelen ophalen.
 *
 * Gebruikt de relevantie-score uit lib/relevantie.ts om artikelen
 * te rangschikken op basis van tag-overlap met het gebruikersprofiel.
 *
 * Fallback: als er geen tags/profiel zijn, worden artikelen
 * geselecteerd op basis van belastingniveau (oude logica).
 */

import { prisma } from "@/lib/prisma"
import { getGepersonaliseerdeArtikelen, type AanbevolenArtikel } from "@/lib/relevantie"

export async function getAanbevolenArtikelen(
  belastingNiveau: string | null,
  gemeente: string | null,
  caregiverId?: string | null,
): Promise<AanbevolenArtikel[]> {
  try {
    // Laad gebruikersprofiel (tags + interesses) als caregiverId beschikbaar is
    let zorgthemaSlugs: string[] = []
    let situatieTagSlugs: string[] = []
    let interesseCategorieen: string[] = []

    if (caregiverId) {
      const voorkeuren = await prisma.gebruikerVoorkeur.findMany({
        where: { caregiverId },
        select: { type: true, slug: true },
      })

      zorgthemaSlugs = voorkeuren
        .filter((v) => v.type === "TAG" && isZorgthemaSlug(v.slug))
        .map((v) => v.slug)

      // Als geen zorgthemas via TAG, check via Caregiver.aandoening (legacy)
      if (zorgthemaSlugs.length === 0) {
        const caregiver = await prisma.caregiver.findUnique({
          where: { id: caregiverId },
          select: { aandoening: true },
        })
        if (caregiver?.aandoening) {
          zorgthemaSlugs = [caregiver.aandoening]
        }
      }

      situatieTagSlugs = voorkeuren
        .filter((v) => v.type === "TAG" && !isZorgthemaSlug(v.slug))
        .map((v) => v.slug)

      interesseCategorieen = voorkeuren
        .filter((v) => v.type === "CATEGORIE")
        .map((v) => v.slug)
    }

    const heeftProfiel = zorgthemaSlugs.length > 0 || situatieTagSlugs.length > 0 || interesseCategorieen.length > 0

    // Haal alle gepubliceerde artikelen op met hun tags
    const artikelen = await prisma.artikel.findMany({
      where: {
        isActief: true,
        status: "GEPUBLICEERD",
        type: "ARTIKEL",
        OR: [
          { publicatieDatum: null },
          { publicatieDatum: { lte: new Date() } },
        ],
      },
      orderBy: [{ sorteerVolgorde: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        emoji: true,
        categorie: true,
        url: true,
        tags: {
          select: {
            tag: {
              select: { slug: true, type: true, naam: true },
            },
          },
        },
      },
    })

    // Gepersonaliseerd als profiel beschikbaar
    if (heeftProfiel) {
      return getGepersonaliseerdeArtikelen(artikelen, {
        zorgthemaSlugs,
        situatieTagSlugs,
        interesseCategorieen,
      }, 5)
    }

    // Fallback: categorie-selectie op basis van belastingniveau
    let categorieen: string[]
    if (belastingNiveau === "LAAG") {
      categorieen = ["zelfzorg-balans", "dagelijks-zorgen"]
    } else if (belastingNiveau === "GEMIDDELD") {
      categorieen = ["rechten-regelingen", "dagelijks-zorgen", "zelfzorg-balans"]
    } else if (belastingNiveau === "HOOG") {
      categorieen = ["zelfzorg-balans", "rechten-regelingen", "geld-financien"]
    } else {
      categorieen = ["dagelijks-zorgen", "zelfzorg-balans"]
    }

    return artikelen
      .filter((a) => categorieen.includes(a.categorie))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        titel: a.titel,
        beschrijving: a.beschrijving,
        emoji: a.emoji,
        categorie: a.categorie,
        url: a.url,
        relevantieScore: 0,
        matchRedenen: ["Populair artikel"],
      }))
  } catch {
    return []
  }
}

// Bekende zorgthema slugs (uit seed)
const ZORGTHEMA_SLUGS = new Set([
  "geheugen-cognitie", "lichamelijk", "psychisch-emotioneel",
  "beperking-begeleiding", "ouder-worden", "ernstig-ziek",
])

function isZorgthemaSlug(slug: string): boolean {
  return ZORGTHEMA_SLUGS.has(slug)
}
