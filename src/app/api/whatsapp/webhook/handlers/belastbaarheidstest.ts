import prisma from '@/lib/prisma'
import {
  sendWhatsAppMessageWithImage,
  getScoreImageUrl,
  generateShortToken,
  getMagicLinkUrl,
} from '@/lib/twilio'
import {
  getTestSession,
  updateTestAnswer,
  getCurrentQuestion,
  calculateScore,
  getScoreLevel,
  clearTestSession,
  BELASTBAARHEID_QUESTIONS,
  ZORGTAKEN,
  UREN_OPTIES,
  startTasksFlow,
  setSelectedTasks,
  setTaskHours,
  setTaskDifficulty,
  getCurrentTask,
  createPendingTestResults,
  startOnboardingSession,
} from '@/lib/whatsapp-session'
import type { HandlerResult } from './types'
import { TEST_ANSWER_BUTTONS, DIFFICULTY_BUTTONS, ONBOARDING_CHOICE_BUTTONS } from './types'

export async function handleTestSession(
  phoneNumber: string,
  input: string,
  session: ReturnType<typeof getTestSession>,
  caregiver: any
): Promise<HandlerResult> {
  if (!session) return { response: '' }

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

        const response = `📋 *Vind je ${taak?.beschrijving?.toLowerCase() || taak?.naam?.toLowerCase()} een zware taak?*`
        return {
          response,
          quickReplyButtons: DIFFICULTY_BUTTONS,
        }
      }
    }

    return { response: `❌ Typ een nummer van 1 tot ${UREN_OPTIES.length}` }
  }

  // STAP: Moeilijkheid per taak
  if (session.currentStep === 'tasks_difficulty') {
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
        const nextQuestion = getCurrentQuestion(updatedSession)
        if (nextQuestion) {
          const questionNum = updatedSession.currentQuestion + 1
          const questionText = `📊 *Vraag ${questionNum}/${BELASTBAARHEID_QUESTIONS.length}*\n\n${nextQuestion.vraag}`

          return {
            response: questionText,
            quickReplyButtons: TEST_ANSWER_BUTTONS,
          }
        }
      }
    } else if (command === 'stop' || command === 'stoppen') {
      clearTestSession(phoneNumber)
      return { response: `❌ Test gestopt.\n\n_Typ 0 voor menu_` }
    }

    // Ongeldig antwoord
    const currentQuestion = getCurrentQuestion(session)
    const questionNum = session.currentQuestion + 1
    const questionText = `❌ Kies een antwoord:\n\n📊 *Vraag ${questionNum}/${BELASTBAARHEID_QUESTIONS.length}*\n\n${currentQuestion?.vraag}`

    return {
      response: questionText,
      quickReplyButtons: TEST_ANSWER_BUTTONS,
    }
  }

  return { response: '' }
}

// ===========================================
// TEST COMPLETION HELPERS
// ===========================================

async function finishTestAndRespond(
  phoneNumber: string,
  session: any,
  caregiver: any
): Promise<HandlerResult> {
  const score = calculateScore(session.answers)
  const level = getScoreLevel(score)
  const userName = caregiver?.user?.name?.split(' ')[0] || ''

  // Stuur eerst de score infographic
  try {
    const imageUrl = getScoreImageUrl(score, level, userName)
    await sendWhatsAppMessageWithImage({
      to: phoneNumber,
      body: `📊 Jouw Balanstest Resultaat`,
      imageUrl,
    })
  } catch (error) {
    console.error('Kon infographic niet versturen:', error)
  }

  // Als ingelogd: sla op en toon resultaat
  if (caregiver) {
    await saveTestResults(caregiver.id, session, score, level)
    clearTestSession(phoneNumber)

    const response = await buildTestCompletionMessage(session, score, level, true)

    const completionButtons = [
      { id: 'rapport', title: '📄 Bekijk rapport' },
    ]

    return { response, quickReplyButtons: completionButtons }
  }

  // Niet ingelogd: vraag om account aan te maken
  clearTestSession(phoneNumber)

  const pendingResults = createPendingTestResults(session)
  startOnboardingSession(phoneNumber, 'choice', pendingResults)

  let response = await buildTestCompletionMessage(session, score, level, false)
  response += `\n\n💾 *Wil je dit resultaat bewaren?*`

  return {
    response,
    quickReplyButtons: ONBOARDING_CHOICE_BUTTONS,
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

      let moeilijkheidEmoji = '🟢'
      if (details.difficulty === 'JA') {
        moeilijkheidEmoji = '🔴'
        zwareTaken.push(taak?.naam || '')
        zwareTaakIds.push(taskId)
      } else if (details.difficulty === 'SOMS') {
        moeilijkheidEmoji = '🟡'
        zwareTaken.push(taak?.naam || '')
        zwareTaakIds.push(taskId)
      }

      response += `${moeilijkheidEmoji} ${taak?.naam} (${details.hours || '?'})\n`
    }

    response += `\n⏱️ Totaal: ~${totaleUren} uur/week\n\n`

    if (zwareTaken.length > 0) {
      response += `⚠️ *Aandachtspunt:* ${zwareTaken.join(', ')} vind je zwaar.\n\n`
    }
  }

  // Haal hulpbronnen op voor zware taken
  const taakIdNaarOnderdeel: Record<string, string> = {
    t1: 'Persoonlijke verzorging',
    t2: 'Huishoudelijke taken',
    t3: 'Persoonlijke verzorging',
    t4: 'Vervoer',
    t5: 'Administratie en aanvragen',
    t6: 'Sociaal contact en activiteiten',
    t7: 'Persoonlijke verzorging',
    t8: 'Persoonlijke verzorging',
  }

  if (zwareTaakIds.length > 0) {
    try {
      const onderdeelWaarden = [...new Set(zwareTaakIds.map((id) => taakIdNaarOnderdeel[id]).filter(Boolean))]

      if (onderdeelWaarden.length > 0) {
        const hulpbronnen = await prisma.zorgorganisatie.findMany({
          where: {
            isActief: true,
            onderdeelTest: { in: onderdeelWaarden },
            zichtbaarBijHoog: true,
          },
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
          gewicht: 1.0,
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

export async function savePendingTestResults(
  caregiverId: string,
  pendingResults: any
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
