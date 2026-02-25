import prisma from '@/lib/prisma'
import { branding } from '@/config/branding'
import {
  generateShortToken,
  getMagicLinkUrl,
} from '@/lib/twilio'
import {
  startTestSession,
  getCurrentQuestion,
  startHulpSession,
} from '@/lib/whatsapp-session'
import type { HandlerResult } from './types'
import { TEST_ANSWER_BUTTONS, HULP_CHOICE_BUTTONS } from './types'

export async function handleLoggedInUser(
  phoneNumber: string,
  input: string,
  caregiver: any
): Promise<HandlerResult> {
  const command = input.toLowerCase().trim()

  // Check of gebruiker al een test heeft gedaan
  const lastTest = await prisma.belastbaarheidTest.findFirst({
    where: { caregiverId: caregiver.id },
    orderBy: { completedAt: 'desc' },
  })

  // ===========================================
  // PRIORITEIT: BUTTON ID's (rapport, menu, opnieuw)
  // ===========================================

  // Rapport bekijken
  if (command === 'rapport' || command === '📄 bekijk rapport') {
    const baseUrl = branding.urls.production

    const token = generateShortToken()
    await prisma.magicLinkToken.create({
      data: {
        token,
        userId: caregiver.user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const rapportUrl = `${baseUrl}/m/${token}?redirect=/rapport`

    const response = `📄 *Jouw Rapport*\n\nKlik op de link om je volledige rapport te bekijken:\n\n👉 ${rapportUrl}\n\n_Link is 24 uur geldig_\n\n_Typ 0 voor menu_`

    return { response }
  }

  // Menu
  if (command === '0' || command === 'menu' || command === 'start' || command === '📋 menu') {
    return { response: await getWelcomeBackMessage(caregiver, lastTest) }
  }

  // Opnieuw testen
  if (command === 'opnieuw' || command === 'nieuwe test' || command === 'hertest' || command === '🔄 opnieuw testen') {
    const session = startTestSession(phoneNumber)
    const firstQuestion = getCurrentQuestion(session)

    const questionText = `📊 *Mantelzorg Balanstest*\n\nIk stel je 12 korte vragen.\n\n*Vraag 1/12*\n\n${firstQuestion?.vraag}`

    session.currentStep = 'questions'

    return {
      response: questionText,
      quickReplyButtons: TEST_ANSWER_BUTTONS,
    }
  }

  // ===========================================
  // STANDAARD MENU NUMMERS (1-4)
  // ===========================================

  // 1. Balanstest / Mijn Score
  if (
    command === '1' ||
    command === 'test' ||
    command === 'balanstest' ||
    command === 'score' ||
    command === 'check-in'
  ) {
    if (!lastTest) {
      const session = startTestSession(phoneNumber)
      const firstQuestion = getCurrentQuestion(session)

      const questionText = `📊 *Mantelzorg Balanstest*\n\nIk stel je 12 korte vragen.\n\n*Vraag 1/12*\n\n${firstQuestion?.vraag}`

      session.currentStep = 'questions'

      return {
        response: questionText,
        quickReplyButtons: TEST_ANSWER_BUTTONS,
      }
    }

    const levelEmoji =
      lastTest.belastingNiveau === 'HOOG'
        ? '🔴'
        : lastTest.belastingNiveau === 'GEMIDDELD'
          ? '🟠'
          : '🟢'

    const testDate = lastTest.completedAt
      ? new Date(lastTest.completedAt).toLocaleDateString('nl-NL')
      : 'Onbekend'

    const baseUrl = branding.urls.production
    const dashboardUrl = `${baseUrl}/login`

    let response = `📊 *Jouw Balansscore*\n\n`
    response += `${levelEmoji} Belasting: *${lastTest.belastingNiveau.toLowerCase()}*\n`
    response += `📈 Score: *${lastTest.totaleBelastingScore}/24*\n`
    response += `📅 Datum: ${testDate}\n\n`

    if (lastTest.belastingNiveau === 'HOOG') {
      response += `⚠️ Je belasting is hoog. Zoek hulp!\n\n`
    }

    response += `📱 Bekijk volledig rapport:\n${dashboardUrl}\n\n`

    const scoreButtons = [
      { id: 'opnieuw', title: '🔄 Opnieuw testen' },
    ]

    return { response, quickReplyButtons: scoreButtons }
  }

  // 2. Hulp in de buurt
  if (command === '2' || command === 'hulp' || command === 'help') {
    startHulpSession(phoneNumber)

    return {
      response: `🗺️ *Hulp in de Buurt*\n\nWat voor hulp zoek je?`,
      quickReplyButtons: HULP_CHOICE_BUTTONS,
    }
  }

  // 3. Dashboard
  if (command === '3' || command === 'dashboard') {
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

    const token = generateShortToken()
    await prisma.magicLinkToken.create({
      data: {
        token,
        userId: caregiver.userId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    })

    const magicLink = getMagicLinkUrl(token)
    response += `\n🔗 *Open dashboard:*\n${magicLink}\n\n⏰ _15 min geldig_\n\n_Typ 0 voor menu_`

    return { response }
  }

  // 4. Contact
  if (command === '4' || command === 'contact' || command === 'praten') {
    return {
      response: `💬 *Direct Persoonlijk Contact*\n\n📞 *Mantelzorglijn*\n   030-760 60 55\n   (ma-vr 9-17u)\n\n🚨 *Crisis / 24/7*\n   113 Zelfmoordpreventie\n   0800-0113\n\n❤️ Je staat er niet alleen voor!\n\n_Typ 0 voor menu_`,
    }
  }

  // Begroeting of onbekend
  const greetings = ['hoi', 'hallo', 'hey', 'dag', 'hi', 'hello', 'goedemorgen', 'goedemiddag']
  const isGreeting = greetings.some((g) => command.includes(g))

  if (isGreeting) {
    return { response: await getWelcomeBackMessage(caregiver, lastTest) }
  }

  return { response: await getWelcomeBackMessage(caregiver, lastTest) }
}

async function getWelcomeBackMessage(caregiver: any, lastTest: any): Promise<string> {
  const name = caregiver?.user?.name?.split(' ')[0] || 'daar'
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

export async function getLoggedInMenu(caregiver: any, lastTest: any): Promise<string> {
  const hasTest = !!lastTest
  const testLabel = hasTest ? 'Mijn balansscore' : 'Balanstest doen'

  let menu = `*Wat wil je doen?*\n\n`
  menu += `1️⃣ ${testLabel} 📊\n`
  menu += `2️⃣ Hulp in de buurt 🗺️\n`
  menu += `3️⃣ Mijn dashboard 📈\n`
  menu += `4️⃣ Direct contact 💬\n`
  menu += `\n_Typ het nummer van je keuze_`

  return menu
}
