/**
 * Sessie management voor WhatsApp conversaties
 * Houdt de staat bij van belastbaarheidstest flows en onboarding
 */

interface TestSession {
  userId: string
  currentStep: 'intro' | 'questions' | 'completed'
  currentQuestion: number
  answers: Record<string, string>
  startedAt: Date
}

interface OnboardingSession {
  phoneNumber: string
  currentStep: 'choice' | 'login_email' | 'login_password' | 'register_name' | 'register_email' | 'register_password' | 'completed'
  data: {
    email?: string
    password?: string
    name?: string
  }
  startedAt: Date
}

// In-memory store (in productie zou je Redis of database gebruiken)
const sessions = new Map<string, TestSession>()
const onboardingSessions = new Map<string, OnboardingSession>()

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

export function startTestSession(userId: string): TestSession {
  const session: TestSession = {
    userId,
    currentStep: 'intro',
    currentQuestion: 0,
    answers: {},
    startedAt: new Date(),
  }
  sessions.set(userId, session)
  return session
}

export function getTestSession(userId: string): TestSession | undefined {
  return sessions.get(userId)
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

export function getCurrentQuestion(session: TestSession): typeof BELASTBAARHEID_QUESTIONS[0] | null {
  if (session.currentQuestion >= BELASTBAARHEID_QUESTIONS.length) {
    return null
  }
  return BELASTBAARHEID_QUESTIONS[session.currentQuestion]
}

// Onboarding sessie functies
export function startOnboardingSession(phoneNumber: string): OnboardingSession {
  const session: OnboardingSession = {
    phoneNumber,
    currentStep: 'choice',
    data: {},
    startedAt: new Date(),
  }
  onboardingSessions.set(phoneNumber, session)
  return session
}

export function getOnboardingSession(phoneNumber: string): OnboardingSession | undefined {
  return onboardingSessions.get(phoneNumber)
}

export function updateOnboardingSession(phoneNumber: string, step: OnboardingSession['currentStep'], data?: Partial<OnboardingSession['data']>): OnboardingSession | null {
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
