import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, logGemeenteAudit } from "@/lib/gemeente-auth"
import { gemeenteHulpbronInformatieSchema, gemeenteHulpbronHulpSchema, gemeenteHulpbronUpdateSchema, validateBody } from "@/lib/validations"
import { generateEmbedding, toVectorSql } from "@/lib/ai/embeddings"

export async function GET(request: NextRequest) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const sectie = searchParams.get("sectie") // "informatie" or "hulp"
  const doelgroep = searchParams.get("doelgroep") // "MANTELZORGER" or "ZORGVRAGER"
  const onderdeelTest = searchParams.get("onderdeelTest") // categorie filter
  const zoek = searchParams.get("zoek")

  try {
    if (sectie === "informatie") {
      const artikelen = await prisma.artikel.findMany({
        where: {
          type: "GEMEENTE_NIEUWS",
          gemeente: { equals: gemeenteNaam!, mode: "insensitive" },
          isActief: true,
        },
        orderBy: [{ sorteerVolgorde: "asc" }, { createdAt: "desc" }],
      })

      logGemeenteAudit(userId, "BEKEKEN", "Hulpbronnen-Informatie", { gemeente: gemeenteNaam })

      return NextResponse.json({ gemeenteNaam, artikelen })
    }

    // sectie === "hulp" (default): Zorgorganisatie records voor deze gemeente
    const gemeenteFilter = [
      { gemeente: { equals: gemeenteNaam!, mode: "insensitive" as const } },
      { dekkingNiveau: "LANDELIJK" },
      { gemeente: null },
    ]

    // Doelgroep filter: vertaal "MANTELZORGER"/"ZORGVRAGER" naar onderdeelTest categorieën
    // Het doelgroep-veld in de database bevat vrije tekst, niet enum waarden
    const MANTELZORGER_CATEGORIEEN = [
      'Ondersteuning',
      'Vervangende mantelzorg',
      'Praten, steun & lotgenoten',
      'Leren & training',
    ]
    const doelgroepFilter = doelgroep === "MANTELZORGER"
      ? [{ onderdeelTest: { in: MANTELZORGER_CATEGORIEEN } }]
      : doelgroep === "ZORGVRAGER"
      ? [{ OR: [
          { onderdeelTest: { notIn: MANTELZORGER_CATEGORIEEN } },
          { onderdeelTest: null },
        ] }]
      : []

    const categorieFilter = onderdeelTest
      ? [{ onderdeelTest }]
      : []

    // E.4: Gebruik semantisch zoeken als beschikbaar, anders tekst-fallback
    if (zoek && process.env.OPENAI_API_KEY) {
      try {
        const embedding = await generateEmbedding(zoek)
        const vectorSql = toVectorSql(embedding)
        const semanticResults = await prisma.$queryRaw<{ id: string; similarity: number }[]>`
          SELECT id, 1 - (embedding <=> ${vectorSql}::vector) as similarity
          FROM "Zorgorganisatie"
          WHERE "isActief" = true AND embedding IS NOT NULL
          AND 1 - (embedding <=> ${vectorSql}::vector) > 0.3
          ORDER BY embedding <=> ${vectorSql}::vector
          LIMIT 50
        `

        if (semanticResults.length > 0) {
          const ids = semanticResults.map((r) => r.id)
          const similarityMap = new Map(semanticResults.map((r) => [r.id, r.similarity]))

          const hulpbronnen = await prisma.zorgorganisatie.findMany({
            where: {
              id: { in: ids },
              isActief: true,
              AND: [
                { OR: gemeenteFilter },
                ...doelgroepFilter,
                ...categorieFilter,
              ],
            },
          })

          // Sorteer op relevantie
          const gesorteerd = hulpbronnen
            .map((h) => ({ ...h, relevantie: Math.round((similarityMap.get(h.id) || 0) * 100) }))
            .sort((a, b) => b.relevantie - a.relevantie)

          logGemeenteAudit(userId, "BEKEKEN", "Hulpbronnen-Hulp", { gemeente: gemeenteNaam, doelgroep, onderdeelTest, zoek, methode: "semantisch" })
          return NextResponse.json({ gemeenteNaam, hulpbronnen: gesorteerd, methode: "semantisch" })
        }
      } catch {
        // Fallback naar tekstzoek bij fout
      }
    }

    const zoekFilter = zoek
      ? [{ OR: [
          { naam: { contains: zoek, mode: "insensitive" as const } },
          { beschrijving: { contains: zoek, mode: "insensitive" as const } },
        ] }]
      : []

    const where = {
      isActief: true,
      AND: [
        { OR: gemeenteFilter },
        ...doelgroepFilter,
        ...categorieFilter,
        ...zoekFilter,
      ],
    }

    const hulpbronnen = await prisma.zorgorganisatie.findMany({
      where,
      orderBy: [{ onderdeelTest: "asc" }, { naam: "asc" }],
    })

    logGemeenteAudit(userId, "BEKEKEN", "Hulpbronnen-Hulp", { gemeente: gemeenteNaam, doelgroep, onderdeelTest })

    return NextResponse.json({ gemeenteNaam, hulpbronnen })
  } catch (err) {
    console.error("Gemeente hulpbronnen GET error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const body = await request.json()
    const { sectie } = body

    if (sectie === "informatie") {
      const validation = validateBody(body, gemeenteHulpbronInformatieSchema)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
      const { titel, beschrijving, inhoud, url, publicatieDatum } = validation.data

      const artikel = await prisma.artikel.create({
        data: {
          titel: titel.trim(),
          beschrijving: beschrijving.trim(),
          inhoud: inhoud?.trim() || null,
          url: url?.trim() || null,
          categorie: "gemeente-nieuws",
          type: "GEMEENTE_NIEUWS",
          status: "GEPUBLICEERD",
          publicatieDatum: publicatieDatum ? new Date(publicatieDatum) : new Date(),
          gemeente: gemeenteNaam,
          isActief: true,
          aangemaaaktDoor: userId,
        },
      })

      logGemeenteAudit(userId, "AANGEMAAKT", "Gemeentenieuws", { gemeente: gemeenteNaam, artikelId: artikel.id })
      return NextResponse.json({ bericht: "Gemeentenieuws toegevoegd", artikel }, { status: 201 })
    }

    // sectie === "hulp": Zorgorganisatie toevoegen
    const hulpValidation = validateBody(body, gemeenteHulpbronHulpSchema)
    if (!hulpValidation.success) {
      return NextResponse.json({ error: hulpValidation.error }, { status: 400 })
    }
    const { naam, beschrijving: hulpBeschrijving, doelgroep, onderdeelTest, soortHulp, telefoon, email, website } = hulpValidation.data

    const hulpbron = await prisma.zorgorganisatie.create({
      data: {
        naam: naam.trim(),
        beschrijving: hulpBeschrijving?.trim() || null,
        type: "GEMEENTE",
        gemeente: gemeenteNaam,
        dekkingNiveau: "GEMEENTE",
        doelgroep: doelgroep || null,
        onderdeelTest: onderdeelTest || null,
        soortHulp: soortHulp || null,
        telefoon: telefoon?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        isActief: true,
        zichtbaarBijHoog: true,
        zichtbaarBijGemiddeld: true,
        zichtbaarBijLaag: false,
      },
    })

    logGemeenteAudit(userId, "AANGEMAAKT", "Hulpbron", { gemeente: gemeenteNaam, hulpbronId: hulpbron.id })
    return NextResponse.json({ bericht: "Hulpbron toegevoegd", hulpbron }, { status: 201 })
  } catch (err) {
    console.error("Gemeente hulpbronnen POST error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const body = await request.json()
    const validation = validateBody(body, gemeenteHulpbronUpdateSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { id, naam, beschrijving, doelgroep, onderdeelTest, soortHulp, telefoon, email, website, openingstijden, kosten, isActief } = validation.data

    // Controleer of het record bij deze gemeente hoort
    const bestaand = await prisma.zorgorganisatie.findUnique({ where: { id } })
    if (!bestaand) {
      return NextResponse.json({ error: "Hulpbron niet gevonden" }, { status: 404 })
    }
    if (bestaand.gemeente?.toLowerCase() !== gemeenteNaam?.toLowerCase() && bestaand.dekkingNiveau !== "LANDELIJK") {
      return NextResponse.json({ error: "Geen toegang tot deze hulpbron" }, { status: 403 })
    }
    // Landelijke records mogen niet door gemeente bewerkt worden
    if (bestaand.dekkingNiveau === "LANDELIJK") {
      return NextResponse.json({ error: "Landelijke hulpbronnen kunnen alleen door de beheerder worden aangepast" }, { status: 403 })
    }

    const updated = await prisma.zorgorganisatie.update({
      where: { id },
      data: {
        ...(naam !== undefined && { naam: naam.trim() }),
        ...(beschrijving !== undefined && { beschrijving: beschrijving?.trim() || null }),
        ...(doelgroep !== undefined && { doelgroep: doelgroep || null }),
        ...(onderdeelTest !== undefined && { onderdeelTest: onderdeelTest || null }),
        ...(soortHulp !== undefined && { soortHulp: soortHulp || null }),
        ...(telefoon !== undefined && { telefoon: telefoon?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(website !== undefined && { website: website?.trim() || null }),
        ...(openingstijden !== undefined && { openingstijden: openingstijden?.trim() || null }),
        ...(kosten !== undefined && { kosten: kosten?.trim() || null }),
        ...(isActief !== undefined && { isActief }),
      },
    })

    logGemeenteAudit(userId, "BIJGEWERKT", "Hulpbron", { gemeente: gemeenteNaam, hulpbronId: id })
    return NextResponse.json({ bericht: "Hulpbron bijgewerkt", hulpbron: updated })
  } catch (err) {
    console.error("Gemeente hulpbronnen PUT error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is verplicht" }, { status: 400 })
    }

    const bestaand = await prisma.zorgorganisatie.findUnique({ where: { id } })
    if (!bestaand) {
      return NextResponse.json({ error: "Hulpbron niet gevonden" }, { status: 404 })
    }
    if (bestaand.gemeente?.toLowerCase() !== gemeenteNaam?.toLowerCase()) {
      return NextResponse.json({ error: "Geen toegang tot deze hulpbron" }, { status: 403 })
    }
    if (bestaand.dekkingNiveau === "LANDELIJK") {
      return NextResponse.json({ error: "Landelijke hulpbronnen kunnen niet verwijderd worden" }, { status: 403 })
    }

    await prisma.zorgorganisatie.delete({ where: { id } })

    logGemeenteAudit(userId, "VERWIJDERD", "Hulpbron", { gemeente: gemeenteNaam, hulpbronId: id, naam: bestaand.naam })
    return NextResponse.json({ bericht: "Hulpbron verwijderd" })
  } catch (err) {
    console.error("Gemeente hulpbronnen DELETE error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
