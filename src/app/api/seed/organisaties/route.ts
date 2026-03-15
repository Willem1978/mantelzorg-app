import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ZorgorganisatieType } from "@prisma/client"
import { auth } from "@/lib/auth"

export const maxDuration = 120

interface OrgData {
  naam: string
  beschrijving?: string
  type: ZorgorganisatieType
  telefoon?: string
  email?: string
  website?: string
  gemeente: string | null
  onderdeelTest?: string
  soortHulp?: string
  dienst?: string
  doelgroep?: string
  kosten?: string
  zichtbaarBijLaag?: boolean
  zichtbaarBijGemiddeld?: boolean
  zichtbaarBijHoog?: boolean
}

async function upsertOrg(org: OrgData) {
  const existing = await prisma.zorgorganisatie.findFirst({
    where: { naam: org.naam, gemeente: org.gemeente },
  })
  if (existing) {
    await prisma.zorgorganisatie.update({
      where: { id: existing.id },
      data: {
        beschrijving: org.beschrijving, type: org.type, telefoon: org.telefoon,
        email: org.email, website: org.website, onderdeelTest: org.onderdeelTest,
        soortHulp: org.soortHulp, dienst: org.dienst, doelgroep: org.doelgroep,
        kosten: org.kosten, zichtbaarBijLaag: org.zichtbaarBijLaag ?? false,
        zichtbaarBijGemiddeld: org.zichtbaarBijGemiddeld ?? false,
        zichtbaarBijHoog: org.zichtbaarBijHoog ?? true, isActief: true,
      },
    })
    return "updated"
  } else {
    await prisma.zorgorganisatie.create({
      data: {
        naam: org.naam, beschrijving: org.beschrijving, type: org.type,
        telefoon: org.telefoon, email: org.email, website: org.website,
        gemeente: org.gemeente, onderdeelTest: org.onderdeelTest,
        soortHulp: org.soortHulp, dienst: org.dienst, doelgroep: org.doelgroep,
        kosten: org.kosten, zichtbaarBijLaag: org.zichtbaarBijLaag ?? false,
        zichtbaarBijGemiddeld: org.zichtbaarBijGemiddeld ?? false,
        zichtbaarBijHoog: org.zichtbaarBijHoog ?? true, isActief: true,
      },
    })
    return "created"
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Alleen beheerders kunnen seeden" },
      { status: 403 }
    )
  }

  let created = 0, updated = 0, errors = 0

  const allOrgs: OrgData[] = [
    // Arnhem en Nijmegen organisaties zijn verwijderd per maart 2026.
    // Zutphen data wordt beheerd via scripts/update-zutphen-hulpbronnen.ts

    // ===== LANDELIJK =====
    { naam: "Mantelzorglijn", beschrijving: "Gratis hulplijn voor alle vragen over mantelzorg.", type: "LANDELIJK", telefoon: "030 760 60 55", website: "https://www.mantelzorg.nl/onderwerpen/ondersteuning/waar-kun-je-terecht/mantelzorglijn", gemeente: null, onderdeelTest: "Mantelzorgondersteuning", soortHulp: "Hulplijn", doelgroep: "Alle mantelzorgers", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "Luisterlijn", beschrijving: "Anoniem praten over wat je dwars zit. 24/7 bereikbaar.", type: "LANDELIJK", telefoon: "0900 0767", website: "https://www.deluisterlijn.nl/", gemeente: null, onderdeelTest: "Emotionele steun", soortHulp: "Hulplijn", doelgroep: "Iedereen", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "Alzheimer Telefoon", beschrijving: "Vragen over dementie? Bel voor informatie en advies.", type: "LANDELIJK", telefoon: "0800 5088", website: "https://www.alzheimer-nederland.nl/", gemeente: null, onderdeelTest: "Mantelzorgondersteuning", soortHulp: "Hulplijn", doelgroep: "Mantelzorgers van mensen met dementie", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "Zilverlijn", beschrijving: "Bel voor een praatje als je je alleen voelt.", type: "LANDELIJK", telefoon: "0900 265 65 65", website: "https://www.ouderenfonds.nl/zilverlijn/", gemeente: null, onderdeelTest: "Sociaal contact en activiteiten", soortHulp: "Hulplijn", doelgroep: "Ouderen die eenzaam zijn", kosten: "Lokaal tarief", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "Sensoor - Telefonische hulpdienst", beschrijving: "Dag en nacht bereikbaar voor een vertrouwelijk gesprek.", type: "LANDELIJK", telefoon: "0900 0101", website: "https://www.sensoor.nl/", gemeente: null, onderdeelTest: "Emotionele steun", soortHulp: "Hulplijn", doelgroep: "Iedereen", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "Regelhulp.nl", beschrijving: "Overzicht van hulp en ondersteuning bij ziekte, handicap of ouderdom.", type: "LANDELIJK", website: "https://www.regelhulp.nl/", gemeente: null, onderdeelTest: "Administratie en aanvragen", soortHulp: "Overheid en financieel", doelgroep: "Zorgvragers en mantelzorgers", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "Het CAK", beschrijving: "Informatie over eigen bijdrage voor Wmo en Wlz.", type: "LANDELIJK", telefoon: "0800 1925", website: "https://www.hetcak.nl/", gemeente: null, onderdeelTest: "Administratie en aanvragen", soortHulp: "Overheid en financieel", doelgroep: "Mensen met Wmo of Wlz-zorg", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "SVB (Sociale Verzekeringsbank)", beschrijving: "Beheert het persoonsgebonden budget (PGB).", type: "LANDELIJK", telefoon: "030 264 82 00", website: "https://www.svb.nl/nl/pgb", gemeente: null, onderdeelTest: "Administratie en aanvragen", soortHulp: "Overheid en financieel", doelgroep: "PGB-houders", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "Zorginstituut Nederland", beschrijving: "Wat zit er in het basispakket van de zorgverzekering?", type: "LANDELIJK", website: "https://www.zorginstituutnederland.nl/", gemeente: null, onderdeelTest: "Administratie en aanvragen", soortHulp: "Overheid en financieel", doelgroep: "Zorgvragers en mantelzorgers", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "MantelzorgNL", beschrijving: "De landelijke vereniging voor mantelzorgers.", type: "LANDELIJK", website: "https://www.mantelzorg.nl/", gemeente: null, onderdeelTest: "Mantelzorgondersteuning", soortHulp: "Belangenorganisatie", doelgroep: "Alle mantelzorgers", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "Mezzo - Landelijke vereniging mantelzorgers", beschrijving: "Informatie en belangenbehartiging voor mantelzorgers.", type: "LANDELIJK", website: "https://www.mezzo.nl/", gemeente: null, onderdeelTest: "Mantelzorgondersteuning", soortHulp: "Belangenorganisatie", doelgroep: "Mantelzorgers en vrijwilligers", kosten: "Gratis", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
    { naam: "Per Saldo - PGB-belangenvereniging", beschrijving: "Alles over het persoonsgebonden budget.", type: "LANDELIJK", telefoon: "030 230 05 45", website: "https://www.pgb.nl/", gemeente: null, onderdeelTest: "Administratie en aanvragen", soortHulp: "Belangenorganisatie", doelgroep: "PGB-houders en mantelzorgers", kosten: "Gratis voor leden", zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  ]

  for (const org of allOrgs) {
    try {
      const result = await upsertOrg(org)
      if (result === "created") created++
      else updated++
    } catch (e) {
      console.error(`Error: ${org.naam}`, e)
      errors++
    }
  }

  return NextResponse.json({
    success: true,
    totaal: allOrgs.length,
    nieuw: created,
    bijgewerkt: updated,
    fouten: errors,
  })
}
