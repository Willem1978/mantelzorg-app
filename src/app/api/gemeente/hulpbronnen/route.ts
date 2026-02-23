import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, logGemeenteAudit } from "@/lib/gemeente-auth"

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
      'Praten & steun',
      'Lotgenoten',
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
      const { titel, beschrijving, inhoud, url, publicatieDatum } = body

      if (!titel || typeof titel !== "string" || titel.trim().length === 0) {
        return NextResponse.json({ error: "Titel is verplicht" }, { status: 400 })
      }
      if (!beschrijving || typeof beschrijving !== "string" || beschrijving.trim().length === 0) {
        return NextResponse.json({ error: "Beschrijving is verplicht" }, { status: 400 })
      }

      const artikel = await prisma.artikel.create({
        data: {
          titel: titel.trim(),
          beschrijving: beschrijving.trim(),
          inhoud: inhoud?.trim() || null,
          url: url?.trim() || null,
          categorie: "gemeente-nieuws",
          type: "GEMEENTE_NIEUWS",
          status: "GEPUBLICEERD",
          belastingNiveau: "ALLE",
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
    const { naam, beschrijving: hulpBeschrijving, doelgroep, onderdeelTest, soortHulp, telefoon, email, website } = body

    if (!naam || typeof naam !== "string" || naam.trim().length === 0) {
      return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 })
    }

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
    const { id, naam, beschrijving, doelgroep, onderdeelTest, soortHulp, telefoon, email, website, isActief } = body

    if (!id) {
      return NextResponse.json({ error: "ID is verplicht" }, { status: 400 })
    }

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
