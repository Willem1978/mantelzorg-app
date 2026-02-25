import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Publieke API route om site-instellingen op te halen.
 * Retourneert alle instellingen als key-value map.
 * Geen auth nodig - dit zijn publieke weergave-instellingen.
 */
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findMany({
      select: {
        sleutel: true,
        waarde: true,
      },
    })

    // Transformeer naar key-value map
    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.sleutel] = s.waarde
    }

    return NextResponse.json(map, {
      headers: {
        // Cache 5 minuten, stale-while-revalidate 1 uur
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    })
  } catch {
    // Als de tabel nog niet bestaat, return leeg object
    return NextResponse.json({})
  }
}
