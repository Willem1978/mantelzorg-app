/**
 * Server-side content helper.
 * Haalt content teksten op uit SiteSettings met fallback naar defaults.
 */
import { prisma } from "./prisma"

/**
 * Haal alle SiteSettings op met een bepaald prefix.
 * Retourneert een key-value map met het prefix er af gestript.
 *
 * @example
 * const overrides = await getContentOverrides("rapport")
 * // { "niveaus.HOOG.title": "Je bent overbelast", ... }
 */
export async function getContentOverrides(prefix: string): Promise<Record<string, string>> {
  try {
    const settings = await prisma.siteSettings.findMany({
      where: { sleutel: { startsWith: `${prefix}.` } },
      select: { sleutel: true, waarde: true },
    })

    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.sleutel.substring(prefix.length + 1)] = s.waarde
    }
    return map
  } catch {
    return {}
  }
}

/**
 * Haal een enkele content waarde op met fallback.
 */
export async function getContentValue(key: string, fallback: string): Promise<string> {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { sleutel: key },
      select: { waarde: true },
    })
    return setting?.waarde || fallback
  } catch {
    return fallback
  }
}
