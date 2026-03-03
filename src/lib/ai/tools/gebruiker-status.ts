/**
 * Tool: bekijkGebruikerStatus
 *
 * Geeft de MantelCoach een compleet beeld van waar de gebruiker staat:
 * - Profielcompleetheid (welke velden missen)
 * - Laatste balanstest (wanneer, score, of er een nieuwe nodig is)
 * - Laatste check-in (wanneer, of er een nieuwe nodig is)
 * - Voorkeuren (aandoening, categorieën, tags)
 *
 * De coach roept dit ALTIJD aan bij het eerste bericht om te bepalen welke flow te volgen.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createBekijkGebruikerStatusTool(ctx: { userId: string }) {
  return tool({
    description:
      "Bekijk de volledige status van de gebruiker: profielcompleetheid, laatste test, laatste check-in, voorkeuren. ROEP DIT ALTIJD AAN bij het eerste bericht om te bepalen hoe je de gebruiker het beste kunt helpen.",
    inputSchema: z.object({}),
    execute: async () => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { name: true },
      })

      const caregiver = await prisma.caregiver.findUnique({
        where: { userId: ctx.userId },
        select: {
          id: true,
          dateOfBirth: true,
          phoneNumber: true,
          postalCode: true,
          city: true,
          municipality: true,
          careRecipient: true,
          careRecipientName: true,
          careRecipientCity: true,
          careRecipientMunicipality: true,
          careHoursPerWeek: true,
          careSince: true,
          intakeCompleted: true,
          profileCompleted: true,
          onboardedAt: true,
          aandoening: true,
          voorkeuren: {
            select: { type: true, slug: true },
          },
        },
      })

      if (!caregiver) {
        return {
          gevonden: false,
          naam: user?.name || null,
          isNieuweGebruiker: true,
          profiel: { percentage: 0, compleet: false, ontbrekendeVelden: ["profiel nog niet aangemaakt"] },
          balanstest: { gedaan: false, aantalTests: 0 },
          checkIn: { gedaan: false, nodig: false },
          samenvatting: "Nieuwe gebruiker. Heeft nog geen profiel en geen test.",
        }
      }

      // Profiel compleetheid checken
      const profielVelden = {
        geboortedatum: !!caregiver.dateOfBirth,
        telefoon: !!caregiver.phoneNumber,
        postcode: !!caregiver.postalCode,
        woonplaats: !!caregiver.city,
        gemeente: !!caregiver.municipality,
        zorgvrager: !!caregiver.careRecipient,
        zorgvragerNaam: !!caregiver.careRecipientName,
        zorgvragerWoonplaats: !!caregiver.careRecipientCity,
        zorgvragerGemeente: !!caregiver.careRecipientMunicipality,
        zorgUrenPerWeek: caregiver.careHoursPerWeek !== null,
        zorgtSinds: !!caregiver.careSince,
        aandoening: !!caregiver.aandoening,
      }
      const ontbrekendeVelden = Object.entries(profielVelden)
        .filter(([, v]) => !v)
        .map(([k]) => k)
      const profielPercentage = Math.round(
        (Object.values(profielVelden).filter(Boolean).length / Object.keys(profielVelden).length) * 100
      )

      // Voorkeuren checken
      const heeftVoorkeuren = caregiver.voorkeuren.length > 0
      const categorieVoorkeuren = caregiver.voorkeuren.filter(v => v.type === "CATEGORIE").map(v => v.slug)
      const tagVoorkeuren = caregiver.voorkeuren.filter(v => v.type === "TAG").map(v => v.slug)

      // Laatste balanstest
      const laatsteTest = await prisma.belastbaarheidTest.findFirst({
        where: { caregiverId: caregiver.id, isCompleted: true },
        orderBy: { completedAt: "desc" },
        select: {
          completedAt: true,
          totaleBelastingScore: true,
          belastingNiveau: true,
          totaleZorguren: true,
        },
      })

      const aantalTests = await prisma.belastbaarheidTest.count({
        where: { caregiverId: caregiver.id, isCompleted: true },
      })

      const nu = new Date()
      const drieMandenGeleden = new Date(nu.getTime() - 90 * 24 * 60 * 60 * 1000)
      const testVerouderd = laatsteTest?.completedAt
        ? laatsteTest.completedAt < drieMandenGeleden
        : false
      const dagenSindsTest = laatsteTest?.completedAt
        ? Math.floor((nu.getTime() - laatsteTest.completedAt.getTime()) / (24 * 60 * 60 * 1000))
        : null

      // Laatste check-in
      const laatsteCheckIn = await prisma.monthlyCheckIn.findFirst({
        where: { caregiverId: caregiver.id, completedAt: { not: null } },
        orderBy: { month: "desc" },
        select: {
          month: true,
          completedAt: true,
          overallWellbeing: true,
        },
      })

      const eenMaandGeleden = new Date(nu.getTime() - 30 * 24 * 60 * 60 * 1000)
      const checkInNodig = laatsteTest
        ? (!laatsteCheckIn?.completedAt || laatsteCheckIn.completedAt < eenMaandGeleden)
        : false

      // Samenvatting voor de coach
      const heeftTest = !!laatsteTest
      const isNieuw = !caregiver.onboardedAt
      let samenvatting = ""

      if (isNieuw && !heeftTest) {
        samenvatting = "Nieuwe gebruiker. Profiel is nog niet af en heeft nog geen test gedaan."
      } else if (heeftTest && !testVerouderd) {
        samenvatting = `Heeft een recente test (${dagenSindsTest} dagen geleden) met score ${laatsteTest!.totaleBelastingScore}/24 (${laatsteTest!.belastingNiveau}).`
        if (checkInNodig) samenvatting += " Check-in is nodig."
        if (ontbrekendeVelden.length > 0) samenvatting += ` Profiel mist nog: ${ontbrekendeVelden.join(", ")}.`
      } else if (heeftTest && testVerouderd) {
        samenvatting = `Test is verouderd (${dagenSindsTest} dagen geleden). Nieuwe test aanraden.`
      } else {
        samenvatting = "Heeft een profiel maar nog geen test gedaan."
      }

      return {
        gevonden: true,
        naam: user?.name || null,
        isNieuweGebruiker: isNieuw,
        samenvatting,
        profiel: {
          percentage: profielPercentage,
          compleet: profielPercentage === 100,
          ontbrekendeVelden,
          gemeente: caregiver.municipality || caregiver.city,
          aandoening: caregiver.aandoening,
        },
        voorkeuren: {
          ingesteld: heeftVoorkeuren,
          categorien: categorieVoorkeuren,
          tags: tagVoorkeuren,
        },
        balanstest: laatsteTest
          ? {
              gedaan: true,
              aantalTests,
              laatsteDatum: laatsteTest.completedAt,
              dagenGeleden: dagenSindsTest,
              score: laatsteTest.totaleBelastingScore,
              niveau: laatsteTest.belastingNiveau,
              zorguren: laatsteTest.totaleZorguren,
              verouderd: testVerouderd,
            }
          : { gedaan: false, aantalTests: 0 },
        checkIn: laatsteCheckIn
          ? {
              gedaan: true,
              laatsteMaand: laatsteCheckIn.month,
              welzijn: laatsteCheckIn.overallWellbeing,
              nodig: checkInNodig,
            }
          : { gedaan: false, nodig: checkInNodig },
      }
    },
  })
}
