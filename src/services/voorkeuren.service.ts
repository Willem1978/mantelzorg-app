/**
 * Voorkeuren Service
 *
 * Business logic voor het ophalen en opslaan van gebruikersvoorkeuren
 * (zorgthemas, tags, categorieen).
 * Gescheiden van HTTP-layer zodat het herbruikbaar is vanuit API routes,
 * WhatsApp webhooks en toekomstige integraties.
 */

import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"
import type { VoorkeurType } from "@prisma/client"

const log = createLogger("voorkeuren-service")

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoorkeurItem {
  type: string
  slug: string
}

export interface VoorkeurenData {
  voorkeuren: VoorkeurItem[]
  zorgthemas: string[]
}

export interface SaveVoorkeurenInput {
  voorkeuren?: VoorkeurItem[]
  zorgthemas?: string[]
}

export interface SaveVoorkeurenResult {
  ok: boolean
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Haal alle voorkeuren op voor een mantelzorger.
 * Filtert zorgthemas uit de TAG-voorkeuren op basis van actieve ContentTag-slugs.
 */
export async function getVoorkeuren(caregiverId: string): Promise<VoorkeurenData> {
  try {
    const voorkeuren = await prisma.gebruikerVoorkeur.findMany({
      where: { caregiverId },
      select: { type: true, slug: true },
    })

    // Haal zorgthema-tag-slugs op uit ContentTag
    const zorgthemaTagSlugs = await prisma.contentTag.findMany({
      where: { type: "ZORGTHEMA", isActief: true },
      select: { slug: true },
    })
    const zorgthemaSlugs = new Set(zorgthemaTagSlugs.map((t) => t.slug))

    // Filter zorgthema's uit voorkeuren
    const zorgthemas = voorkeuren
      .filter((v) => v.type === "TAG" && zorgthemaSlugs.has(v.slug))
      .map((v) => v.slug)

    return {
      voorkeuren: voorkeuren.map((v) => ({ type: v.type, slug: v.slug })),
      zorgthemas,
    }
  } catch (error) {
    log.error({ err: error, caregiverId }, "Fout bij ophalen voorkeuren")
    throw error
  }
}

/**
 * Sla voorkeuren op voor een mantelzorger.
 * Vervangt alle bestaande voorkeuren en werkt het legacy aandoening-veld bij.
 */
export async function saveVoorkeuren(
  caregiverId: string,
  input: SaveVoorkeurenInput,
): Promise<SaveVoorkeurenResult> {
  try {
    const { voorkeuren, zorgthemas } = input

    // Sla primaire zorgthema op in caregiver.aandoening (legacy veld)
    if (zorgthemas !== undefined) {
      await prisma.caregiver.update({
        where: { id: caregiverId },
        data: { aandoening: zorgthemas?.[0] || null },
      })
    }

    // Bouw de volledige voorkeuren-lijst: handmatige tags + categorieen + zorgthemas als TAG
    const alleVoorkeuren = [...(voorkeuren || [])]

    // Voeg zorgthemas toe als TAG-voorkeuren
    if (zorgthemas && zorgthemas.length > 0) {
      for (const slug of zorgthemas) {
        if (!alleVoorkeuren.some((v) => v.type === "TAG" && v.slug === slug)) {
          alleVoorkeuren.push({ type: "TAG", slug })
        }
      }
    }

    // Vervang alle voorkeuren
    await prisma.gebruikerVoorkeur.deleteMany({
      where: { caregiverId },
    })

    if (alleVoorkeuren.length > 0) {
      await prisma.gebruikerVoorkeur.createMany({
        data: alleVoorkeuren.map((v) => ({
          caregiverId,
          type: v.type as VoorkeurType,
          slug: v.slug,
        })),
      })
    }

    log.info({ caregiverId, count: alleVoorkeuren.length }, "Voorkeuren opgeslagen")

    return { ok: true }
  } catch (error) {
    log.error({ err: error, caregiverId }, "Fout bij opslaan voorkeuren")
    throw error
  }
}
