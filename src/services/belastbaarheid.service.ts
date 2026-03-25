/**
 * Belastbaarheid Service
 *
 * Business logic voor het aanmaken, berekenen en ophalen van belastbaarheidstests.
 * Gescheiden van HTTP-layer zodat het herbruikbaar is vanuit API routes,
 * WhatsApp webhooks en toekomstige integraties.
 */

import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"
import { BALANSTEST_VRAGEN, UREN_MAP, TAAK_NAAR_ONDERDEEL } from "@/config/options"
import { checkAlarmindicatoren } from "@/lib/alarm-indicatoren"
import { sendBalanstestResultEmail, sendAlarmNotificationEmail } from "@/lib/email"

const log = createLogger("belastbaarheid-service")

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegistratieInput {
  voornaam: string
  email?: string
  postcode?: string | null
  huisnummer?: string | null
  straat?: string | null
  woonplaats?: string | null
  gemeente?: string | null
}

export interface TaakInput {
  isGeselecteerd: boolean
  uren: string
  belasting: string
}

export interface SubmitBalanstestInput {
  registratie: RegistratieInput
  antwoorden: Record<string, string>
  taken?: Record<string, TaakInput>
  score: number
  totaleUren: number
}

export type BelastingNiveau = "LAAG" | "GEMIDDELD" | "HOOG"

export interface AlarmIndicator {
  type: string
  beschrijving: string
  urgentie: string
}

export interface SubmitBalanstestResult {
  testId: string
  score: number
  niveau: BelastingNiveau
  alarmen?: AlarmIndicator[]
}

export interface TestResultData {
  id: string
  voornaam: string | null
  email: string | null
  gemeente: string | null
  totaleBelastingScore: number
  belastingNiveau: string
  totaleZorguren: number | null
  isCompleted: boolean
  completedAt: Date | null
  createdAt: Date
  antwoorden: Array<{
    vraagId: string
    vraagTekst: string
    antwoord: string
    score: number
    gewicht: number
  }>
  taakSelecties: Array<{
    taakId: string
    taakNaam: string
    isGeselecteerd: boolean
    urenPerWeek: number | null
    moeilijkheid: string | null
  }>
  alarmLogs: Array<{
    type: string
    beschrijving: string
    urgentie: string
  }>
  gemeenteAdvies: GemeenteAdvies | null
}

export interface GemeenteAdvies {
  naam: string
  adviesLaag: string | null
  adviesGemiddeld: string | null
  adviesHoog: string | null
  mantelzorgSteunpunt: string | null
  mantelzorgSteunpuntNaam: string | null
  contactTelefoon: string | null
  websiteUrl: string | null
  wmoLoketUrl: string | null
  respijtzorgUrl: string | null
  dagopvangUrl: string | null
}

export interface TestHistoryItem {
  id: string
  totaleBelastingScore: number
  belastingNiveau: string
  totaleZorguren: number | null
  isCompleted: boolean
  completedAt: Date | null
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

function getAntwoordScore(antwoord: string): number {
  if (antwoord === "ja") return 2
  if (antwoord === "soms") return 1
  return 0
}

/**
 * Laad vragen en zorgtaken uit de database.
 * Fallback naar config als de database leeg is.
 */
async function loadVragenEnTaken() {
  const dbVragen = await prisma.balanstestVraag.findMany({
    where: { type: "BALANSTEST", isActief: true },
    select: { vraagId: true, vraagTekst: true, gewicht: true },
  })
  const vragenMap = new Map(
    dbVragen.map((v) => [v.vraagId, { vraag: v.vraagTekst, weegfactor: v.gewicht }])
  )

  const dbZorgtaken = await prisma.zorgtaak.findMany({
    where: { isActief: true },
    select: { taakId: true, naam: true, categorie: true },
  })
  const takenMap = new Map(
    dbZorgtaken.map((t) => [t.taakId, { naam: t.naam, categorie: t.categorie || t.naam }])
  )

  return { vragenMap, takenMap }
}

/**
 * Haal gemeente-advies op uit de database.
 */
async function fetchGemeenteAdvies(gemeenteNaam: string): Promise<GemeenteAdvies | null> {
  try {
    const dbGemeente = await prisma.gemeente.findFirst({
      where: {
        naam: { equals: gemeenteNaam, mode: "insensitive" },
        isActief: true,
      },
      select: {
        naam: true,
        adviesLaag: true,
        adviesGemiddeld: true,
        adviesHoog: true,
        mantelzorgSteunpunt: true,
        mantelzorgSteunpuntNaam: true,
        contactTelefoon: true,
        websiteUrl: true,
        wmoLoketUrl: true,
        respijtzorgUrl: true,
        dagopvangUrl: true,
      },
    })
    return dbGemeente || null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verwerk en sla een ingevulde balanstest op.
 * Berekent score, bepaalt belastingniveau, slaat antwoorden en taakselecties op,
 * checkt alarmindicatoren en stuurt opvolgmails.
 */
export async function submitBalanstest(
  input: SubmitBalanstestInput,
  caregiverId?: string | null,
): Promise<SubmitBalanstestResult> {
  const { registratie, antwoorden, taken, score, totaleUren } = input

  try {
    // Laad vragen en taken uit database (met config fallback)
    const { vragenMap, takenMap } = await loadVragenEnTaken()

    // Bepaal belasting niveau
    let belastingNiveau: BelastingNiveau = "LAAG"
    if (score >= 7 && score <= 12) belastingNiveau = "GEMIDDELD"
    if (score >= 13) belastingNiveau = "HOOG"

    // Maak de test sessie aan
    const test = await prisma.belastbaarheidTest.create({
      data: {
        caregiverId: caregiverId || null,

        voornaam: registratie.voornaam,
        email: registratie.email || "",
        postcode: registratie.postcode || null,
        huisnummer: registratie.huisnummer || null,
        straat: registratie.straat || null,
        woonplaats: registratie.woonplaats || null,
        gemeente: registratie.gemeente || null,

        totaleBelastingScore: score,
        belastingNiveau,
        totaleZorguren: totaleUren,

        isCompleted: true,
        completedAt: new Date(),

        antwoorden: {
          create: Object.entries(antwoorden).map(([vraagId, antwoord]) => {
            const dbVraag = vragenMap.get(vraagId)
            const configVraag = BALANSTEST_VRAGEN.find((v) => v.id === vraagId)
            const vraagTekst = dbVraag?.vraag || configVraag?.vraag || vraagId
            const gewicht = dbVraag?.weegfactor || configVraag?.weegfactor || 1.0
            const antwoordScore = getAntwoordScore(antwoord)

            return {
              vraagId,
              vraagTekst,
              antwoord,
              score: antwoordScore,
              gewicht,
            }
          }),
        },

        taakSelecties: taken && Object.keys(taken).length > 0 ? {
          create: Object.entries(taken).map(([taakId, taakData]) => {
            const dbTaak = takenMap.get(taakId)
            const configOnderdeel = TAAK_NAAR_ONDERDEEL[taakId]
            const taakNaam = dbTaak?.naam || configOnderdeel || taakId

            let urenPerWeek: number | null = null
            if (taakData.uren) {
              urenPerWeek = UREN_MAP[taakData.uren] || null
            }

            let moeilijkheid: "MAKKELIJK" | "GEMIDDELD" | "MOEILIJK" | "ZEER_MOEILIJK" | null = null
            if (taakData.belasting === "nee") moeilijkheid = "MAKKELIJK"
            if (taakData.belasting === "soms") moeilijkheid = "GEMIDDELD"
            if (taakData.belasting === "ja") moeilijkheid = "MOEILIJK"

            return {
              taakId,
              taakNaam,
              isGeselecteerd: taakData.isGeselecteerd,
              urenPerWeek,
              moeilijkheid,
            }
          }),
        } : undefined,
      },
    })

    // Check op alarmindicatoren
    const alarmen = checkAlarmindicatoren(antwoorden, score)

    // Maak alarm logs aan indien nodig
    if (alarmen.length > 0) {
      await prisma.alarmLog.createMany({
        data: alarmen.map((alarm) => ({
          testId: test.id,
          type: alarm.type,
          beschrijving: alarm.beschrijving,
          urgentie: alarm.urgentie,
        })),
      })
    }

    // Als ingelogd, update de caregiver intake status
    if (caregiverId) {
      await prisma.caregiver.update({
        where: { id: caregiverId },
        data: { intakeCompleted: true },
      })
    }

    // --- Opvolging: emails versturen (async, niet blokkeren) ---
    const emailAddr = registratie?.email
    const voornaam = registratie?.voornaam || "Mantelzorger"
    const gemeenteNaam = registratie?.gemeente

    // Email naar mantelzorger met resultaat
    if (emailAddr) {
      let adviesTekst: string | null = null
      if (gemeenteNaam) {
        try {
          const gem = await prisma.gemeente.findFirst({
            where: { naam: { equals: gemeenteNaam, mode: "insensitive" }, isActief: true },
            select: { adviesLaag: true, adviesGemiddeld: true, adviesHoog: true },
          })
          if (gem) {
            adviesTekst = belastingNiveau === "HOOG" ? gem.adviesHoog
              : belastingNiveau === "GEMIDDELD" ? gem.adviesGemiddeld
              : gem.adviesLaag
          }
        } catch { /* gemeente advies niet beschikbaar */ }
      }

      sendBalanstestResultEmail(emailAddr, voornaam, score, belastingNiveau, adviesTekst)
        .catch((err) => log.error({ err }, "Balanstest result email mislukt"))
    }

    // Alarm notificatie naar gemeente (geanonimiseerd)
    if (alarmen.length > 0 && gemeenteNaam) {
      try {
        const gem = await prisma.gemeente.findFirst({
          where: { naam: { equals: gemeenteNaam, mode: "insensitive" }, isActief: true },
          select: { contactEmail: true, naam: true },
        })
        if (gem?.contactEmail) {
          for (const alarm of alarmen) {
            sendAlarmNotificationEmail(
              gem.contactEmail,
              gem.naam,
              alarm.type,
              alarm.urgentie,
              alarm.beschrijving,
            ).catch((err) => log.error({ err }, "Alarm notificatie email mislukt"))
          }
        }
      } catch { /* gemeente niet gevonden */ }
    }

    return {
      testId: test.id,
      score,
      niveau: belastingNiveau,
      alarmen: alarmen.length > 0 ? alarmen : undefined,
    }
  } catch (error) {
    log.error({ err: error }, "Fout bij opslaan belastbaarheidstest")
    throw error
  }
}

/**
 * Haal het resultaat van een specifieke test op, inclusief gemeente-advies.
 */
export async function getTestResult(caregiverId: string): Promise<TestResultData | null> {
  try {
    const test = await prisma.belastbaarheidTest.findFirst({
      where: { caregiverId },
      orderBy: { createdAt: "desc" },
      include: {
        antwoorden: true,
        taakSelecties: true,
        alarmLogs: true,
      },
    })

    if (!test) return null

    // Gemeente-specifiek advies ophalen
    let gemeenteAdvies: GemeenteAdvies | null = null
    if (test.gemeente) {
      gemeenteAdvies = await fetchGemeenteAdvies(test.gemeente)
    }

    return {
      id: test.id,
      voornaam: test.voornaam,
      email: test.email,
      gemeente: test.gemeente,
      totaleBelastingScore: test.totaleBelastingScore,
      belastingNiveau: test.belastingNiveau,
      totaleZorguren: test.totaleZorguren,
      isCompleted: test.isCompleted,
      completedAt: test.completedAt,
      createdAt: test.createdAt,
      antwoorden: test.antwoorden.map((a) => ({
        vraagId: a.vraagId,
        vraagTekst: a.vraagTekst,
        antwoord: a.antwoord,
        score: a.score,
        gewicht: a.gewicht,
      })),
      taakSelecties: test.taakSelecties.map((t) => ({
        taakId: t.taakId,
        taakNaam: t.taakNaam,
        isGeselecteerd: t.isGeselecteerd,
        urenPerWeek: t.urenPerWeek,
        moeilijkheid: t.moeilijkheid,
      })),
      alarmLogs: test.alarmLogs.map((a) => ({
        type: a.type,
        beschrijving: a.beschrijving,
        urgentie: a.urgentie,
      })),
      gemeenteAdvies,
    }
  } catch (error) {
    log.error({ err: error, caregiverId }, "Fout bij ophalen testresultaat")
    throw error
  }
}

/**
 * Haal de testgeschiedenis op voor een mantelzorger.
 */
export async function getTestHistory(caregiverId: string): Promise<TestHistoryItem[]> {
  try {
    const tests = await prisma.belastbaarheidTest.findMany({
      where: { caregiverId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        totaleBelastingScore: true,
        belastingNiveau: true,
        totaleZorguren: true,
        isCompleted: true,
        completedAt: true,
        createdAt: true,
      },
    })

    return tests.map((t) => ({
      id: t.id,
      totaleBelastingScore: t.totaleBelastingScore,
      belastingNiveau: t.belastingNiveau,
      totaleZorguren: t.totaleZorguren,
      isCompleted: t.isCompleted,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
    }))
  } catch (error) {
    log.error({ err: error, caregiverId }, "Fout bij ophalen testgeschiedenis")
    throw error
  }
}
