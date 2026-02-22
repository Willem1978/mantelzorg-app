import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, logGemeenteAudit } from "@/lib/gemeente-auth"

export async function GET(request: NextRequest) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const sectie = searchParams.get("sectie") // "informatie" or "hulp"
  const doelgroep = searchParams.get("doelgroep") // "MANTELZORGER" or "ZORGVRAGER"
  const zoek = searchParams.get("zoek")

  try {
    if (sectie === "informatie") {
      // Gemeentenieuws via Artikel model
      const artikelen = await prisma.artikel.findMany({
        where: {
          type: "GEMEENTE_NIEUWS",
          gemeente: { equals: gemeenteNaam!, mode: "insensitive" },
          isActief: true,
        },
        orderBy: [{ sorteerVolgorde: "asc" }, { createdAt: "desc" }],
      })

      logGemeenteAudit(userId, "BEKEKEN", "Hulpbronnen-Informatie", { gemeente: gemeenteNaam })

      return NextResponse.json({
        gemeenteNaam,
        artikelen,
      })
    }

    // sectie === "hulp" (default): Zorgorganisatie records voor deze gemeente
    const where: Record<string, unknown> = {
      isActief: true,
      OR: [
        { gemeente: { equals: gemeenteNaam!, mode: "insensitive" } },
        { dekkingNiveau: "LANDELIJK" },
      ],
    }

    if (doelgroep) where.doelgroep = doelgroep

    if (zoek) {
      const zoekCondition = {
        OR: [
          { naam: { contains: zoek, mode: "insensitive" as const } },
          { beschrijving: { contains: zoek, mode: "insensitive" as const } },
        ],
      }
      const existingOR = where.OR
      delete where.OR
      where.AND = [{ OR: existingOR }, zoekCondition]
    }

    const hulpbronnen = await prisma.zorgorganisatie.findMany({
      where,
      orderBy: [{ gemeente: "asc" }, { naam: "asc" }],
    })

    logGemeenteAudit(userId, "BEKEKEN", "Hulpbronnen-Hulp", { gemeente: gemeenteNaam, doelgroep })

    return NextResponse.json({
      gemeenteNaam,
      hulpbronnen,
    })
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
      // Gemeentenieuws toevoegen via Artikel model
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
