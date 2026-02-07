import { NextRequest, NextResponse } from 'next/server'
import {
  parseIncomingWhatsAppMessage,
  sendContentTemplateMessage,
  sendWhatsAppMessageWithImage,
  sendInteractiveButtonMessage,
  getScoreImageUrl,
  getMagicLinkUrl,
  generateShortToken,
  CONTENT_SIDS,
  twilioClient,
} from '@/lib/twilio'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  startTestSession,
  getTestSession,
  updateTestAnswer,
  getCurrentQuestion,
  calculateScore,
  getScoreLevel,
  clearTestSession,
  BELASTBAARHEID_QUESTIONS,
  ZORGTAKEN,
  UREN_OPTIES,
  MOEILIJKHEID_OPTIES,
  RELATIE_OPTIES,
  HULP_VOOR_MANTELZORGER,
  HULP_BIJ_TAAK,
  startTasksFlow,
  setSelectedTasks,
  setTaskHours,
  setTaskDifficulty,
  getCurrentTask,
  startOnboardingSession,
  getOnboardingSession,
  updateOnboardingSession,
  clearOnboardingSession,
  createPendingTestResults,
  isValidPostcode,
  normalizePostcode,
  startHulpSession,
  getHulpSession,
  updateHulpSession,
  clearHulpSession,
} from '@/lib/whatsapp-session'

const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

/**
 * Strip 'whatsapp:' prefix van telefoonnummer voor URLs
 */
function stripWhatsAppPrefix(phoneNumber: string): string {
  return phoneNumber.replace('whatsapp:', '')
}

/**
 * Genereer korte WhatsApp-vriendelijke URLs via onze eigen redirect routes
 */
function getShortRegisterUrl(phone: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'
  return `${baseUrl}/r/reg?p=${encodeURIComponent(phone)}`
}

function getShortLoginUrl(phone: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'
  return `${baseUrl}/r/log?p=${encodeURIComponent(phone)}`
}

/**
 * ===========================================
 * WHATSAPP WEBHOOK - VOLLEDIGE FLOW
 * ===========================================
 *
 * FLOW VOOR NIEUWE GEBRUIKERS (geen account):
 * 1. Eerste bericht → Menu: Test / Account / Inloggen / Direct spreken
 * 2. Na test → Vraag account aanmaken
 * 3. Account aanmaken → Naam, Email, Wachtwoord
 * 4. Na account → Locatie vragen (eigen + naaste)
 * 5. Klaar → Menu voor ingelogde gebruikers
 *
 * FLOW VOOR BESTAANDE GEBRUIKERS (account gekoppeld):
 * 1. Eerste bericht → Menu: Test / Taken / Hulp / Dashboard / Contact
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const formDataObj: Record<string, string> = {}

    body.forEach((value, key) => {
      formDataObj[key] = value.toString()
    })

    const message = parseIncomingWhatsAppMessage(formDataObj)
    const buttonText = formDataObj.ButtonText as string | undefined
    const userInput = buttonText || message.body

    console.log('Inkomend WhatsApp bericht:', {
      from: message.from,
      body: message.body,
      buttonText,
    })

    // Zoek gekoppelde gebruiker - check zowel met als zonder whatsapp: prefix
    const phoneWithPrefix = message.from // whatsapp:+31...
    const phoneWithoutPrefix = stripWhatsAppPrefix(message.from) // +31...

    const caregiver = await prisma.caregiver.findFirst({
      where: {
        OR: [
          { phoneNumber: phoneWithPrefix },
          { phoneNumber: phoneWithoutPrefix },
        ]
      },
      include: { user: true },
    })

    let response = ''
    let useInteractiveButtons = false
    let interactiveContentSid: string | undefined
    let interactiveBodyText: string | undefined
    let quickReplyButtons: { id: string; title: string }[] | undefined

    // ===========================================
    // PRIORITEIT 1: ACTIEVE TEST SESSIE
    // ===========================================
    const testSession = getTestSession(message.from)

    if (testSession) {
      const result = await handleTestSession(
        message.from,
        userInput,
        testSession,
        caregiver
      )
      response = result.response
      useInteractiveButtons = result.useInteractiveButtons || false
      interactiveContentSid = result.interactiveContentSid
      interactiveBodyText = result.interactiveBodyText
      quickReplyButtons = result.quickReplyButtons
    }

    // ===========================================
    // PRIORITEIT 2: ACTIEVE HULP SESSIE
    // ===========================================
    if (!response) {
      const hulpSession = getHulpSession(message.from)

      if (hulpSession) {
        const result = await handleHulpSession(
          message.from,
          userInput,
          hulpSession,
          caregiver
        )
        response = result.response
        quickReplyButtons = result.quickReplyButtons
      }
    }

    // ===========================================
    // PRIORITEIT 3: ACTIEVE ONBOARDING SESSIE
    // ===========================================
    if (!response) {
      const onboardingSession = getOnboardingSession(message.from)

      if (onboardingSession) {
        const result = await handleOnboardingSession(
          message.from,
          userInput,
          onboardingSession
        )
        response = result.response
        quickReplyButtons = result.quickReplyButtons
      }
    }

    // ===========================================
    // PRIORITEIT 4: INGELOGDE GEBRUIKER MENU
    // ===========================================
    if (!response && caregiver) {
      const result = await handleLoggedInUser(message.from, userInput, caregiver)
      response = result.response
      useInteractiveButtons = result.useInteractiveButtons || false
      interactiveContentSid = result.interactiveContentSid
      interactiveBodyText = result.interactiveBodyText
      quickReplyButtons = result.quickReplyButtons
    }

    // ===========================================
    // PRIORITEIT 5: GAST MENU (geen account)
    // ===========================================
    if (!response && !caregiver) {
      const result = handleGuestMenu(message.from, userInput)
      response = result.response
      quickReplyButtons = result.quickReplyButtons
    }

    // ===========================================
    // STUUR RESPONSE
    // ===========================================
    return sendResponse(
      response,
      message.from,
      useInteractiveButtons,
      interactiveContentSid,
      interactiveBodyText,
      quickReplyButtons
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return sendTwiML('Sorry, er is iets misgegaan. Probeer het later opnieuw.')
  }
}

// ===========================================
// HANDLER: TEST SESSIE
// ===========================================
async function handleTestSession(
  phoneNumber: string,
  input: string,
  session: ReturnType<typeof getTestSession>,
  caregiver: any
): Promise<{
  response: string
  useInteractiveButtons?: boolean
  interactiveContentSid?: string
  interactiveBodyText?: string
  quickReplyButtons?: { id: string; title: string }[]
}> {
  if (!session) return { response: '' }

  // Standaard buttons voor ja/soms/nee vragen
  const testAnswerButtons = [
    { id: 'ja', title: '🔴 Ja' },
    { id: 'soms', title: '🟡 Soms' },
    { id: 'nee', title: '🟢 Nee' },
  ]

  // Buttons voor moeilijkheid (omgekeerde volgorde: Nee/Soms/Ja)
  const difficultyButtons = [
    { id: 'nee', title: '🟢 Nee' },
    { id: 'soms', title: '🟡 Soms' },
    { id: 'ja', title: '🔴 Ja' },
  ]

  const command = input.toLowerCase().trim()

  // STAP: Taken selectie intro
  if (session.currentStep === 'tasks_intro') {
    if (command === 'geen' || command === 'nee' || command === 'skip' || command === '0') {
      return await finishTestAndRespond(phoneNumber, session, caregiver)
    }

    // Parse nummers
    const numbers = command.match(/\d+/g)
    if (numbers && numbers.length > 0) {
      const taskIds = numbers
        .map((n: string) => parseInt(n))
        .filter((n: number) => n >= 1 && n <= ZORGTAKEN.length)
        .map((n: number) => ZORGTAKEN[n - 1].id)

      if (taskIds.length > 0) {
        const updatedSession = setSelectedTasks(phoneNumber, taskIds)
        if (updatedSession && updatedSession.currentStep === 'tasks_hours') {
          const currentTask = getCurrentTask(updatedSession)
          let response = `📋 *${currentTask?.naam}*\n\nHoeveel uur per week besteed je hieraan?\n\n`
          response += `1️⃣ Tot 2 uur\n2️⃣ 2-4 uur\n3️⃣ 4-8 uur\n4️⃣ 8-12 uur\n5️⃣ 12-24 uur\n6️⃣ Meer dan 24 uur\n\n_Typ 1 t/m 6_`
          return { response }
        }
      }
    }

    return {
      response: `❌ Typ de nummers van de taken (1-${ZORGTAKEN.length}), gescheiden door komma's.\n\nOf typ "geen" om over te slaan.`,
    }
  }

  // STAP: Uren per taak
  if (session.currentStep === 'tasks_hours') {
    const num = parseInt(command)

    if (num >= 1 && num <= UREN_OPTIES.length) {
      const urenOptie = UREN_OPTIES[num - 1]
      const updatedSession = setTaskHours(phoneNumber, urenOptie.label)

      if (updatedSession && updatedSession.currentStep === 'tasks_difficulty') {
        const taskIndex = updatedSession.currentTaskIndex
        const taskId = updatedSession.selectedTasks[taskIndex]
        const taak = ZORGTAKEN.find((t) => t.id === taskId)

        // Vraag met interactieve buttons
        const response = `📋 *Vind je ${taak?.beschrijving?.toLowerCase() || taak?.naam?.toLowerCase()} een zware taak?*`
        return {
          response,
          quickReplyButtons: difficultyButtons,
        }
      }
    }

    return { response: `❌ Typ een nummer van 1 tot ${UREN_OPTIES.length}` }
  }

  // STAP: Moeilijkheid per taak
  if (session.currentStep === 'tasks_difficulty') {
    // Verwerk antwoord via button of nummer
    let moeilijkheidWaarde: string | null = null

    if (command === 'nee' || command === '1') {
      moeilijkheidWaarde = 'NEE'
    } else if (command === 'soms' || command === '2') {
      moeilijkheidWaarde = 'SOMS'
    } else if (command === 'ja' || command === '3') {
      moeilijkheidWaarde = 'JA'
    }

    if (moeilijkheidWaarde) {
      const updatedSession = setTaskDifficulty(phoneNumber, moeilijkheidWaarde)

      if (updatedSession && updatedSession.currentStep === 'completed') {
        return await finishTestAndRespond(phoneNumber, updatedSession, caregiver)
      } else if (updatedSession && updatedSession.currentStep === 'tasks_hours') {
        const currentTask = getCurrentTask(updatedSession)
        let response = `📋 *${currentTask?.naam}*\n\nHoeveel uur per week besteed je hieraan?\n\n`
        response += `1️⃣ Tot 2 uur\n2️⃣ 2-4 uur\n3️⃣ 4-8 uur\n4️⃣ 8-12 uur\n5️⃣ 12-24 uur\n6️⃣ Meer dan 24 uur\n\n_Typ 1 t/m 6_`
        return { response }
      }
    }

    return { response: `❌ Typ een nummer van 1 tot 3` }
  }

  // STAP: Test vragen
  if (session.currentStep === 'questions') {
    let normalizedAnswer = command

    // Normaliseer antwoord (van button of tekst)
    if (
      command === 'j' ||
      command === '1' ||
      command === 'ja' ||
      command.includes('🔴')
    )
      normalizedAnswer = 'ja'
    else if (
      command === 's' ||
      command === '2' ||
      command === 'soms' ||
      command.includes('🟡') ||
      command.includes('🟠')
    )
      normalizedAnswer = 'soms'
    else if (
      command === 'n' ||
      command === '3' ||
      command === 'nee' ||
      command.includes('🟢')
    )
      normalizedAnswer = 'nee'

    if (['ja', 'soms', 'nee'].includes(normalizedAnswer)) {
      const updatedSession = updateTestAnswer(phoneNumber, normalizedAnswer)

      if (updatedSession && updatedSession.currentStep === 'completed') {
        // Vragen voltooid - toon tussenresultaat en vraag zorgtaken
        const score = calculateScore(updatedSession.answers)
        const level = getScoreLevel(score)

        let levelEmoji = '🟢'
        let levelText = 'laag'
        if (level === 'GEMIDDELD') {
          levelEmoji = '🟠'
          levelText = 'gemiddeld'
        }
        if (level === 'HOOG') {
          levelEmoji = '🔴'
          levelText = 'hoog'
        }

        let response = `✅ *12 vragen beantwoord!*\n\n📊 Voorlopige score: *${score}/24*\n${levelEmoji} Niveau: *${levelText}*\n\n`
        response += `📋 *Nog een paar vragen...*\n\nWelke zorgtaken voer je uit?\n\n`

        const numEmojisTaken = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
        ZORGTAKEN.forEach((taak, i) => {
          response += `${numEmojisTaken[i]} ${taak.naam}\n`
        })

        response += `\n_Typ de nummers gescheiden door komma's_\n_Bijv: 1,2,5 of typ "geen"_`

        startTasksFlow(phoneNumber)
        return { response }
      } else if (updatedSession) {
        // Volgende vraag met interactieve buttons
        const nextQuestion = getCurrentQuestion(updatedSession)
        if (nextQuestion) {
          const questionNum = updatedSession.currentQuestion + 1
          const questionText = `📊 *Vraag ${questionNum}/${BELASTBAARHEID_QUESTIONS.length}*\n\n${nextQuestion.vraag}`

          return {
            response: questionText,
            quickReplyButtons: testAnswerButtons,
          }
        }
      }
    } else if (command === 'stop' || command === 'stoppen') {
      clearTestSession(phoneNumber)
      return { response: `❌ Test gestopt.\n\n_Typ 0 voor menu_` }
    }

    // Ongeldig antwoord - toon opnieuw met buttons
    const currentQuestion = getCurrentQuestion(session)
    const questionNum = session.currentQuestion + 1
    const questionText = `❌ Kies een antwoord:\n\n📊 *Vraag ${questionNum}/${BELASTBAARHEID_QUESTIONS.length}*\n\n${currentQuestion?.vraag}`

    return {
      response: questionText,
      quickReplyButtons: testAnswerButtons,
    }
  }

  return { response: '' }
}

// ===========================================
// HANDLER: ONBOARDING SESSIE
// Alleen voor locatie vragen NA registratie via browser
// Account aanmaken en inloggen gaat nu via magic link naar browser
// ===========================================
async function handleOnboardingSession(
  phoneNumber: string,
  input: string,
  session: ReturnType<typeof getOnboardingSession>
): Promise<{
  response: string
  quickReplyButtons?: { id: string; title: string }[]
}> {
  if (!session) return { response: '' }

  const command = input.trim()
  const commandLower = command.toLowerCase()

  // Buttons voor inloggen/registreren keuze
  const choiceButtons = [
    { id: 'inloggen', title: '🔑 Inloggen' },
    { id: 'registreren', title: '✨ Account maken' },
  ]

  // Stop/annuleer
  if (commandLower === 'stop' || commandLower === '0') {
    clearOnboardingSession(phoneNumber)
    return { response: `_Geannuleerd_\n\n_Typ 0 voor menu_` }
  }

  // STAP: Keuze na test (inloggen of registreren)
  if (session.currentStep === 'choice') {
    const num = parseInt(command)

    if (num === 1 || commandLower === 'inloggen') {
      // Inloggen
      const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'
      clearOnboardingSession(phoneNumber)
      return {
        response: `🔑 *Inloggen*

Je testresultaten worden opgeslagen na inloggen.

👉 ${baseUrl}/login

_Typ 0 voor menu_`,
      }
    }

    if (num === 2 || commandLower === 'registreren') {
      // Registreren
      const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'
      clearOnboardingSession(phoneNumber)
      return {
        response: `✨ *Account aanmaken*

Je testresultaten worden opgeslagen na registratie.

👉 ${baseUrl}/register

_Typ 0 voor menu_`,
      }
    }

    // Ongeldige keuze - toon met interactieve buttons
    return {
      response: `💾 *Wil je dit resultaat bewaren?*`,
      quickReplyButtons: choiceButtons,
    }
  }

  // STAP: Locatie - Eigen postcode
  if (session.currentStep === 'location_own_postcode') {
    if (!isValidPostcode(command)) {
      return { response: `❌ Ongeldige postcode.\n\n📮 Typ je postcode (bijv: 1234 AB):` }
    }

    const postcode = normalizePostcode(command)
    updateOnboardingSession(phoneNumber, 'location_own_huisnummer', { ownPostcode: postcode })
    return { response: `🏠 Wat is je huisnummer?` }
  }

  // STAP: Locatie - Eigen huisnummer
  if (session.currentStep === 'location_own_huisnummer') {
    // Zoek adres via PDOK (simpele versie - gebruik bestaande API)
    const addressData = await lookupAddress(session.data.ownPostcode!, command)

    updateOnboardingSession(phoneNumber, 'location_care_name', {
      ownHuisnummer: command,
      ownStreet: addressData?.street,
      ownCity: addressData?.city,
      ownMunicipality: addressData?.municipality,
    })

    let confirmText = ''
    if (addressData?.street) {
      confirmText = `\n\n📍 ${addressData.street} ${command}, ${addressData.city}`
    }

    return {
      response: `✅ Opgeslagen!${confirmText}\n\n👤 *Nu over je naaste*\n\nWat is de naam van degene voor wie je zorgt?`,
    }
  }

  // STAP: Locatie - Naam naaste
  if (session.currentStep === 'location_care_name') {
    updateOnboardingSession(phoneNumber, 'location_care_relation', { careName: command })

    let response = `💑 Wat is je relatie tot ${command}?\n\n`
    const numEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣']
    RELATIE_OPTIES.forEach((rel, i) => {
      response += `${numEmojis[i]} ${rel}\n`
    })
    response += `\n_Typ 1 t/m ${RELATIE_OPTIES.length}_`

    return { response }
  }

  // STAP: Locatie - Relatie
  if (session.currentStep === 'location_care_relation') {
    const num = parseInt(command)
    let relation = command

    if (num >= 1 && num <= RELATIE_OPTIES.length) {
      relation = RELATIE_OPTIES[num - 1]
    }

    updateOnboardingSession(phoneNumber, 'location_care_postcode', { careRelation: relation })
    return {
      response: `📍 Wat is de postcode van ${session.data.careName}?\n\n_Bijv: 1234 AB_`,
    }
  }

  // STAP: Locatie - Naaste postcode
  if (session.currentStep === 'location_care_postcode') {
    if (!isValidPostcode(command)) {
      return { response: `❌ Ongeldige postcode.\n\n📮 Typ de postcode (bijv: 1234 AB):` }
    }

    const postcode = normalizePostcode(command)
    updateOnboardingSession(phoneNumber, 'location_care_huisnummer', { carePostcode: postcode })
    return { response: `🏠 Wat is het huisnummer van ${session.data.careName}?` }
  }

  // STAP: Locatie - Naaste huisnummer
  if (session.currentStep === 'location_care_huisnummer') {
    const addressData = await lookupAddress(session.data.carePostcode!, command)

    // Update caregiver profiel met alle locatiegegevens
    const caregiver = await prisma.caregiver.findFirst({
      where: { phoneNumber: phoneNumber },
    })

    if (caregiver) {
      await prisma.caregiver.update({
        where: { id: caregiver.id },
        data: {
          postalCode: session.data.ownPostcode,
          street: session.data.ownStreet,
          city: session.data.ownCity,
          municipality: session.data.ownMunicipality,
          careRecipientName: session.data.careName,
          careRecipient: session.data.careRelation,
          careRecipientStreet: addressData?.street,
          careRecipientCity: addressData?.city,
          careRecipientMunicipality: addressData?.municipality,
          profileCompleted: true,
        },
      })

      // Sla pending test resultaten op
      if (session.pendingTestResults) {
        await savePendingTestResults(caregiver.id, session.pendingTestResults)
      }
    }

    // Haal caregiver opnieuw op met laatste test
    const updatedCaregiver = await prisma.caregiver.findFirst({
      where: { phoneNumber: phoneNumber },
      include: { user: true },
    })

    const lastTest = updatedCaregiver
      ? await prisma.belastbaarheidTest.findFirst({
          where: { caregiverId: updatedCaregiver.id },
          orderBy: { completedAt: 'desc' },
        })
      : null

    clearOnboardingSession(phoneNumber)

    let confirmText = ''
    if (addressData?.street) {
      confirmText = `📍 ${addressData.street} ${command}, ${addressData.city}\n\n`
    }

    return {
      response: `✅ *Profiel compleet!*\n\n${confirmText}${await getLoggedInMenu(updatedCaregiver, lastTest)}`,
    }
  }

  return { response: '' }
}

// ===========================================
// HANDLER: HULP SESSIE
// ===========================================
async function handleHulpSession(
  phoneNumber: string,
  input: string,
  session: ReturnType<typeof getHulpSession>,
  caregiver: any
): Promise<{
  response: string
  quickReplyButtons?: { id: string; title: string }[]
}> {
  if (!session) return { response: '' }

  const command = input.toLowerCase().trim()
  const num = parseInt(command)

  // Buttons voor hulp keuze
  const hulpChoiceButtons = [
    { id: 'hulp_mij', title: '💚 Hulp voor mij' },
    { id: 'hulp_taak', title: '🔧 Hulp bij taak' },
  ]

  // Annuleren
  if (command === 'stop' || command === 'terug' || command === '0') {
    clearHulpSession(phoneNumber)
    return { response: `_Hulp zoeken geannuleerd_\n\n_Typ 0 voor menu_` }
  }

  // STAP 1: Hoofdkeuze - hulp voor mij of hulp bij taak
  if (session.currentStep === 'main_choice') {
    if (num === 1 || command === 'hulp_mij') {
      // Hulp voor mantelzorger - toon soort hulp opties
      updateHulpSession(phoneNumber, 'soort_hulp', { mainChoice: 'mantelzorger' })

      const numEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']
      let response = `💚 *Hulp voor jou als mantelzorger*\n\nWelk type ondersteuning zoek je?\n\n`
      HULP_VOOR_MANTELZORGER.forEach((opt, i) => {
        response += `${numEmojis[i]} ${opt.naam}\n`
      })
      response += `\n_Typ 1 t/m ${HULP_VOOR_MANTELZORGER.length}, of 0 voor terug_`
      return { response }
    }

    if (num === 2 || command === 'hulp_taak') {
      // Hulp bij taak - toon taak opties
      updateHulpSession(phoneNumber, 'onderdeel_taak', { mainChoice: 'taak' })

      const numEmojis2 = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
      let response = `🔧 *Hulp bij een zorgtaak*\n\nBij welke taak zoek je hulp?\n\n`
      HULP_BIJ_TAAK.forEach((opt, i) => {
        response += `${numEmojis2[i]} ${opt.naam}\n`
      })
      response += `\n_Typ 1 t/m ${HULP_BIJ_TAAK.length}, of 0 voor terug_`
      return { response }
    }

    // Toon opnieuw de hoofdkeuze met interactieve buttons
    return {
      response: `🗺️ *Hulp in de Buurt*\n\nWat voor hulp zoek je?`,
      quickReplyButtons: hulpChoiceButtons,
    }
  }

  // STAP 2A: Soort hulp kiezen (voor mantelzorger)
  if (session.currentStep === 'soort_hulp') {
    if (num >= 1 && num <= HULP_VOOR_MANTELZORGER.length) {
      const soortHulp = HULP_VOOR_MANTELZORGER[num - 1]
      updateHulpSession(phoneNumber, 'results', { soortHulp: soortHulp.dbValue })

      // Haal hulpbronnen op - filter op onderdeel = Mantelzorgondersteuning EN soort hulp
      const gemeente = caregiver?.municipality

      const hulpbronnen = await prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          onderdeelTest: { contains: 'Mantelzorgondersteuning' },
          soortHulp: soortHulp.dbValue,
          ...(gemeente && { gemeente }),
        },
        take: 5,
        orderBy: { naam: 'asc' },
      })

      clearHulpSession(phoneNumber)
      const menuButton = [{ id: 'menu', title: '📋 Menu' }]

      if (hulpbronnen.length === 0) {
        return {
          response: `😔 Geen hulpbronnen gevonden voor "${soortHulp.naam}"${gemeente ? ` in ${gemeente}` : ''}.\n\n📞 Bel de Mantelzorglijn: 030-760 60 55\nZij kunnen je verder helpen!`,
          quickReplyButtons: menuButton,
        }
      }

      return {
        response: formatHulpResults(soortHulp.naam, soortHulp.emoji, hulpbronnen, gemeente),
        quickReplyButtons: menuButton,
      }
    }

    // Toon opnieuw de opties
    const numEmojisRetry = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']
    let response = `💚 *Hulp voor jou als mantelzorger*\n\nWelk type ondersteuning zoek je?\n\n`
    HULP_VOOR_MANTELZORGER.forEach((opt, i) => {
      response += `${numEmojisRetry[i]} ${opt.naam}\n`
    })
    response += `\n_Typ 1 t/m ${HULP_VOOR_MANTELZORGER.length}, of 0 voor terug_`
    return { response }
  }

  // STAP 2B: Onderdeel taak kiezen (hulp bij taak)
  if (session.currentStep === 'onderdeel_taak') {
    if (num >= 1 && num <= HULP_BIJ_TAAK.length) {
      const onderdeelTaak = HULP_BIJ_TAAK[num - 1]
      updateHulpSession(phoneNumber, 'results', { onderdeelTaak: onderdeelTaak.dbValue })

      // Haal hulpbronnen op - filter op onderdeel test
      const gemeente = caregiver?.careRecipientMunicipality || caregiver?.municipality

      const hulpbronnen = await prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          onderdeelTest: onderdeelTaak.dbValue,
          ...(gemeente && { gemeente }),
        },
        take: 5,
        orderBy: { naam: 'asc' },
      })

      clearHulpSession(phoneNumber)
      const menuButton = [{ id: 'menu', title: '📋 Menu' }]

      if (hulpbronnen.length === 0) {
        return {
          response: `😔 Geen hulpbronnen gevonden voor "${onderdeelTaak.naam}"${gemeente ? ` in ${gemeente}` : ''}.\n\n📞 Bel de Mantelzorglijn: 030-760 60 55\nZij kunnen je verder helpen!`,
          quickReplyButtons: menuButton,
        }
      }

      return {
        response: formatHulpResults(onderdeelTaak.naam, onderdeelTaak.emoji, hulpbronnen, gemeente),
        quickReplyButtons: menuButton,
      }
    }

    // Toon opnieuw de opties
    const numEmojisTaak = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
    let response = `🔧 *Hulp bij een zorgtaak*\n\nBij welke taak zoek je hulp?\n\n`
    HULP_BIJ_TAAK.forEach((opt, i) => {
      response += `${numEmojisTaak[i]} ${opt.naam}\n`
    })
    response += `\n_Typ 1 t/m ${HULP_BIJ_TAAK.length}, of 0 voor terug_`
    return { response }
  }

  return { response: '' }
}

// Helper functie om hulp resultaten te formatteren
function formatHulpResults(
  titel: string,
  emoji: string,
  hulpbronnen: any[],
  gemeente?: string | null
): string {
  let response = `${emoji} *${titel}*\n`
  if (gemeente) response += `_In ${gemeente}_\n`
  response += `\n`

  for (const hulp of hulpbronnen) {
    // Kort de naam in als nodig
    const kortNaam = hulp.naam.length > 40 ? hulp.naam.substring(0, 40) + '...' : hulp.naam
    response += `📍 *${kortNaam}*\n`
    if (hulp.beschrijving) {
      const kortBeschr = hulp.beschrijving.length > 80 ? hulp.beschrijving.substring(0, 80) + '...' : hulp.beschrijving
      response += `${kortBeschr}\n`
    }
    if (hulp.telefoon) response += `📞 ${hulp.telefoon}\n`
    if (hulp.website) {
      const website = hulp.website.replace('https://', '').replace('http://', '')
      response += `🌐 ${website}\n`
    }
    response += `\n`
  }

  return response
}

// ===========================================
// HANDLER: INGELOGDE GEBRUIKER
// ===========================================
async function handleLoggedInUser(
  phoneNumber: string,
  input: string,
  caregiver: any
): Promise<{
  response: string
  useInteractiveButtons?: boolean
  interactiveContentSid?: string
  interactiveBodyText?: string
  quickReplyButtons?: { id: string; title: string }[]
}> {
  const command = input.toLowerCase().trim()

  // Standaard buttons voor ja/soms/nee vragen
  const testAnswerButtons = [
    { id: 'ja', title: '🔴 Ja' },
    { id: 'soms', title: '🟡 Soms' },
    { id: 'nee', title: '🟢 Nee' },
  ]

  // Check of gebruiker al een test heeft gedaan
  const lastTest = await prisma.belastbaarheidTest.findFirst({
    where: { caregiverId: caregiver.id },
    orderBy: { completedAt: 'desc' },
  })

  // Opnieuw test doen - check ook "1" als er al een test is gedaan
  // (Na score zien zijn buttons: 1. Opnieuw testen, 2. Menu)
  const wantsNewTest = command === 'opnieuw' || command === 'nieuwe test' || command === 'hertest' ||
    (command === '1' && lastTest)  // "1" na score zien = opnieuw testen

  if (wantsNewTest) {
    const session = startTestSession(phoneNumber)
    const firstQuestion = getCurrentQuestion(session)

    const questionText = `📊 *Mantelzorg Balanstest*\n\nIk stel je 12 korte vragen.\n\n*Vraag 1/12*\n\n${firstQuestion?.vraag}`

    session.currentStep = 'questions'

    // Start met interactieve buttons
    return {
      response: questionText,
      quickReplyButtons: testAnswerButtons,
    }
  }

  // 1. Balanstest / Mijn Score
  if (
    command === '1' ||
    command === 'test' ||
    command === 'balanstest' ||
    command === 'score' ||
    command === 'check-in'
  ) {
    // Als geen test gedaan: start test
    if (!lastTest) {
      const session = startTestSession(phoneNumber)
      const firstQuestion = getCurrentQuestion(session)

      const questionText = `📊 *Mantelzorg Balanstest*\n\nIk stel je 12 korte vragen.\n\n*Vraag 1/12*\n\n${firstQuestion?.vraag}`

      session.currentStep = 'questions'

      // Start met interactieve buttons
      return {
        response: questionText,
        quickReplyButtons: testAnswerButtons,
      }
    }

    // Als wel test gedaan: toon score met optie om opnieuw te doen
    const levelEmoji =
      lastTest.belastingNiveau === 'HOOG'
        ? '🔴'
        : lastTest.belastingNiveau === 'GEMIDDELD'
          ? '🟠'
          : '🟢'

    const testDate = lastTest.completedAt
      ? new Date(lastTest.completedAt).toLocaleDateString('nl-NL')
      : 'Onbekend'

    const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'
    const dashboardUrl = `${baseUrl}/login`

    let response = `📊 *Jouw Balansscore*\n\n`
    response += `${levelEmoji} Belasting: *${lastTest.belastingNiveau.toLowerCase()}*\n`
    response += `📈 Score: *${lastTest.totaleBelastingScore}/24*\n`
    response += `📅 Datum: ${testDate}\n\n`

    if (lastTest.belastingNiveau === 'HOOG') {
      response += `⚠️ Je belasting is hoog. Zoek hulp!\n\n`
    }

    response += `📱 Bekijk volledig rapport:\n${dashboardUrl}\n\n`

    // Buttons voor opnieuw test en menu (1 = opnieuw, 2 = menu)
    // Let op: als gebruiker "1" typt gaat dit opnieuw naar deze functie,
    // maar omdat er al een test is, moeten we de score tonen MET optie opnieuw
    const scoreButtons = [
      { id: 'opnieuw', title: '🔄 Opnieuw testen' },
      { id: 'menu', title: '📋 Menu' },
    ]

    return { response, quickReplyButtons: scoreButtons }
  }

  // 2. Hulp in de buurt
  if (command === '2' || command === 'hulp' || command === 'help') {
    startHulpSession(phoneNumber)

    // Buttons voor hulp keuze
    const hulpChoiceButtons = [
      { id: 'hulp_mij', title: '💚 Hulp voor mij' },
      { id: 'hulp_taak', title: '🔧 Hulp bij taak' },
    ]

    return {
      response: `🗺️ *Hulp in de Buurt*\n\nWat voor hulp zoek je?`,
      quickReplyButtons: hulpChoiceButtons,
    }
  }

  // 3. Taken
  if (command === '3' || command === 'taken' || command === 'tasks') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tasks = await prisma.task.findMany({
      where: {
        caregiverId: caregiver.id,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
      take: 5,
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    })

    const menuButton = [{ id: 'menu', title: '📋 Menu' }]

    if (tasks.length === 0) {
      return {
        response: `🎉 *Geen open taken!*\n\nGoed bezig!`,
        quickReplyButtons: menuButton,
      }
    }

    let response = `📋 *Jouw taken:*\n\n`
    tasks.forEach((task, i) => {
      const dueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString('nl-NL')
        : 'Geen deadline'
      const priorityIcon = task.priority === 'HIGH' ? '🔴' : task.priority === 'MEDIUM' ? '🟡' : ''
      response += `${i + 1}. ${priorityIcon} ${task.title}\n   📅 ${dueDate}\n\n`
    })

    return { response, quickReplyButtons: menuButton }
  }

  // Rapport bekijken (vanuit test voltooiing buttons)
  if (command === 'rapport') {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'

    // Genereer magic link voor directe toegang naar rapport
    const token = generateShortToken()
    await prisma.magicLinkToken.create({
      data: {
        token,
        userId: caregiver.user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 uur
      },
    })

    // Magic link met redirect parameter naar rapport
    const rapportUrl = `${baseUrl}/m/${token}?redirect=/rapport`

    const response = `📄 *Jouw Rapport*\n\nKlik op de link om je volledige rapport te bekijken:\n\n👉 ${rapportUrl}\n\n_Link is 24 uur geldig_`

    const menuButton = [{ id: 'menu', title: '📋 Menu' }]
    return { response, quickReplyButtons: menuButton }
  }

  // 4. Dashboard
  if (command === '4' || command === 'dashboard') {
    const openTasks = await prisma.task.count({
      where: {
        caregiverId: caregiver.id,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
    })

    let response = `📊 *Mijn Dashboard*\n\n`

    if (lastTest) {
      const levelEmoji =
        lastTest.belastingNiveau === 'HOOG'
          ? '🔴'
          : lastTest.belastingNiveau === 'GEMIDDELD'
            ? '🟠'
            : '🟢'
      response += `${levelEmoji} Belasting: ${lastTest.belastingNiveau.toLowerCase()}\n`
      response += `📊 Score: ${lastTest.totaleBelastingScore}/24\n`
    } else {
      response += `⚠️ Nog geen test gedaan\n`
    }

    response += `📋 Open taken: ${openTasks}\n`

    // Toon zorgtaken als die er zijn
    if (lastTest) {
      const zorgtaken = await prisma.zorgtaakSelectie.findMany({
        where: { testId: lastTest.id, isGeselecteerd: true },
      })
      if (zorgtaken.length > 0) {
        response += `\n🏥 *Jouw zorgtaken:*\n`
        for (const zt of zorgtaken.slice(0, 4)) {
          const moeilijkEmoji =
            zt.moeilijkheid === 'ZEER_MOEILIJK'
              ? '🔴'
              : zt.moeilijkheid === 'MOEILIJK'
                ? '🟠'
                : '🟢'
          response += `${moeilijkEmoji} ${zt.taakNaam}\n`
        }
      }
    }

    // Genereer korte magic link voor directe login
    const token = generateShortToken()
    await prisma.magicLinkToken.create({
      data: {
        token,
        userId: caregiver.userId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minuten geldig
      },
    })

    const magicLink = getMagicLinkUrl(token)
    response += `\n🔗 *Open dashboard:*\n${magicLink}\n\n⏰ _15 min geldig_`

    // Menu button toevoegen
    const menuButton = [{ id: 'menu', title: '📋 Menu' }]
    return { response, quickReplyButtons: menuButton }
  }

  // 5. Contact
  if (command === '5' || command === 'contact' || command === 'praten') {
    const menuButton = [{ id: 'menu', title: '📋 Menu' }]
    return {
      response: `💬 *Direct Persoonlijk Contact*\n\n📞 *Mantelzorglijn*\n   030-760 60 55\n   (ma-vr 9-17u)\n\n🚨 *Crisis / 24/7*\n   113 Zelfmoordpreventie\n   0800-0113\n\n❤️ Je staat er niet alleen voor!`,
      quickReplyButtons: menuButton,
    }
  }

  // Menu (ook via button)
  if (command === '0' || command === 'menu' || command === 'start' || command === '📋 menu') {
    return { response: await getWelcomeBackMessage(caregiver, lastTest) }
  }

  // Begroeting of onbekend
  const greetings = ['hoi', 'hallo', 'hey', 'dag', 'hi', 'hello', 'goedemorgen', 'goedemiddag']
  const isGreeting = greetings.some((g) => command.includes(g))

  if (isGreeting) {
    return { response: await getWelcomeBackMessage(caregiver, lastTest) }
  }

  return { response: await getWelcomeBackMessage(caregiver, lastTest) }
}

// Warme welkom terug boodschap
async function getWelcomeBackMessage(caregiver: any, lastTest: any): Promise<string> {
  const name = caregiver?.user?.name?.split(' ')[0] || 'daar' // Voornaam
  const hour = new Date().getHours()

  let greeting = ''
  if (hour < 12) {
    greeting = 'Goedemorgen'
  } else if (hour < 18) {
    greeting = 'Goedemiddag'
  } else {
    greeting = 'Goedenavond'
  }

  let message = `${greeting} ${name}! 👋\n\nFijn dat je er weer bent.\nHoe kan ik jou vandaag helpen?\n\n`

  message += await getLoggedInMenu(caregiver, lastTest)

  return message
}

// ===========================================
// HANDLER: GAST MENU
// ===========================================
function handleGuestMenu(phoneNumber: string, input: string): {
  response: string
  quickReplyButtons?: { id: string; title: string }[]
} {
  const command = input.toLowerCase().trim()

  // Standaard buttons voor ja/soms/nee vragen
  const testAnswerButtons = [
    { id: 'ja', title: '🔴 Ja' },
    { id: 'soms', title: '🟡 Soms' },
    { id: 'nee', title: '🟢 Nee' },
  ]

  // 1. Balanstest
  if (command === '1' || command === 'test' || command === 'balanstest') {
    const session = startTestSession(phoneNumber)
    const firstQuestion = getCurrentQuestion(session)
    session.currentStep = 'questions'

    // Start met interactieve buttons
    return {
      response: `📊 *Mantelzorg Balanstest*\n\nSuper dat je even stilstaat bij hoe het met jou gaat! 💚\n\nIk stel je 12 korte vragen. Beantwoord ze eerlijk.\n\n*Vraag 1/12*\n\n${firstQuestion?.vraag}`,
      quickReplyButtons: testAnswerButtons,
    }
  }

  // Menu button voor hergebruik
  const menuButton = [{ id: 'menu', title: '📋 Menu' }]

  // 2. Account aanmaken
  if (command === '2' || command === 'account' || command === 'nieuw') {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'
    return {
      response: `✨ *Account aanmaken*

Met een account bewaar ik je resultaten en geef ik persoonlijke tips.

👉 ${baseUrl}/register`,
      quickReplyButtons: menuButton,
    }
  }

  // 3. Inloggen
  if (command === '3' || command === 'inloggen' || command === 'login') {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'
    return {
      response: `🔑 *Inloggen*

Na inloggen wordt je WhatsApp gekoppeld.

👉 ${baseUrl}/login`,
      quickReplyButtons: menuButton,
    }
  }

  // 4. Direct spreken
  if (command === '4' || command === 'praten' || command === 'contact' || command === 'hulp') {
    return {
      response: `💬 *Direct met iemand praten*\n\nSoms wil je gewoon even je verhaal kwijt. Dat begrijp ik. ❤️\n\n📞 *Mantelzorglijn*\n   030-760 60 55\n   (ma-vr 9:00-17:00)\n   _Gratis en anoniem_\n\n🚨 *Crisis / 24 uur*\n   113 Zelfmoordpreventie\n   0800-0113 (gratis)\n\nJe staat er niet alleen voor!`,
      quickReplyButtons: menuButton,
    }
  }

  // Menu
  return { response: getFirstTimeWelcome() }
}

// Eerste keer welkom boodschap
function getFirstTimeWelcome(): string {
  const hour = new Date().getHours()

  let greeting = ''
  if (hour < 12) {
    greeting = 'Goedemorgen'
  } else if (hour < 18) {
    greeting = 'Goedemiddag'
  } else {
    greeting = 'Goedenavond'
  }

  return `${greeting}! 👋\n\n*Welkom bij de Mantelzorg Assistent*\n\nIk ben er om jou te helpen. Mantelzorg is waardevol én zwaar werk. Goed voor jezelf zorgen is net zo belangrijk als zorgen voor een ander. 💚\n\n*Zo werkt het:*\nIk kan je helpen met de Balanstest, hulp zoeken in de buurt, en je taken bijhouden.\n\n*Wat wil je doen?*\n\n1️⃣ Balanstest doen\n    _Ontdek hoe het met je gaat_\n2️⃣ Account aanmaken\n    _Bewaar je resultaten_\n3️⃣ Inloggen\n    _Ik heb al een account_\n4️⃣ Direct iemand spreken\n    _Ik wil nu hulp_\n\n_Typ het nummer van je keuze_`
}

// ===========================================
// HELPER FUNCTIES
// ===========================================

async function getLoggedInMenu(caregiver: any, lastTest: any): Promise<string> {
  const name = caregiver?.user?.name || 'daar'

  // Bepaal of test is gedaan
  const hasTest = !!lastTest
  const testLabel = hasTest ? 'Mijn balansscore' : 'Balanstest doen'

  let menu = `*Wat wil je doen?*\n\n`
  menu += `1️⃣ ${testLabel} 📊\n`
  menu += `2️⃣ Hulp in de buurt 🗺️\n`
  menu += `3️⃣ Mijn taken 📋\n`
  menu += `4️⃣ Mijn dashboard 📈\n`
  menu += `5️⃣ Direct contact 💬\n`
  menu += `\n_Typ het nummer van je keuze_`

  return menu
}

async function finishTestAndRespond(
  phoneNumber: string,
  session: any,
  caregiver: any
): Promise<{
  response: string
  quickReplyButtons?: { id: string; title: string }[]
}> {
  const score = calculateScore(session.answers)
  const level = getScoreLevel(score)
  const userName = caregiver?.user?.name?.split(' ')[0] || ''

  // Stuur eerst de score infographic (als afbeelding)
  try {
    const imageUrl = getScoreImageUrl(score, level, userName)
    await sendWhatsAppMessageWithImage({
      to: phoneNumber,
      body: `📊 Jouw Balanstest Resultaat`,
      imageUrl,
    })
  } catch (error) {
    console.error('Kon infographic niet versturen:', error)
    // Ga door met tekst-only als afbeelding faalt
  }

  // Als ingelogd: sla op en toon resultaat
  if (caregiver) {
    await saveTestResults(caregiver.id, session, score, level)
    clearTestSession(phoneNumber)

    const response = await buildTestCompletionMessage(session, score, level, true)

    // Buttons voor vervolgacties na test voltooiing
    const completionButtons = [
      { id: 'rapport', title: '📄 Bekijk rapport' },
      { id: 'menu', title: '📋 Menu' },
    ]

    return { response, quickReplyButtons: completionButtons }
  }

  // Niet ingelogd: vraag om account aan te maken
  clearTestSession(phoneNumber)

  // Start onboarding met pending test results
  const pendingResults = createPendingTestResults(session)
  startOnboardingSession(phoneNumber, 'choice', pendingResults)

  // Buttons voor inloggen/registreren keuze
  const choiceButtons = [
    { id: 'inloggen', title: '🔑 Inloggen' },
    { id: 'registreren', title: '✨ Account maken' },
  ]

  let response = await buildTestCompletionMessage(session, score, level, false)
  response += `\n\n💾 *Wil je dit resultaat bewaren?*`

  return {
    response,
    quickReplyButtons: choiceButtons,
  }
}

async function buildTestCompletionMessage(
  session: any,
  score: number,
  level: string,
  isLoggedIn: boolean
): Promise<string> {
  let levelEmoji = '🟢'
  let levelText = 'laag'
  if (level === 'GEMIDDELD') {
    levelEmoji = '🟠'
    levelText = 'gemiddeld'
  }
  if (level === 'HOOG') {
    levelEmoji = '🔴'
    levelText = 'hoog'
  }

  let response = `✅ *Test Voltooid!*\n\n📊 Je score: *${score}/24*\n${levelEmoji} Belastingniveau: *${levelText}*\n\n`

  // Toon zorgtaken samenvatting
  const zwareTaakIds: string[] = []
  if (session.selectedTasks && session.selectedTasks.length > 0) {
    let totaleUren = 0
    let zwareTaken: string[] = []

    response += `📋 *Jouw zorgtaken:*\n`
    for (const taskId of session.selectedTasks) {
      const taak = ZORGTAKEN.find((t) => t.id === taskId)
      const details = session.taskDetails[taskId] || {}
      const urenOptie = UREN_OPTIES.find((u) => u.label === details.hours)

      if (urenOptie) totaleUren += urenOptie.waarde

      let moeilijkheidEmoji = '🟢' // NEE = niet zwaar
      if (details.difficulty === 'JA') {
        moeilijkheidEmoji = '🔴' // JA = wel zwaar
        zwareTaken.push(taak?.naam || '')
        zwareTaakIds.push(taskId)
      } else if (details.difficulty === 'SOMS') {
        moeilijkheidEmoji = '🟡' // SOMS = soms zwaar
        zwareTaken.push(taak?.naam || '')
        zwareTaakIds.push(taskId)
      }
      // NEE = niet zwaar, blijft 🟢

      response += `${moeilijkheidEmoji} ${taak?.naam} (${details.hours || '?'})\n`
    }

    response += `\n⏱️ Totaal: ~${totaleUren} uur/week\n\n`

    if (zwareTaken.length > 0) {
      response += `⚠️ *Aandachtspunt:* ${zwareTaken.join(', ')} vind je zwaar.\n\n`
    }
  }

  // Haal hulpbronnen op voor zware taken
  // Map taak IDs naar Excel "Onderdeel mantelzorgtest" waarden
  const taakIdNaarOnderdeel: Record<string, string> = {
    t1: 'Persoonlijke verzorging',
    t2: 'Huishoudelijke taken',
    t3: 'Persoonlijke verzorging', // Medicijnen valt onder persoonlijke verzorging
    t4: 'Vervoer',
    t5: 'Administratie en aanvragen',
    t6: 'Sociaal contact en activiteiten',
    t7: 'Persoonlijke verzorging', // Toezicht valt onder persoonlijke verzorging
    t8: 'Persoonlijke verzorging', // Medische zorg valt onder persoonlijke verzorging
  }

  if (zwareTaakIds.length > 0) {
    try {
      // Converteer taak IDs naar onderdeel waarden
      const onderdeelWaarden = [...new Set(zwareTaakIds.map((id) => taakIdNaarOnderdeel[id]).filter(Boolean))]

      if (onderdeelWaarden.length > 0) {
        const hulpbronnen = await prisma.zorgorganisatie.findMany({
          where: {
            isActief: true,
            onderdeelTest: { in: onderdeelWaarden },
            zichtbaarBijHoog: true,
          },
          take: 3,
          orderBy: { naam: 'asc' },
        })

        if (hulpbronnen.length > 0) {
          response += `💡 *Hulp bij jouw zware taken:*\n\n`
          for (const hulp of hulpbronnen) {
            response += `📍 *${hulp.naam}*\n`
            if (hulp.telefoon) response += `   📞 ${hulp.telefoon}\n`
            if (hulp.website) response += `   🌐 ${hulp.website}\n`
            response += `\n`
          }
        }
      }
    } catch (error) {
      console.error('Error fetching hulpbronnen:', error)
    }
  }

  // Waarschuwing bij hoog niveau
  if (level === 'HOOG') {
    response += `🚨 *Let op!* Je belasting is hoog.\n\n📞 Praat met iemand:\n- Mantelzorglijn: 030-760 60 55\n- Crisis: 113 (24/7)\n\n`
  } else if (level === 'GEMIDDELD') {
    response += `💛 Blijf goed op jezelf letten!\n\n`
  } else {
    response += `💚 Goed bezig!\n\n`
  }

  if (isLoggedIn) {
    response += `📄 Klik op "Bekijk rapport" hieronder voor je volledige overzicht.`
  }

  return response
}

async function saveTestResults(
  caregiverId: string,
  session: any,
  score: number,
  level: string
) {
  try {
    // Bereken totale zorguren
    let totaleZorguren = 0
    for (const taskId of session.selectedTasks || []) {
      const details = session.taskDetails?.[taskId]
      if (details?.hours) {
        const urenOptie = UREN_OPTIES.find((u) => u.label === details.hours)
        if (urenOptie) totaleZorguren += urenOptie.waarde
      }
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId },
      include: { user: true },
    })

    const testResult = await prisma.belastbaarheidTest.create({
      data: {
        caregiverId,
        voornaam: caregiver?.user.name || 'Onbekend',
        email: caregiver?.user.email || '',
        postcode: caregiver?.postalCode || '0000XX',
        huisnummer: '0',
        totaleBelastingScore: score,
        belastingNiveau: level as any,
        totaleZorguren,
        isCompleted: true,
        completedAt: new Date(),
      },
    })

    // Sla antwoorden op
    for (const [vraagId, antwoord] of Object.entries(session.answers || {})) {
      const vraag = BELASTBAARHEID_QUESTIONS.find((q) => q.id === vraagId)
      let scoreVal = 0
      if (antwoord === 'ja') scoreVal = 2
      else if (antwoord === 'soms') scoreVal = 1

      await prisma.belastbaarheidAntwoord.create({
        data: {
          testId: testResult.id,
          vraagId,
          vraagTekst: vraag?.vraag || vraagId,
          antwoord: antwoord as string,
          score: scoreVal,
          gewicht: 1.0, // Alle vragen hebben gelijk gewicht
        },
      })
    }

    // Sla taakselecties op
    for (const taskId of session.selectedTasks || []) {
      const taak = ZORGTAKEN.find((t) => t.id === taskId)
      const details = session.taskDetails?.[taskId] || {}
      const urenOptie = UREN_OPTIES.find((u) => u.label === details.hours)

      await prisma.zorgtaakSelectie.create({
        data: {
          testId: testResult.id,
          taakId: taskId,
          taakNaam: taak?.naam || taskId,
          isGeselecteerd: true,
          urenPerWeek: urenOptie?.waarde || null,
          moeilijkheid: details.difficulty || null,
        },
      })
    }

    return testResult
  } catch (error) {
    console.error('Error saving test results:', error)
    return null
  }
}

async function savePendingTestResults(
  caregiverId: string,
  pendingResults: NonNullable<ReturnType<typeof getOnboardingSession>>['pendingTestResults']
) {
  if (!pendingResults) return

  const mockSession = {
    answers: pendingResults.answers,
    selectedTasks: pendingResults.selectedTasks,
    taskDetails: pendingResults.taskDetails,
  }

  await saveTestResults(
    caregiverId,
    mockSession,
    pendingResults.score,
    pendingResults.level
  )
}

async function lookupAddress(
  postcode: string,
  huisnummer: string
): Promise<{ street?: string; city?: string; municipality?: string } | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(
      `${baseUrl}/api/location/lookup?postcode=${encodeURIComponent(postcode)}&huisnummer=${encodeURIComponent(huisnummer)}`
    )

    if (response.ok) {
      const data = await response.json()
      return {
        street: data.straat,
        city: data.woonplaats,
        municipality: data.gemeente,
      }
    }
  } catch (error) {
    console.error('Address lookup error:', error)
  }
  return null
}

// ===========================================
// RESPONSE HELPERS
// ===========================================

async function sendResponse(
  response: string,
  phoneNumber: string,
  useInteractiveButtons: boolean,
  interactiveContentSid?: string,
  interactiveBodyText?: string,
  quickReplyButtons?: { id: string; title: string }[]
): Promise<NextResponse> {
  if (!response && !useInteractiveButtons && !quickReplyButtons) {
    response = '❌ Er ging iets mis. Typ iets om opnieuw te beginnen.'
  }

  // Als er quick reply buttons zijn, voeg ze toe als tekst
  // (Interactieve buttons werken niet met Twilio Sandbox)
  if (quickReplyButtons && quickReplyButtons.length > 0) {
    let messageWithButtons = response + '\n\n'
    const numEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
    quickReplyButtons.forEach((btn, index) => {
      const numEmoji = numEmojis[index] || `${index + 1}.`
      messageWithButtons += `${numEmoji} ${btn.title}\n`
    })
    // Dynamisch de keuze-opties tonen op basis van aantal buttons
    const numOptions = quickReplyButtons.length
    const optionsText = numOptions === 2 ? '1 of 2' : `1, 2${numOptions > 2 ? ` of ${numOptions}` : ''}`
    messageWithButtons += `\n_Typ je keuze (${optionsText})_`
    return sendTwiML(messageWithButtons)
  }

  return sendTwiML(response)
}

function sendTwiML(message: string): NextResponse {
  const escapedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapedMessage}</Message>
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

// ===========================================
// GET ENDPOINT
// ===========================================

export async function GET() {
  return NextResponse.json({ message: 'WhatsApp webhook endpoint' })
}
