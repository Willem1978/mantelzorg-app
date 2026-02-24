/**
 * Dashboard helper: hulpbronnen ophalen per taak en locatie.
 * Gesplitst uit de dashboard API route voor betere onderhoudbaarheid.
 */

import { prisma } from "@/lib/prisma"

// Mapping van taak IDs naar alle mogelijke onderdeelTest waarden
const TAAK_NAAR_ONDERDEEL_VARIANTEN: Record<string, string[]> = {
  t1: ["Administratie", "Administratie en aanvragen"],
  t2: ["Plannen", "Plannen en organiseren"],
  t3: ["Boodschappen"],
  t4: ["Sociaal & activiteiten", "Sociaal contact en activiteiten"],
  t5: ["Vervoer"],
  t6: ["Verzorging", "Persoonlijke verzorging"],
  t7: ["Maaltijden", "Bereiden en/of nuttigen van maaltijden"],
  t8: ["Huishouden", "Huishoudelijke taken"],
  t9: ["Klusjes", "Klusjes in en om het huis"],
}

export interface HulpbronResult {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  gemeente: string | null
  isLandelijk: boolean
  dienst: string | null
  openingstijden: string | null
  soortHulp: string | null
  kosten: string | null
  bronLabel: string | null
}

export interface LandelijkHulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp: string | null
  dienst: string | null
  openingstijden: string | null
  kosten: string | null
  bronLabel: string | null
}

export interface HulpbronnenResultaat {
  perTaak: Record<string, HulpbronResult[]>
  voorMantelzorger: HulpbronResult[]
  landelijk: LandelijkHulpbron[]
  perCategorie: Record<string, HulpbronResult[]>
  mantelzorgerGemeente: string | null
  zorgvragerGemeente: string | null
}

export async function getHulpbronnenVoorTaken(
  latestTest: any,
  mantelzorgerGemeente: string | null,
  zorgvragerGemeente: string | null,
  belastingNiveau: string | null
): Promise<HulpbronnenResultaat> {
  const niveauFilter: Record<string, unknown>[] = []
  void belastingNiveau

  // Landelijke hulplijnen
  const landelijk = await prisma.zorgorganisatie.findMany({
    where: {
      isActief: true,
      gemeente: null,
      AND: niveauFilter,
    },
    orderBy: { naam: "asc" },
    select: {
      naam: true,
      telefoon: true,
      website: true,
      beschrijving: true,
      soortHulp: true,
      dienst: true,
      openingstijden: true,
      kosten: true,
      bronLabel: true,
    },
  })

  if (!latestTest) {
    return {
      perTaak: {},
      voorMantelzorger: [],
      landelijk,
      perCategorie: {},
      mantelzorgerGemeente,
      zorgvragerGemeente,
    }
  }

  const isZwaarOfMatig = (m: string | null) =>
    m === "MOEILIJK" || m === "ZEER_MOEILIJK" || m === "GEMIDDELD" ||
    m === "JA" || m === "ja" || m === "SOMS" || m === "soms"

  const zwareTaken = latestTest.taakSelecties?.filter(
    (t: any) => t.isGeselecteerd && isZwaarOfMatig(t.moeilijkheid)
  ) || []

  const perTaak: Record<string, HulpbronResult[]> = {}

  // Hulpbronnen per zware taak - PARALLEL ophalen
  const taakOnderdelen = zwareTaken
    .map((taak: any) => ({ taak, varianten: TAAK_NAAR_ONDERDEEL_VARIANTEN[taak.taakId] }))
    .filter(({ varianten }: any) => varianten?.length > 0)

  const taakResultaten = await Promise.all(
    taakOnderdelen.map(async ({ varianten }: any) => {
      const [lokaleHulp, landelijkeHulp] = await Promise.all([
        zorgvragerGemeente
          ? prisma.zorgorganisatie.findMany({
              where: {
                isActief: true,
                onderdeelTest: { in: varianten },
                gemeente: { equals: zorgvragerGemeente, mode: "insensitive" as const },
                AND: niveauFilter,
              },
              orderBy: { naam: "asc" },
              select: { naam: true, telefoon: true, website: true, beschrijving: true, gemeente: true, doelgroep: true, kosten: true, dienst: true, openingstijden: true, soortHulp: true, bronLabel: true },
            })
          : Promise.resolve([]),
        prisma.zorgorganisatie.findMany({
          where: {
            isActief: true,
            onderdeelTest: { in: varianten },
            gemeente: null,
            AND: niveauFilter,
          },
          orderBy: { naam: "asc" },
          select: { naam: true, telefoon: true, website: true, beschrijving: true, gemeente: true, doelgroep: true, kosten: true, dienst: true, openingstijden: true, soortHulp: true, bronLabel: true },
        }),
      ])

      return [...lokaleHulp.map((h: any) => ({ ...h, isLandelijk: false })), ...landelijkeHulp.map((h: any) => ({ ...h, isLandelijk: true }))]
    })
  )

  taakOnderdelen.forEach(({ taak }: any, i: number) => {
    perTaak[taak.taakNaam] = taakResultaten[i]
  })

  // Hulpbronnen voor mantelzorger zelf
  const voorMantelzorger = mantelzorgerGemeente
    ? await prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          gemeente: { equals: mantelzorgerGemeente, mode: "insensitive" as const },
          doelgroep: "MANTELZORGER",
          AND: niveauFilter,
        },
        orderBy: { naam: "asc" },
        select: { naam: true, telefoon: true, website: true, beschrijving: true, gemeente: true, kosten: true, dienst: true, openingstijden: true, soortHulp: true, bronLabel: true },
      }).then((results: any[]) => results.map(h => ({ ...h, isLandelijk: false })))
    : []

  // Alle hulpbronnen per categorie
  const alleHulpbronnen = zorgvragerGemeente
    ? await prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          OR: [
            { gemeente: { equals: zorgvragerGemeente, mode: "insensitive" as const } },
            { gemeente: null },
          ],
          onderdeelTest: { not: null },
          AND: niveauFilter,
        },
        orderBy: { naam: "asc" },
        select: { naam: true, telefoon: true, website: true, beschrijving: true, gemeente: true, onderdeelTest: true, kosten: true, dienst: true, openingstijden: true, soortHulp: true, bronLabel: true },
      })
    : []

  const perCategorie: Record<string, HulpbronResult[]> = {}
  alleHulpbronnen.forEach((h: any) => {
    if (h.onderdeelTest) {
      if (!perCategorie[h.onderdeelTest]) perCategorie[h.onderdeelTest] = []
      perCategorie[h.onderdeelTest].push({ ...h, isLandelijk: !h.gemeente })
    }
  })

  return {
    perTaak,
    voorMantelzorger,
    landelijk,
    perCategorie,
    mantelzorgerGemeente,
    zorgvragerGemeente,
  }
}
