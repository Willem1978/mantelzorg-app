/**
 * Tool: bekijkGebruikerStatus
 *
 * Geeft de MantelCoach een compleet beeld van waar de gebruiker staat:
 * - Profielcompleetheid (welke velden missen)
 * - Laatste balanstest (wanneer, score, of er een nieuwe nodig is)
 * - Laatste check-in (wanneer, of er een nieuwe nodig is)
 * - Voorkeuren (aandoening, categorieën, tags)
 *
 * Hiermee kan de coach bepalen wat de gebruiker als eerste moet doen.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createBekijkGebruikerStatusTool(ctx: { userId: string }) {
  return tool({
    description:
      "Bekijk de volledige status van de gebruiker: profielcompleetheid, laatste test, laatste check-in, voorkeuren. Gebruik dit als eerste stap om te bepalen wat de mantelzorger nodig heeft.",
    inputSchema: z.object({}),
    execute: async () => {
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
          bericht: "Geen mantelzorgerprofiel gevonden. De gebruiker moet eerst een profiel aanmaken.",
          acties: [{ type: "profiel", label: "Maak je profiel aan", pad: "/profiel" }],
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
      const checkInNodig = !laatsteCheckIn?.completedAt || laatsteCheckIn.completedAt < eenMaandGeleden

      // Bepaal benodigde acties
      const acties: Array<{ type: string; label: string; pad: string; prioriteit: string }> = []

      if (profielPercentage < 80) {
        acties.push({
          type: "profiel",
          label: "Maak je profiel compleet",
          pad: "/profiel",
          prioriteit: "hoog",
        })
      }

      if (!heeftVoorkeuren) {
        acties.push({
          type: "voorkeuren",
          label: "Stel je voorkeuren in",
          pad: "/profiel",
          prioriteit: "gemiddeld",
        })
      }

      if (!laatsteTest) {
        acties.push({
          type: "balanstest",
          label: "Doe de balanstest",
          pad: "/belastbaarheidstest",
          prioriteit: "hoog",
        })
      } else if (testVerouderd) {
        acties.push({
          type: "balanstest",
          label: "Doe een nieuwe balanstest (de vorige is ouder dan 3 maanden)",
          pad: "/belastbaarheidstest",
          prioriteit: "hoog",
        })
      }

      if (checkInNodig && laatsteTest) {
        acties.push({
          type: "checkin",
          label: "Doe je maandelijkse check-in",
          pad: "/check-in",
          prioriteit: "gemiddeld",
        })
      }

      return {
        gevonden: true,
        isNieuweGebruiker: !caregiver.onboardedAt,
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
              dagenGeleden: laatsteTest.completedAt
                ? Math.floor((nu.getTime() - laatsteTest.completedAt.getTime()) / (24 * 60 * 60 * 1000))
                : null,
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
          : { gedaan: false, nodig: true },
        acties,
      }
    },
  })
}
