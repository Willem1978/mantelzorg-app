import { branding } from '@/config/branding'
import {
  startTestSession,
  getCurrentQuestion,
} from '@/lib/whatsapp-session'
import type { HandlerResult } from './types'
import { TEST_ANSWER_BUTTONS } from './types'

export async function handleGuestMenu(phoneNumber: string, input: string): Promise<HandlerResult> {
  const command = input.toLowerCase().trim()

  // 1. Balanstest
  if (command === '1' || command === 'test' || command === 'balanstest') {
    const session = await startTestSession(phoneNumber)
    const firstQuestion = getCurrentQuestion(session)
    session.currentStep = 'questions'

    return {
      response: `📊 *Mantelzorg Balanstest*\n\nSuper dat je even stilstaat bij hoe het met jou gaat! 💚\n\nIk stel je 12 korte vragen. Beantwoord ze eerlijk.\n\n*Vraag 1/12*\n\n${firstQuestion?.vraag}`,
      quickReplyButtons: TEST_ANSWER_BUTTONS,
    }
  }

  // 2. Account aanmaken
  if (command === '2' || command === 'account' || command === 'nieuw') {
    const baseUrl = branding.urls.production
    return {
      response: `✨ *Account aanmaken*

Met een account bewaar ik je resultaten en geef ik persoonlijke tips.

👉 ${baseUrl}/register

_Typ 0 voor menu_`,
    }
  }

  // 3. Inloggen
  if (command === '3' || command === 'inloggen' || command === 'login') {
    const baseUrl = branding.urls.production
    return {
      response: `🔑 *Inloggen*

Na inloggen wordt je WhatsApp gekoppeld.

👉 ${baseUrl}/login

_Typ 0 voor menu_`,
    }
  }

  // 4. Direct spreken
  if (command === '4' || command === 'praten' || command === 'contact' || command === 'hulp') {
    return {
      response: `💬 *Direct met iemand praten*\n\nSoms wil je gewoon even je verhaal kwijt. Dat begrijp ik. ❤️\n\n📞 *Mantelzorglijn*\n   030-760 60 55\n   (ma-vr 9:00-17:00)\n   _Gratis en anoniem_\n\n🚨 *Crisis / 24 uur*\n   113 Zelfmoordpreventie\n   0800-0113 (gratis)\n\nJe staat er niet alleen voor!\n\n_Typ 0 voor menu_`,
    }
  }

  // Menu
  return { response: getFirstTimeWelcome() }
}

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
