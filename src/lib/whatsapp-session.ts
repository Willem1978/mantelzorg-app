/**
 * Sessie management voor WhatsApp conversaties
 * Houdt de staat bij van belastbaarheidstest flows, onboarding en hulp zoeken.
 *
 * Sessies worden opgeslagen in de database (WhatsAppSessie model) zodat ze
 * persistent zijn over serverless cold starts. Bij database-fouten wordt
 * een in-memory fallback gebruikt.
 *
 * Vragen en zorgtaken worden uit de database geladen via content-loader.ts
 * met in-memory cache (5 min TTL). Fallback naar config bij DB-fout.
 */

// Re-export UI-constanten (rollen, labels, statussen)
export { HULP_VOOR_MANTELZORGER, HULP_BIJ_TAAK, HULP_CATEGORIEEN, ZORGTAKEN, UREN_OPTIES, MOEILIJKHEID_OPTIES, RELATIE_OPTIES, getScoreLevel } from "@/config/options"
export { BALANSTEST_VRAGEN as BELASTBAARHEID_QUESTIONS } from "@/config/options"
import { BALANSTEST_VRAGEN, ZORGTAKEN as _ZORGTAKEN, getScoreLevel } from "@/config/options"
import { loadBalanstestVragen, loadZorgtaken } from "@/lib/content-loader"
import { prisma } from "@/lib/prisma"

// TTL voor sessies: 2 uur (WhatsApp gesprekken duren normaal niet langer)
const SESSION_TTL_MS = 2 * 60 * 60 * 1000

// ===========================================
// INTERFACES (ongewijzigd voor backward-compat)
// ===========================================

interface TestSession {
  userId: string
  currentStep:
    | 'intro'
    | 'questions'
    | 'tasks_intro'
    | 'tasks_selection'
    | 'tasks_hours'
    | 'tasks_difficulty'
    | 'completed'
    | 'ask_register'
  currentQuestion: number
  answers: Record<string, string>
  selectedTasks: string[]
  currentTaskIndex: number
  taskDetails: Record<string, { hours?: string; difficulty?: string }>
  startedAt: Date
  score?: number
  level?: string
}

type OnboardingStep =
  | 'choice'
  | 'login_email'
  | 'login_password'
  | 'register_name'
  | 'register_email'
  | 'register_password'
  | 'location_own_postcode'
  | 'location_own_huisnummer'
  | 'location_care_name'
  | 'location_care_relation'
  | 'location_care_postcode'
  | 'location_care_huisnummer'
  | 'completed'

interface OnboardingSession {
  phoneNumber: string
  currentStep: OnboardingStep
  data: {
    email?: string
    password?: string
    name?: string
    ownPostcode?: string
    ownHuisnummer?: string
    ownStreet?: string
    ownCity?: string
    ownMunicipality?: string
    careName?: string
    careRelation?: string
    carePostcode?: string
    careHuisnummer?: string
    careStreet?: string
    careCity?: string
    careMunicipality?: string
  }
  pendingTestResults?: {
    answers: Record<string, string>
    selectedTasks: string[]
    taskDetails: Record<string, { hours?: string; difficulty?: string }>
    score: number
    level: string
  }
  startedAt: Date
}

type HulpStep =
  | 'main_choice'
  | 'soort_hulp'
  | 'onderdeel_taak'
  | 'results'

interface HulpSession {
  phoneNumber: string
  currentStep: HulpStep
  mainChoice?: 'mantelzorger' | 'taak'
  soortHulp?: string
  onderdeelTaak?: string
  startedAt: Date
}

// ===========================================
// IN-MEMORY FALLBACK (alleen bij DB-fouten)
// ===========================================

const memorySessions = new Map<string, TestSession>()
const memoryOnboarding = new Map<string, OnboardingSession>()
const memoryHulp = new Map<string, HulpSession>()

// ===========================================
// DATABASE HELPERS
// ===========================================

type SessionType = 'TEST' | 'ONBOARDING' | 'HULP'

async function dbUpsertSession(
  telefoonnr: string,
  type: SessionType,
  stap: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<void> {
  try {
    await prisma.whatsAppSessie.upsert({
      where: { telefoonnr_type: { telefoonnr, type } },
      create: {
        telefoonnr,
        type,
        stap,
        data: JSON.parse(JSON.stringify(data)),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
      update: {
        stap,
        data: JSON.parse(JSON.stringify(data)),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    })
  } catch (error) {
    console.error(`[WA-SESSION] DB upsert fout voor ${type}:${telefoonnr}:`, error)
    // Silently fail — in-memory fallback wordt gebruikt
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function dbGetSession(telefoonnr: string, type: SessionType): Promise<any | null> {
  try {
    const sessie = await prisma.whatsAppSessie.findUnique({
      where: { telefoonnr_type: { telefoonnr, type } },
    })
    if (!sessie) return null
    // Verwijder verlopen sessies
    if (sessie.expiresAt < new Date()) {
      await prisma.whatsAppSessie.delete({
        where: { id: sessie.id },
      }).catch(() => {})
      return null
    }
    return sessie.data
  } catch (error) {
    console.error(`[WA-SESSION] DB get fout voor ${type}:${telefoonnr}:`, error)
    return null
  }
}

async function dbDeleteSession(telefoonnr: string, type: SessionType): Promise<void> {
  try {
    await prisma.whatsAppSessie.deleteMany({
      where: { telefoonnr, type },
    })
  } catch (error) {
    console.error(`[WA-SESSION] DB delete fout voor ${type}:${telefoonnr}:`, error)
  }
}

// ===========================================
// CONSTANTEN
// ===========================================

// Lokale alias voor intern gebruik (BALANSTEST_VRAGEN uit config bevat ook weegfactor)
const BELASTBAARHEID_QUESTIONS = BALANSTEST_VRAGEN

// ===========================================
// TEST SESSIE FUNCTIES
// ===========================================

export async function startTestSession(userId: string): Promise<TestSession> {
  const session: TestSession = {
    userId,
    currentStep: 'intro',
    currentQuestion: 0,
    answers: {},
    selectedTasks: [],
    currentTaskIndex: 0,
    taskDetails: {},
    startedAt: new Date(),
  }
  memorySessions.set(userId, session)
  await dbUpsertSession(userId, 'TEST', session.currentStep, session)
  return session
}

export async function getTestSession(userId: string): Promise<TestSession | undefined> {
  // Probeer in-memory eerst (snelst)
  const memSession = memorySessions.get(userId)
  if (memSession) return memSession

  // Fallback naar database
  const dbData = await dbGetSession(userId, 'TEST')
  if (dbData) {
    const session = dbData as TestSession
    session.startedAt = new Date(session.startedAt)
    memorySessions.set(userId, session) // Cache in memory
    return session
  }

  return undefined
}

export async function updateTestSession(userId: string, updates: Partial<TestSession>): Promise<TestSession | null> {
  const session = await getTestSession(userId)
  if (!session) return null

  Object.assign(session, updates)
  memorySessions.set(userId, session)
  await dbUpsertSession(userId, 'TEST', session.currentStep, session)
  return session
}

export async function updateTestAnswer(userId: string, answer: string): Promise<TestSession | null> {
  const session = await getTestSession(userId)
  if (!session) return null

  const question = BELASTBAARHEID_QUESTIONS[session.currentQuestion]
  if (!question) return null

  session.answers[question.id] = answer
  session.currentQuestion++

  if (session.currentQuestion >= BELASTBAARHEID_QUESTIONS.length) {
    session.currentStep = 'completed'
  }

  memorySessions.set(userId, session)
  await dbUpsertSession(userId, 'TEST', session.currentStep, session)
  return session
}

export function calculateScore(answers: Record<string, string>): number {
  let totalScore = 0

  BELASTBAARHEID_QUESTIONS.forEach((question) => {
    const answer = answers[question.id]

    if (answer === 'ja') totalScore += 2
    else if (answer === 'soms') totalScore += 1
  })

  return totalScore
}

export async function clearTestSession(userId: string): Promise<void> {
  memorySessions.delete(userId)
  await dbDeleteSession(userId, 'TEST')
}

export async function startTasksFlow(userId: string): Promise<TestSession | null> {
  const session = await getTestSession(userId)
  if (!session) return null

  session.currentStep = 'tasks_intro'
  session.selectedTasks = []
  session.currentTaskIndex = 0
  session.taskDetails = {}

  memorySessions.set(userId, session)
  await dbUpsertSession(userId, 'TEST', session.currentStep, session)
  return session
}

export async function setSelectedTasks(userId: string, taskIds: string[]): Promise<TestSession | null> {
  const session = await getTestSession(userId)
  if (!session) return null

  session.selectedTasks = taskIds
  session.currentTaskIndex = 0

  if (taskIds.length > 0) {
    session.currentStep = 'tasks_hours'
  } else {
    session.currentStep = 'completed'
  }

  memorySessions.set(userId, session)
  await dbUpsertSession(userId, 'TEST', session.currentStep, session)
  return session
}

export async function setTaskHours(userId: string, hours: string): Promise<TestSession | null> {
  const session = await getTestSession(userId)
  if (!session || session.selectedTasks.length === 0) return null

  const currentTaskId = session.selectedTasks[session.currentTaskIndex]
  if (!session.taskDetails[currentTaskId]) {
    session.taskDetails[currentTaskId] = {}
  }
  session.taskDetails[currentTaskId].hours = hours
  session.currentStep = 'tasks_difficulty'

  memorySessions.set(userId, session)
  await dbUpsertSession(userId, 'TEST', session.currentStep, session)
  return session
}

export async function setTaskDifficulty(userId: string, difficulty: string): Promise<TestSession | null> {
  const session = await getTestSession(userId)
  if (!session || session.selectedTasks.length === 0) return null

  const currentTaskId = session.selectedTasks[session.currentTaskIndex]
  if (!session.taskDetails[currentTaskId]) {
    session.taskDetails[currentTaskId] = {}
  }
  session.taskDetails[currentTaskId].difficulty = difficulty

  session.currentTaskIndex++

  if (session.currentTaskIndex >= session.selectedTasks.length) {
    session.currentStep = 'completed'
  } else {
    session.currentStep = 'tasks_hours'
  }

  memorySessions.set(userId, session)
  await dbUpsertSession(userId, 'TEST', session.currentStep, session)
  return session
}

export function getCurrentTask(session: TestSession): (typeof _ZORGTAKEN)[0] | null {
  if (session.currentTaskIndex >= session.selectedTasks.length) return null
  const taskId = session.selectedTasks[session.currentTaskIndex]
  return _ZORGTAKEN.find((t) => t.id === taskId) || null
}

export function getCurrentQuestion(session: TestSession): (typeof BELASTBAARHEID_QUESTIONS)[0] | null {
  if (session.currentQuestion >= BELASTBAARHEID_QUESTIONS.length) {
    return null
  }
  return BELASTBAARHEID_QUESTIONS[session.currentQuestion]
}

// ===========================================
// ONBOARDING SESSIE FUNCTIES
// ===========================================

export async function startOnboardingSession(
  phoneNumber: string,
  startStep: OnboardingStep = 'choice',
  pendingTestResults?: OnboardingSession['pendingTestResults']
): Promise<OnboardingSession> {
  const session: OnboardingSession = {
    phoneNumber,
    currentStep: startStep,
    data: {},
    pendingTestResults,
    startedAt: new Date(),
  }
  memoryOnboarding.set(phoneNumber, session)
  await dbUpsertSession(phoneNumber, 'ONBOARDING', session.currentStep, session)
  return session
}

export async function getOnboardingSession(phoneNumber: string): Promise<OnboardingSession | undefined> {
  const memSession = memoryOnboarding.get(phoneNumber)
  if (memSession) return memSession

  const dbData = await dbGetSession(phoneNumber, 'ONBOARDING')
  if (dbData) {
    const session = dbData as OnboardingSession
    session.startedAt = new Date(session.startedAt)
    memoryOnboarding.set(phoneNumber, session)
    return session
  }

  return undefined
}

export async function updateOnboardingSession(
  phoneNumber: string,
  step: OnboardingStep,
  data?: Partial<OnboardingSession['data']>
): Promise<OnboardingSession | null> {
  const session = await getOnboardingSession(phoneNumber)
  if (!session) return null

  session.currentStep = step
  if (data) {
    session.data = { ...session.data, ...data }
  }

  memoryOnboarding.set(phoneNumber, session)
  await dbUpsertSession(phoneNumber, 'ONBOARDING', session.currentStep, session)
  return session
}

export async function clearOnboardingSession(phoneNumber: string): Promise<void> {
  memoryOnboarding.delete(phoneNumber)
  await dbDeleteSession(phoneNumber, 'ONBOARDING')
}

// ===========================================
// HULP SESSIE FUNCTIES
// ===========================================

export async function startHulpSession(phoneNumber: string): Promise<HulpSession> {
  const session: HulpSession = {
    phoneNumber,
    currentStep: 'main_choice',
    startedAt: new Date(),
  }
  memoryHulp.set(phoneNumber, session)
  await dbUpsertSession(phoneNumber, 'HULP', session.currentStep, session)
  return session
}

export async function getHulpSession(phoneNumber: string): Promise<HulpSession | undefined> {
  const memSession = memoryHulp.get(phoneNumber)
  if (memSession) return memSession

  const dbData = await dbGetSession(phoneNumber, 'HULP')
  if (dbData) {
    const session = dbData as HulpSession
    session.startedAt = new Date(session.startedAt)
    memoryHulp.set(phoneNumber, session)
    return session
  }

  return undefined
}

export async function updateHulpSession(
  phoneNumber: string,
  step: HulpStep,
  data?: { mainChoice?: 'mantelzorger' | 'taak'; soortHulp?: string; onderdeelTaak?: string }
): Promise<HulpSession | null> {
  const session = await getHulpSession(phoneNumber)
  if (!session) return null

  session.currentStep = step
  if (data?.mainChoice) session.mainChoice = data.mainChoice
  if (data?.soortHulp) session.soortHulp = data.soortHulp
  if (data?.onderdeelTaak) session.onderdeelTaak = data.onderdeelTaak

  memoryHulp.set(phoneNumber, session)
  await dbUpsertSession(phoneNumber, 'HULP', session.currentStep, session)
  return session
}

export async function clearHulpSession(phoneNumber: string): Promise<void> {
  memoryHulp.delete(phoneNumber)
  await dbDeleteSession(phoneNumber, 'HULP')
}

// ===========================================
// HELPER FUNCTIES
// ===========================================

/**
 * Maak test resultaten aan voor opslaan in onboarding sessie
 */
export function createPendingTestResults(testSession: TestSession): OnboardingSession['pendingTestResults'] {
  const score = calculateScore(testSession.answers)
  const level = getScoreLevel(score)

  return {
    answers: { ...testSession.answers },
    selectedTasks: [...testSession.selectedTasks],
    taskDetails: { ...testSession.taskDetails },
    score,
    level,
  }
}

// ===========================================
// DATABASE-BACKED VARIANTEN (async)
// Gebruik deze in de webhook route voor DB-gestuurde content
// ===========================================

/**
 * Haal de huidige vraag op uit de database (met cache).
 * Fallback naar config als DB niet beschikbaar is.
 */
export async function getCurrentQuestionFromDb(session: TestSession) {
  const vragen = await loadBalanstestVragen()
  if (session.currentQuestion >= vragen.length) return null
  return vragen[session.currentQuestion]
}

/**
 * Bereken de score met vragen uit de database (met cache).
 */
export async function calculateScoreFromDb(answers: Record<string, string>): Promise<number> {
  const vragen = await loadBalanstestVragen()
  let totalScore = 0
  for (const vraag of vragen) {
    const answer = answers[vraag.id]
    if (answer === "ja") totalScore += 2
    else if (answer === "soms") totalScore += 1
  }
  return totalScore
}

/**
 * Haal de huidige taak op uit de database (met cache).
 */
export async function getCurrentTaskFromDb(session: TestSession) {
  if (session.currentTaskIndex >= session.selectedTasks.length) return null
  const taskId = session.selectedTasks[session.currentTaskIndex]
  const taken = await loadZorgtaken()
  return taken.find((t) => t.id === taskId) || null
}

/**
 * Check of postcode geldig NL formaat is
 */
export function isValidPostcode(postcode: string): boolean {
  const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
  return /^\d{4}[A-Z]{2}$/.test(cleanPostcode)
}

/**
 * Normaliseer postcode naar standaard formaat
 */
export function normalizePostcode(postcode: string): string {
  const clean = postcode.replace(/\s/g, '').toUpperCase()
  return `${clean.substring(0, 4)} ${clean.substring(4, 6)}`
}
