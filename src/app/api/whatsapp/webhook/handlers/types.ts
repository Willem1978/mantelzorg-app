/**
 * Gedeelde types voor WhatsApp webhook handlers
 */

export interface QuickReplyButton {
  id: string
  title: string
}

export interface HandlerResult {
  response: string
  useInteractiveButtons?: boolean
  interactiveContentSid?: string
  interactiveBodyText?: string
  quickReplyButtons?: QuickReplyButton[]
}

/** Standaard buttons voor ja/soms/nee vragen */
export const TEST_ANSWER_BUTTONS: QuickReplyButton[] = [
  { id: 'ja', title: '🔴 Ja' },
  { id: 'soms', title: '🟡 Soms' },
  { id: 'nee', title: '🟢 Nee' },
]

/** Buttons voor moeilijkheid (omgekeerde volgorde) */
export const DIFFICULTY_BUTTONS: QuickReplyButton[] = [
  { id: 'nee', title: '🟢 Nee' },
  { id: 'soms', title: '🟡 Soms' },
  { id: 'ja', title: '🔴 Ja' },
]

/** Buttons voor hulp keuze */
export const HULP_CHOICE_BUTTONS: QuickReplyButton[] = [
  { id: 'hulp_mij', title: '💚 Hulp voor mij' },
  { id: 'hulp_taak', title: '🔧 Hulp bij taak' },
]

/** Buttons voor inloggen/registreren keuze */
export const ONBOARDING_CHOICE_BUTTONS: QuickReplyButton[] = [
  { id: 'inloggen', title: '🔑 Inloggen' },
  { id: 'registreren', title: '✨ Account maken' },
]
