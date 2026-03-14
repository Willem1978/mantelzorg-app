/**
 * POST /api/beheer/gemeenten/ai-zoek-hulpbronnen/opslaan
 *
 * Sla goedgekeurde hulpbronnen op in de database.
 * De beheerder heeft ze beoordeeld, eventueel bewerkt, en met vinkjes goedgekeurd.
 *
 * Request body: { hulpbronnen: GevondenHulpbron[] }
 * Response: { aangemaakt: number, fouten: string[] }
 *
 * Na opslaan verschijnen de hulpbronnen automatisch:
 * - Op het dashboard (via onderdeelTest/soortHulp matching)
 * - In Ger (via prefetch-context.ts die op gemeente + onderdeelTest filtert)
 * - Op de hulpvragen-pagina (via dezelfde matching)
 * - In weekkaarten (als ze bij zware taken passen)
 */
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { slaHulpbronnenOp, type GevondenHulpbron } from "@/lib/ai/agents/hulpbronnen-zoeker"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { hulpbronnen } = await request.json()

  if (!Array.isArray(hulpbronnen) || hulpbronnen.length === 0) {
    return NextResponse.json(
      { error: "Geen hulpbronnen meegegeven" },
      { status: 400 },
    )
  }

  // Valideer dat elke hulpbron de verplichte velden heeft
  const ongeldig: string[] = []
  for (const h of hulpbronnen as GevondenHulpbron[]) {
    if (!h.naam) ongeldig.push("Hulpbron zonder naam")
    if (!h.categorie) ongeldig.push(`${h.naam || "Onbekend"}: geen categorie`)
    if (!h.categorieDbField) ongeldig.push(`${h.naam || "Onbekend"}: geen categorieDbField`)
    if (!h.categorieDbValue) ongeldig.push(`${h.naam || "Onbekend"}: geen categorieDbValue`)
  }

  if (ongeldig.length > 0) {
    return NextResponse.json(
      { error: "Ongeldige hulpbronnen", details: ongeldig },
      { status: 400 },
    )
  }

  const { aangemaakt, fouten } = await slaHulpbronnenOp(hulpbronnen)

  return NextResponse.json({
    aangemaakt,
    fouten,
    bericht: fouten.length > 0
      ? `${aangemaakt} hulpbronnen opgeslagen, ${fouten.length} fouten`
      : `${aangemaakt} hulpbronnen succesvol opgeslagen`,
  })
}
