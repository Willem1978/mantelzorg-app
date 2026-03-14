/**
 * GET /api/beheer/hulpbronnen/validatie — Haal validatie-overzicht op
 *
 * Query params:
 * - status: GELDIG | WAARSCHUWING | ONGELDIG | ONBEKEND | NIET_GECONTROLEERD
 * - gemeente: filter op gemeente
 * - bron: AI_ZOEKER | HANDMATIG | IMPORT | SOCIALE_KAART
 * - periode: vandaag | week | maand | ouder | nooit
 * - pagina: paginanummer (default 1)
 * - perPagina: items per pagina (default 50)
 *
 * POST /api/beheer/hulpbronnen/validatie — Start handmatige validatie
 * Body: { gemeente?: string }
 *
 * PATCH /api/beheer/hulpbronnen/validatie — Pas correctievoorstel toe
 * Body: { zorgorganisatieId, nieuwWebsite?, nieuwTelefoon? }
 */
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  valideerAlleHulpbronnen,
  zoekCorrectieVoorHulpbron,
} from "@/lib/ai/agents/hulpbronnen-validator"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const gemeente = searchParams.get("gemeente")
  const bron = searchParams.get("bron")
  const periode = searchParams.get("periode")
  const pagina = parseInt(searchParams.get("pagina") || "1", 10)
  const perPagina = parseInt(searchParams.get("perPagina") || "50", 10)

  // Bouw query filters
  const where: Record<string, unknown> = { isActief: true }

  if (gemeente) {
    where.gemeente = { equals: gemeente, mode: "insensitive" }
  }

  if (bron) {
    where.bronType = bron
  }

  if (status === "NIET_GECONTROLEERD") {
    where.laatsteValidatie = null
  } else if (status) {
    where.validatieStatus = status
  }

  if (periode) {
    const nu = new Date()
    switch (periode) {
      case "vandaag":
        where.laatsteValidatie = { gte: new Date(nu.setHours(0, 0, 0, 0)) }
        break
      case "week":
        where.laatsteValidatie = { gte: new Date(nu.getTime() - 7 * 24 * 60 * 60 * 1000) }
        break
      case "maand":
        where.laatsteValidatie = { gte: new Date(nu.getTime() - 30 * 24 * 60 * 60 * 1000) }
        break
      case "ouder":
        where.laatsteValidatie = { lt: new Date(nu.getTime() - 30 * 24 * 60 * 60 * 1000) }
        break
      case "nooit":
        where.laatsteValidatie = null
        break
    }
  }

  try {
    const [hulpbronnen, totaal, tellingen] = await Promise.all([
      prisma.zorgorganisatie.findMany({
        where,
        select: {
          id: true,
          naam: true,
          website: true,
          telefoon: true,
          gemeente: true,
          validatieStatus: true,
          laatsteValidatie: true,
          bronType: true,
          onderdeelTest: true,
          soortHulp: true,
          isActief: true,
        },
        orderBy: [
          // Ongeldig en waarschuwing eerst
          { validatieStatus: "asc" },
          { naam: "asc" },
        ],
        skip: (pagina - 1) * perPagina,
        take: perPagina,
      }),
      prisma.zorgorganisatie.count({ where }),
      // Tellingen per status
      Promise.all([
        prisma.zorgorganisatie.count({ where: { ...where, validatieStatus: "GELDIG" } }),
        prisma.zorgorganisatie.count({ where: { ...where, validatieStatus: "WAARSCHUWING" } }),
        prisma.zorgorganisatie.count({ where: { ...where, validatieStatus: "ONGELDIG" } }),
        prisma.zorgorganisatie.count({ where: { ...where, validatieStatus: "ONBEKEND" } }),
        prisma.zorgorganisatie.count({ where: { ...where, laatsteValidatie: null, isActief: true } }),
      ]),
    ])

    // Haal de laatste validatiedetails op voor de resultaten (inclusief aiSamenvatting)
    const ids = hulpbronnen.map((h) => h.id)
    const validaties = ids.length > 0
      ? await prisma.hulpbronValidatie.findMany({
          where: { zorgorganisatieId: { in: ids } },
          orderBy: { gecontroleerd: "desc" },
          distinct: ["zorgorganisatieId"],
          select: {
            zorgorganisatieId: true,
            status: true,
            websiteBereikbaar: true,
            websiteStatusCode: true,
            telefoonGeldig: true,
            opmerkingen: true,
            aiSamenvatting: true,
            gecontroleerd: true,
          },
        })
      : []

    const validatieMap = new Map(validaties.map((v) => [v.zorgorganisatieId, v]))

    // Unieke gemeenten voor filter dropdown
    const gemeenten = await prisma.zorgorganisatie.findMany({
      where: { isActief: true, gemeente: { not: null } },
      select: { gemeente: true },
      distinct: ["gemeente"],
      orderBy: { gemeente: "asc" },
    })

    return NextResponse.json({
      hulpbronnen: hulpbronnen.map((h) => {
        const detail = validatieMap.get(h.id)
        return {
          ...h,
          validatieDetail: detail
            ? {
                ...detail,
                correctieVoorstel: detail.aiSamenvatting
                  ? parseCorrectieVoorstel(detail.aiSamenvatting)
                  : null,
              }
            : null,
        }
      }),
      totaal,
      pagina,
      perPagina,
      tellingen: {
        geldig: tellingen[0],
        waarschuwing: tellingen[1],
        ongeldig: tellingen[2],
        onbekend: tellingen[3],
        nietGecontroleerd: tellingen[4],
      },
      gemeenten: gemeenten.map((g) => g.gemeente).filter(Boolean),
    })
  } catch (e) {
    console.error("Validatie overzicht fout:", e)
    return NextResponse.json({ error: "Ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const body = await request.json()

  // Handmatig correctie zoeken voor een enkele hulpbron
  if (body.actie === "zoek-correctie" && body.zorgorganisatieId) {
    try {
      const correctie = await zoekCorrectieVoorHulpbron(body.zorgorganisatieId)
      return NextResponse.json({ succes: true, correctie })
    } catch (e) {
      const bericht = e instanceof Error ? e.message : "Onbekende fout"
      return NextResponse.json({ error: bericht }, { status: 500 })
    }
  }

  // Standaard: volledige validatie
  try {
    const samenvatting = await valideerAlleHulpbronnen(body.gemeente || undefined)

    return NextResponse.json({
      succes: true,
      samenvatting: {
        totaal: samenvatting.totaal,
        geldig: samenvatting.geldig,
        waarschuwing: samenvatting.waarschuwing,
        ongeldig: samenvatting.ongeldig,
        onbekend: samenvatting.onbekend,
      },
    })
  } catch (e) {
    const bericht = e instanceof Error ? e.message : "Onbekende fout"
    return NextResponse.json({ error: bericht }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { zorgorganisatieId, nieuwWebsite, nieuwTelefoon } = await request.json()

  if (!zorgorganisatieId) {
    return NextResponse.json({ error: "zorgorganisatieId is verplicht" }, { status: 400 })
  }

  if (!nieuwWebsite && !nieuwTelefoon) {
    return NextResponse.json({ error: "Geen wijzigingen opgegeven" }, { status: 400 })
  }

  try {
    const updateData: Record<string, unknown> = {}
    if (nieuwWebsite) updateData.website = nieuwWebsite
    if (nieuwTelefoon) updateData.telefoon = nieuwTelefoon
    // Reset validatie zodat het opnieuw gecontroleerd wordt
    updateData.validatieStatus = null
    updateData.laatsteValidatie = null

    const updated = await prisma.zorgorganisatie.update({
      where: { id: zorgorganisatieId },
      data: updateData,
      select: { id: true, naam: true, website: true, telefoon: true },
    })

    // Verwijder het correctievoorstel uit de validatie-logs
    await prisma.hulpbronValidatie.updateMany({
      where: {
        zorgorganisatieId,
        aiSamenvatting: { not: null },
      },
      data: { aiSamenvatting: null },
    })

    return NextResponse.json({ succes: true, hulpbron: updated })
  } catch (e) {
    const bericht = e instanceof Error ? e.message : "Onbekende fout"
    return NextResponse.json({ error: bericht }, { status: 500 })
  }
}

function parseCorrectieVoorstel(json: string): {
  nieuwWebsite?: string
  nieuwTelefoon?: string
  toelichting: string
  bron: string
} | null {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}
