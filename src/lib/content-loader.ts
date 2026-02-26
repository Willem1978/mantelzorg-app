/**
 * Cached content loader voor server-side gebruik.
 * Haalt balanstest vragen en zorgtaken uit de database met in-memory cache.
 * Gebruikt door whatsapp-session.ts en andere server-side modules.
 */
import { prisma } from "@/lib/prisma"
import {
  BALANSTEST_VRAGEN as FALLBACK_VRAGEN,
  ZORGTAKEN as FALLBACK_ZORGTAKEN,
  type BalanstestVraag as ConfigVraag,
  type ZorgtaakDef,
} from "@/config/options"

const CACHE_TTL = 5 * 60 * 1000 // 5 minuten

interface CachedData<T> {
  data: T
  timestamp: number
}

let vragenCache: CachedData<ConfigVraag[]> | null = null
let zorgtakenCache: CachedData<ZorgtaakDef[]> | null = null

function isExpired<T>(cache: CachedData<T> | null): boolean {
  if (!cache) return true
  return Date.now() - cache.timestamp > CACHE_TTL
}

/**
 * Laad balanstest vragen uit de database, met fallback naar config.
 */
export async function loadBalanstestVragen(): Promise<ConfigVraag[]> {
  if (!isExpired(vragenCache)) return vragenCache!.data

  try {
    const dbVragen = await prisma.balanstestVraag.findMany({
      where: { type: "BALANSTEST", isActief: true },
      orderBy: { volgorde: "asc" },
    })

    if (dbVragen.length > 0) {
      const mapped: ConfigVraag[] = dbVragen.map((v) => ({
        id: v.vraagId,
        vraag: v.vraagTekst,
        weegfactor: v.gewicht,
      }))
      vragenCache = { data: mapped, timestamp: Date.now() }
      return mapped
    }
  } catch (error) {
    console.error("Laden balanstest vragen uit DB mislukt, gebruik fallback:", error)
  }

  return FALLBACK_VRAGEN
}

/**
 * Laad zorgtaken uit de database, met fallback naar config.
 */
export async function loadZorgtaken(): Promise<ZorgtaakDef[]> {
  if (!isExpired(zorgtakenCache)) return zorgtakenCache!.data

  try {
    const dbTaken = await prisma.zorgtaak.findMany({
      where: { isActief: true },
      orderBy: { volgorde: "asc" },
    })

    if (dbTaken.length > 0) {
      const mapped: ZorgtaakDef[] = dbTaken.map((t) => ({
        id: t.taakId,
        naam: t.naam,
        beschrijving: t.beschrijving || "",
        dbValue: t.naam,
        emoji: undefined,
      }))
      zorgtakenCache = { data: mapped, timestamp: Date.now() }
      return mapped
    }
  } catch (error) {
    console.error("Laden zorgtaken uit DB mislukt, gebruik fallback:", error)
  }

  return FALLBACK_ZORGTAKEN
}

/**
 * Verwijder de cache (bijv. na admin wijzigingen).
 */
export function clearContentCache(): void {
  vragenCache = null
  zorgtakenCache = null
}
