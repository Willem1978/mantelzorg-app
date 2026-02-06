/**
 * Sessie management voor WhatsApp conversaties
 * Houdt de staat bij van belastbaarheidstest flows en onboarding
 */

// ===========================================
// TEST SESSIE - voor balanstest flow
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
    | 'ask_register' // Na test: vraag of ze willen registreren
  currentQuestion: number
  answers: Record<string, string>
  // Aanvullende vragen over zorgtaken
  selectedTasks: string[]
  currentTaskIndex: number
  taskDetails: Record<string, { hours?: string; difficulty?: string }>
  startedAt: Date
  // Test resultaten voor later opslaan
  score?: number
  level?: string
}

// ===========================================
// ONBOARDING SESSIE - voor registratie/login + locatie
// ===========================================

type OnboardingStep =
  | 'choice' // Keuze: inloggen of registreren
  | 'login_email'
  | 'login_password'
  | 'register_name'
  | 'register_email'
  | 'register_password'
  // Na registratie/login: locatie vragen
  | 'location_own_postcode'
  | 'location_own_huisnummer'
  | 'location_care_name' // Naam van naaste
  | 'location_care_relation' // Relatie (partner, ouder, kind, etc.)
  | 'location_care_postcode'
  | 'location_care_huisnummer'
  | 'completed'

interface OnboardingSession {
  phoneNumber: string
  currentStep: OnboardingStep
  data: {
    // Login/registratie
    email?: string
    password?: string
    name?: string
    // Eigen locatie
    ownPostcode?: string
    ownHuisnummer?: string
    ownStreet?: string
    ownCity?: string
    ownMunicipality?: string
    // Naaste locatie
    careName?: string
    careRelation?: string
    carePostcode?: string
    careHuisnummer?: string
    careStreet?: string
    careCity?: string
    careMunicipality?: string
  }
  // Na test resultaten opslaan voor later
  pendingTestResults?: {
    answers: Record<string, string>
    selectedTasks: string[]
    taskDetails: Record<string, { hours?: string; difficulty?: string }>
    score: number
    level: string
  }
  startedAt: Date
}

// ===========================================
// HULP SESSIE - voor hulp zoeken flow
// ===========================================

type HulpStep =
  | 'main_choice' // Hoofdkeuze: hulp voor mij of hulp bij taak
  | 'soort_hulp' // Subcategorie: soort hulp voor mantelzorger
  | 'onderdeel_taak' // Subcategorie: onderdeel test/taak
  | 'results' // Toon resultaten

interface HulpSession {
  phoneNumber: string
  currentStep: HulpStep
  mainChoice?: 'mantelzorger' | 'taak' // Hoofd keuze
  soortHulp?: string // Gekozen "Soort hulp" uit Excel
  onderdeelTaak?: string // Gekozen "Onderdeel mantelzorgtest" uit Excel
  startedAt: Date
}

// Hulp voor mantelzorger zelf - filter op "Onderdeel mantelzorgtest" = "Mantelzorgondersteuning"
// Dan subcategoriseren op "Soort hulp"
export const HULP_VOOR_MANTELZORGER = [
  { id: 'informatie', naam: 'Informatie en advies', emoji: 'ℹ️', dbValue: 'Informatie en advies' },
  { id: 'educatie', naam: 'Educatie & cursussen', emoji: '📚', dbValue: 'Educatie' },
  { id: 'emotioneel', naam: 'Emotionele steun', emoji: '💚', dbValue: 'Emotionele steun' },
  { id: 'begeleiding', naam: 'Persoonlijke begeleiding', emoji: '🤝', dbValue: 'Persoonlijke begeleiding' },
  { id: 'praktisch', naam: 'Praktische hulp', emoji: '🔧', dbValue: 'Praktische hulp' },
  { id: 'respijt', naam: 'Vervangende zorg (respijt)', emoji: '🛏️', dbValue: 'Vervangende mantelzorg' },
]

// Hulp bij taken - filter op "Onderdeel mantelzorgtest" (alles behalve Mantelzorgondersteuning)
export const HULP_BIJ_TAAK = [
  { id: 'administratie', naam: 'Administratie & aanvragen', emoji: '📋', dbValue: 'Administratie en aanvragen' },
  { id: 'maaltijden', naam: 'Maaltijden', emoji: '🍽️', dbValue: 'Bereiden en/of nuttigen van maaltijden' },
  { id: 'boodschappen', naam: 'Boodschappen', emoji: '🛒', dbValue: 'Boodschappen' },
  { id: 'huishouden', naam: 'Huishoudelijke taken', emoji: '🏠', dbValue: 'Huishoudelijke taken' },
  { id: 'klusjes', naam: 'Klusjes in/om huis', emoji: '🔨', dbValue: 'Klusjes in en om het huis' },
  { id: 'verzorging', naam: 'Persoonlijke verzorging', emoji: '🛁', dbValue: 'Persoonlijke verzorging' },
  { id: 'sociaal', naam: 'Sociaal & activiteiten', emoji: '👥', dbValue: 'Sociaal contact en activiteiten' },
  { id: 'vervoer', naam: 'Vervoer', emoji: '🚗', dbValue: 'Vervoer' },
  { id: 'plannen', naam: 'Plannen & organiseren', emoji: '📅', dbValue: 'Plannen en organiseren' },
  { id: 'huisdieren', naam: 'Huisdieren', emoji: '🐕', dbValue: 'Huisdieren' },
]

// Legacy voor backwards compatibility
export const HULP_CATEGORIEEN = HULP_BIJ_TAAK

// In-memory store (in productie zou je Redis of database gebruiken)
const sessions = new Map<string, TestSession>()
const onboardingSessions = new Map<string, OnboardingSession>()
const hulpSessions = new Map<string, HulpSession>()

// ===========================================
// CONSTANTEN
// ===========================================

// Zorgtaken die mantelzorgers kunnen uitvoeren - uit Excel "Onderdeel mantelzorgtest"
export const ZORGTAKEN = [
  { id: 't1', naam: 'Persoonlijke verzorging', beschrijving: 'Wassen, aankleden, naar toilet', dbValue: 'Persoonlijke verzorging' },
  { id: 't2', naam: 'Huishoudelijke taken', beschrijving: 'Schoonmaken, opruimen', dbValue: 'Huishoudelijke taken' },
  { id: 't3', naam: 'Maaltijden', beschrijving: 'Koken, eten bereiden', dbValue: 'Bereiden en/of nuttigen van maaltijden' },
  { id: 't4', naam: 'Boodschappen', beschrijving: 'Boodschappen doen', dbValue: 'Boodschappen' },
  { id: 't5', naam: 'Administratie', beschrijving: 'Post, rekeningen, formulieren', dbValue: 'Administratie en aanvragen' },
  { id: 't6', naam: 'Vervoer', beschrijving: 'Brengen, halen, begeleiden', dbValue: 'Vervoer' },
  { id: 't7', naam: 'Sociaal contact', beschrijving: 'Gezelschap, uitjes, activiteiten', dbValue: 'Sociaal contact en activiteiten' },
  { id: 't8', naam: 'Klusjes', beschrijving: 'Klusjes in en om het huis', dbValue: 'Klusjes in en om het huis' },
  { id: 't9', naam: 'Plannen & organiseren', beschrijving: 'Afspraken, planning', dbValue: 'Plannen en organiseren' },
  { id: 't10', naam: 'Huisdieren', beschrijving: 'Verzorging huisdieren', dbValue: 'Huisdieren' },
]

// Uren opties per week - zoals in screenshot
export const UREN_OPTIES = [
  { id: 'u1', label: 'Tot 2 uur per week', waarde: 1 },
  { id: 'u2', label: '2 tot 4 uur per week', waarde: 3 },
  { id: 'u3', label: '4 tot 8 uur per week', waarde: 6 },
  { id: 'u4', label: '8 tot 12 uur per week', waarde: 10 },
  { id: 'u5', label: '12 tot 24 uur per week', waarde: 18 },
  { id: 'u6', label: 'Meer dan 24 uur per week', waarde: 30 },
]

// Moeilijkheid opties - NEE/SOMS/JA zoals in screenshot
export const MOEILIJKHEID_OPTIES = [
  { id: 'm1', label: 'Nee', emoji: '🟢', waarde: 'NEE' },
  { id: 'm2', label: 'Soms', emoji: '🟡', waarde: 'SOMS' },
  { id: 'm3', label: 'Ja', emoji: '🔴', waarde: 'JA' },
]

export const RELATIE_OPTIES = [
  'Partner',
  'Ouder',
  'Schoonouder',
  'Kind',
  'Broer/zus',
  'Vriend(in)',
  'Buur',
  'Anders',
]

export const BELASTBAARHEID_QUESTIONS = [
  { id: 'q1', vraag: 'Slaap je minder goed door de zorg?', weight: 1.5 },
  { id: 'q2', vraag: 'Heb je last van je lichaam door het zorgen?', weight: 1.0 },
  { id: 'q3', vraag: 'Kost het zorgen veel tijd en energie?', weight: 1.0 },
  { id: 'q4', vraag: 'Is de band met je naaste veranderd?', weight: 1.5 },
  { id: 'q5', vraag: 'Maakt het gedrag van je naaste je verdrietig, bang of boos?', weight: 1.5 },
  { id: 'q6', vraag: 'Heb je verdriet dat je naaste anders is dan vroeger?', weight: 1.0 },
  { id: 'q7', vraag: 'Slokt de zorg al je energie op?', weight: 1.5 },
  { id: 'q8', vraag: 'Pas je je dagelijks leven aan voor de zorg?', weight: 1.0 },
  { id: 'q9', vraag: 'Pas je regelmatig je plannen aan om te helpen?', weight: 1.0 },
  { id: 'q10', vraag: 'Kom je niet meer toe aan dingen die je leuk vindt?', weight: 1.0 },
  { id: 'q11', vraag: 'Kost het zorgen net zoveel tijd als je werk?', weight: 1.5 },
  { id: 'q12', vraag: 'Geeft de zorg je ook geldproblemen?', weight: 1.0 },
]

// ===========================================
// TEST SESSIE FUNCTIES
// ===========================================

export function startTestSession(userId: string): TestSession {
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
  sessions.set(userId, session)
  return session
}

export function getTestSession(userId: string): TestSession | undefined {
  return sessions.get(userId)
}

export function updateTestSession(userId: string, updates: Partial<TestSession>): TestSession | null {
  const session = sessions.get(userId)
  if (!session) return null

  Object.assign(session, updates)
  sessions.set(userId, session)
  return session
}

export function updateTestAnswer(userId: string, answer: string): TestSession | null {
  const session = sessions.get(userId)
  if (!session) return null

  const question = BELASTBAARHEID_QUESTIONS[session.currentQuestion]
  if (!question) return null

  // Sla antwoord op
  session.answers[question.id] = answer

  // Ga naar volgende vraag
  session.currentQuestion++

  // Check of we klaar zijn
  if (session.currentQuestion >= BELASTBAARHEID_QUESTIONS.length) {
    session.currentStep = 'completed'
  }

  sessions.set(userId, session)
  return session
}

export function calculateScore(answers: Record<string, string>): number {
  let totalScore = 0

  BELASTBAARHEID_QUESTIONS.forEach((question) => {
    const answer = answers[question.id]
    let score = 0

    if (answer === 'ja') score = 2
    else if (answer === 'soms') score = 1
    else if (answer === 'nee') score = 0

    totalScore += score * question.weight
  })

  return Math.round(totalScore)
}

export function getScoreLevel(score: number): string {
  if (score < 7) return 'LAAG'
  if (score <= 12) return 'GEMIDDELD'
  return 'HOOG'
}

export function clearTestSession(userId: string): void {
  sessions.delete(userId)
}

// Functies voor aanvullende taken vragen
export function startTasksFlow(userId: string): TestSession | null {
  const session = sessions.get(userId)
  if (!session) return null

  session.currentStep = 'tasks_intro'
  session.selectedTasks = []
  session.currentTaskIndex = 0
  session.taskDetails = {}

  sessions.set(userId, session)
  return session
}

export function setSelectedTasks(userId: string, taskIds: string[]): TestSession | null {
  const session = sessions.get(userId)
  if (!session) return null

  session.selectedTasks = taskIds
  session.currentTaskIndex = 0

  // Als er taken geselecteerd zijn, ga naar uren vraag
  if (taskIds.length > 0) {
    session.currentStep = 'tasks_hours'
  } else {
    session.currentStep = 'completed'
  }

  sessions.set(userId, session)
  return session
}

export function setTaskHours(userId: string, hours: string): TestSession | null {
  const session = sessions.get(userId)
  if (!session || session.selectedTasks.length === 0) return null

  const currentTaskId = session.selectedTasks[session.currentTaskIndex]
  if (!session.taskDetails[currentTaskId]) {
    session.taskDetails[currentTaskId] = {}
  }
  session.taskDetails[currentTaskId].hours = hours

  // Ga naar moeilijkheid vraag
  session.currentStep = 'tasks_difficulty'

  sessions.set(userId, session)
  return session
}

export function setTaskDifficulty(userId: string, difficulty: string): TestSession | null {
  const session = sessions.get(userId)
  if (!session || session.selectedTasks.length === 0) return null

  const currentTaskId = session.selectedTasks[session.currentTaskIndex]
  if (!session.taskDetails[currentTaskId]) {
    session.taskDetails[currentTaskId] = {}
  }
  session.taskDetails[currentTaskId].difficulty = difficulty

  // Ga naar volgende taak of completion
  session.currentTaskIndex++

  if (session.currentTaskIndex >= session.selectedTasks.length) {
    // Alle taken doorgelopen
    session.currentStep = 'completed'
  } else {
    // Volgende taak - vraag uren
    session.currentStep = 'tasks_hours'
  }

  sessions.set(userId, session)
  return session
}

export function getCurrentTask(session: TestSession): (typeof ZORGTAKEN)[0] | null {
  if (session.currentTaskIndex >= session.selectedTasks.length) return null
  const taskId = session.selectedTasks[session.currentTaskIndex]
  return ZORGTAKEN.find((t) => t.id === taskId) || null
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

export function startOnboardingSession(
  phoneNumber: string,
  startStep: OnboardingStep = 'choice',
  pendingTestResults?: OnboardingSession['pendingTestResults']
): OnboardingSession {
  const session: OnboardingSession = {
    phoneNumber,
    currentStep: startStep,
    data: {},
    pendingTestResults,
    startedAt: new Date(),
  }
  onboardingSessions.set(phoneNumber, session)
  return session
}

export function getOnboardingSession(phoneNumber: string): OnboardingSession | undefined {
  return onboardingSessions.get(phoneNumber)
}

export function updateOnboardingSession(
  phoneNumber: string,
  step: OnboardingStep,
  data?: Partial<OnboardingSession['data']>
): OnboardingSession | null {
  const session = onboardingSessions.get(phoneNumber)
  if (!session) return null

  session.currentStep = step
  if (data) {
    session.data = { ...session.data, ...data }
  }

  onboardingSessions.set(phoneNumber, session)
  return session
}

export function clearOnboardingSession(phoneNumber: string): void {
  onboardingSessions.delete(phoneNumber)
}

// ===========================================
// HULP SESSIE FUNCTIES
// ===========================================

export function startHulpSession(phoneNumber: string): HulpSession {
  const session: HulpSession = {
    phoneNumber,
    currentStep: 'main_choice',
    startedAt: new Date(),
  }
  hulpSessions.set(phoneNumber, session)
  return session
}

export function getHulpSession(phoneNumber: string): HulpSession | undefined {
  return hulpSessions.get(phoneNumber)
}

export function updateHulpSession(
  phoneNumber: string,
  step: HulpStep,
  data?: { mainChoice?: 'mantelzorger' | 'taak'; soortHulp?: string; onderdeelTaak?: string }
): HulpSession | null {
  const session = hulpSessions.get(phoneNumber)
  if (!session) return null

  session.currentStep = step
  if (data?.mainChoice) session.mainChoice = data.mainChoice
  if (data?.soortHulp) session.soortHulp = data.soortHulp
  if (data?.onderdeelTaak) session.onderdeelTaak = data.onderdeelTaak

  hulpSessions.set(phoneNumber, session)
  return session
}

export function clearHulpSession(phoneNumber: string): void {
  hulpSessions.delete(phoneNumber)
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

/**
 * Check of postcode geldig NL formaat is
 */
export function isValidPostcode(postcode: string): boolean {
  // Nederlands postcodeformaat: 1234 AB of 1234AB
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
