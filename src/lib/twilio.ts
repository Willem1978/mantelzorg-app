import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
import { branding } from '@/config/branding'

const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || `whatsapp:${branding.contact.whatsappNumber}`
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured. WhatsApp features will be disabled.')
}

export const twilioClient = accountSid && authToken
  ? twilio(accountSid, authToken)
  : null

// ============================================
// INTERACTIEVE BERICHTEN MET KNOPPEN
// ============================================

export interface QuickReplyButton {
  id: string
  title: string // Max 20 characters
}

export interface InteractiveMessageOptions {
  to: string
  body: string
  buttons?: QuickReplyButton[] // Max 3 buttons voor Quick Reply
  footer?: string
}

/**
 * Stuur een WhatsApp bericht met interactieve Quick Reply knoppen
 *
 * BELANGRIJK: Interactieve buttons werken NIET met de Twilio Sandbox!
 * Ze vereisen een goedgekeurd WhatsApp Business account.
 *
 * Deze functie stuurt daarom altijd tekst met genummerde opties,
 * wat universeel werkt met alle WhatsApp accounts.
 */
export async function sendInteractiveButtonMessage(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  headerText?: string,
  footerText?: string
): Promise<any> {
  if (!twilioClient) {
    throw new Error('Twilio client not configured')
  }

  // Altijd tekst-gebaseerd bericht sturen (werkt met Sandbox)
  // Interactieve buttons werken alleen met goedgekeurd WhatsApp Business account
  return sendTextWithButtonFallback(to, bodyText, buttons, headerText, footerText)
}

/**
 * Fallback: Stuur tekst met genummerde opties als interactieve knoppen niet werken
 */
async function sendTextWithButtonFallback(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  headerText?: string,
  footerText?: string
): Promise<any> {
  if (!twilioClient) {
    throw new Error('Twilio client not configured')
  }

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  let messageBody = ''
  if (headerText) {
    messageBody += `*${headerText}*\n\n`
  }
  messageBody += bodyText + '\n\n'

  buttons.forEach((btn, index) => {
    const numEmoji = ['1️⃣', '2️⃣', '3️⃣'][index] || `${index + 1}.`
    messageBody += `${numEmoji} ${btn.title}\n`
  })

  if (footerText) {
    messageBody += `\n_${footerText}_`
  }

  const message = await twilioClient.messages.create({
    from: whatsappFrom,
    to: formattedTo,
    body: messageBody,
  })

  return message
}

/**
 * Maak een tekst-gebaseerd menu met nummers en emoji's
 * Dit is de fallback als echte knoppen niet beschikbaar zijn
 */
export function formatTextMenu(options: { emoji: string; label: string }[]): string {
  return options
    .map((opt, i) => `${i + 1}️⃣ ${opt.label} ${opt.emoji}`)
    .join('\n')
}

/**
 * Maak een tekst-gebaseerd antwoordmenu (ja/soms/nee)
 */
export function formatAnswerOptions(): string {
  return `🔴 Ja\n🟠 Soms\n🟢 Nee`
}

// ============================================
// CONTENT API VOOR INTERACTIEVE BERICHTEN
// ============================================

// Content Template SIDs - Maak deze aan in Twilio Console
// Ga naar: Messaging > Content Template Builder
// Klik op "Create new" en kies "twilio/quick-reply"
// Sla op ZONDER te submitten voor goedkeuring (voor in-sessie gebruik)
export const CONTENT_SIDS = {
  // Hoofdmenu met 3 knoppen (max voor in-sessie)
  mainMenu: process.env.TWILIO_CONTENT_SID_MAIN_MENU,
  // Test antwoord opties (Ja/Soms/Nee)
  testAnswer: process.env.TWILIO_CONTENT_SID_TEST_ANSWER,
  // Onboarding keuze (Account/Nieuw)
  onboardingChoice: process.env.TWILIO_CONTENT_SID_ONBOARDING,
}

/**
 * Stuur een interactief bericht met Content Template (echte knoppen)
 *
 * Vereist: Content Templates aangemaakt in Twilio Console
 * Binnen 24-uur sessie: Geen goedkeuring nodig
 * Max 3 knoppen voor in-sessie berichten
 */
export async function sendContentTemplateMessage(
  to: string,
  contentSid: string,
  contentVariables?: Record<string, string>
) {
  if (!twilioClient) {
    throw new Error('Twilio client not configured')
  }

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  try {
    const messageOptions: any = {
      from: whatsappFrom,
      to: formattedTo,
      contentSid: contentSid,
    }

    if (contentVariables) {
      messageOptions.contentVariables = JSON.stringify(contentVariables)
    }

    const message = await twilioClient.messages.create(messageOptions)
    console.log(`Interactive message sent. SID: ${message.sid}`)
    return message
  } catch (error) {
    console.error('Error sending content template message:', error)
    throw error
  }
}

/**
 * Stuur een interactief bericht met Quick Reply knoppen
 *
 * Fallback: Als geen Content Template beschikbaar is, stuur tekst met nummers
 */
export async function sendQuickReplyMessage(
  to: string,
  headerText: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  footerText?: string,
  contentSid?: string
) {
  if (!twilioClient) {
    throw new Error('Twilio client not configured')
  }

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  // Als we een contentSid hebben, gebruik die voor echte knoppen
  if (contentSid) {
    try {
      const message = await twilioClient.messages.create({
        from: whatsappFrom,
        to: formattedTo,
        contentSid: contentSid,
      })
      console.log(`Quick reply message sent with buttons. SID: ${message.sid}`)
      return message
    } catch (error) {
      console.error('Content template failed, falling back to text:', error)
      // Fall through naar tekst versie
    }
  }

  // Fallback: Tekst met genummerde opties
  let messageBody = ''
  if (headerText) {
    messageBody += `*${headerText}*\n\n`
  }
  messageBody += bodyText + '\n\n'

  buttons.forEach((btn, index) => {
    const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][index] || `${index + 1}.`
    messageBody += `${numEmoji} ${btn.title}\n`
  })

  if (footerText) {
    messageBody += `\n_${footerText}_`
  }

  try {
    const message = await twilioClient.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body: messageBody,
    })
    return message
  } catch (error) {
    console.error('Error sending quick reply message:', error)
    throw error
  }
}

/**
 * Stuur een interactief list bericht
 * Hiermee kan de gebruiker kiezen uit een lijst met opties
 */
export async function sendListMessage(
  to: string,
  headerText: string,
  bodyText: string,
  buttonText: string,
  sections: {
    title: string
    rows: { id: string; title: string; description?: string }[]
  }[]
) {
  if (!twilioClient) {
    throw new Error('Twilio client not configured')
  }

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  // Bouw het list bericht als tekst met genummerde opties
  let messageBody = ''
  if (headerText) {
    messageBody += `*${headerText}*\n\n`
  }
  messageBody += bodyText + '\n\n'

  let optionNum = 1
  sections.forEach((section) => {
    if (section.title) {
      messageBody += `📋 *${section.title}*\n`
    }
    section.rows.forEach((row) => {
      const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][optionNum - 1] || `${optionNum}.`
      messageBody += `${numEmoji} ${row.title}`
      if (row.description) {
        messageBody += `\n   _${row.description}_`
      }
      messageBody += '\n'
      optionNum++
    })
    messageBody += '\n'
  })

  messageBody += `💬 Typ het nummer van je keuze`

  try {
    const message = await twilioClient.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body: messageBody,
    })
    return message
  } catch (error) {
    console.error('Error sending list message:', error)
    throw error
  }
}

export interface WhatsAppMessage {
  to: string // Phone number with country code, e.g., '+31612345678'
  body: string
  mediaUrl?: string[]
}

/**
 * Stuur een WhatsApp bericht via Twilio
 */
export async function sendWhatsAppMessage({ to, body, mediaUrl }: WhatsAppMessage) {
  if (!twilioClient) {
    throw new Error('Twilio client not configured. Check your environment variables.')
  }

  // Zorg dat het 'to' nummer het whatsapp: prefix heeft
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  try {
    const message = await twilioClient.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body,
      ...(mediaUrl && { mediaUrl }),
    })

    console.log(`WhatsApp bericht verzonden naar ${formattedTo}. SID: ${message.sid}`)
    return message
  } catch (error) {
    console.error('Fout bij versturen WhatsApp bericht:', error)
    throw error
  }
}

/**
 * Verwerk inkomende WhatsApp berichten (webhook handler)
 */
export function parseIncomingWhatsAppMessage(body: any) {
  return {
    from: body.From?.replace('whatsapp:', '') || '',
    to: body.To?.replace('whatsapp:', '') || '',
    body: body.Body || '',
    messageId: body.MessageSid || '',
    numMedia: parseInt(body.NumMedia || '0'),
    mediaUrls: Array.from({ length: parseInt(body.NumMedia || '0') }, (_, i) =>
      body[`MediaUrl${i}`]
    ),
  }
}

/**
 * Stuur een WhatsApp bericht MET afbeelding (bijv. score infographic)
 */
export async function sendWhatsAppMessageWithImage({
  to,
  body,
  imageUrl,
}: {
  to: string
  body: string
  imageUrl: string
}) {
  if (!twilioClient) {
    throw new Error('Twilio client not configured')
  }

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  try {
    const message = await twilioClient.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body,
      mediaUrl: [imageUrl],
    })

    console.log(`WhatsApp bericht met afbeelding verzonden. SID: ${message.sid}`)
    return message
  } catch (error) {
    console.error('Fout bij versturen afbeelding:', error)
    throw error
  }
}

/**
 * Genereer URL voor score infographic
 */
export function getScoreImageUrl(score: number, level: string, name?: string): string {
  const baseUrl = branding.urls.production
  const params = new URLSearchParams({
    score: score.toString(),
    level,
    ...(name && { name }),
  })
  return `${baseUrl}/api/score-image?${params.toString()}`
}

/**
 * Genereer magic link URL voor directe dashboard login vanuit WhatsApp
 * Token is 15 minuten geldig en kan maar 1x gebruikt worden
 * Gebruikt korte /m/ route voor betere leesbaarheid in WhatsApp
 */
export function getMagicLinkUrl(token: string): string {
  const baseUrl = branding.urls.production
  return `${baseUrl}/m/${token}`
}

/**
 * Genereer korte magic link token (12 karakters)
 * Wordt gebruikt voor kortere URLs in WhatsApp
 * Vermijdt verwarrende karakters (0/O, 1/l/I)
 */
export function generateShortToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Template berichten voor de mantelzorg app
 */
export const WhatsAppTemplates = {
  checkInReminder: (naam: string, maand: string) => ({
    body: `Hoi ${naam}! 👋\n\nHet is weer tijd voor je maandelijkse check-in voor ${maand}.\n\nHoe gaat het met je? Neem even de tijd om je welzijn te delen.\n\n🔗 Login op: ${process.env.NEXTAUTH_URL}/check-in\n\nGroet,\nJe Mantelzorgmaatje`
  }),

  taskReminder: (naam: string, taakTitel: string, dueDate: string) => ({
    body: `Hoi ${naam}! 📋\n\nHerinnering voor je taak:\n"${taakTitel}"\n\nVervaldatum: ${dueDate}\n\n✅ Markeer als voltooid op: ${process.env.NEXTAUTH_URL}/taken\n\nSucces!`
  }),

  highBurdenAlert: (naam: string, score: number) => ({
    body: `Hoi ${naam}, 💛\n\nWe zien dat je belastbaarheidsscore hoog is (${score}/24).\n\nWeet dat je er niet alleen voor staat. Er is hulp beschikbaar.\n\n📞 Praat met iemand:\n- Mantelzorglijn: 030-760 60 55\n- Bel direct: 113 (bij crisis)\n\n💬 Bekijk hulpbronnen: ${process.env.NEXTAUTH_URL}/hulp`
  }),

  welcomeMessage: (naam: string) => ({
    body: `👋 Welkom ${naam}!\n\nBedankt voor je registratie bij Mantelzorgmaatje.\n\n📋 *MENU* - Typ een nummer:\n\n1️⃣ Mijn status\n2️⃣ Mijn taken  \n3️⃣ Check-in\n4️⃣ Hulpbronnen\n5️⃣ Contact\n\n🔗 Start intake: ${process.env.NEXTAUTH_URL}/intake\n\n💬 Typ gewoon een nummer!`
  }),

  intakeComplete: (naam: string) => ({
    body: `Gefeliciteerd ${naam}! ✨\n\nJe hebt de intake voltooid. We hebben je antwoorden ontvangen.\n\nOp basis van je profiel kunnen we je nu persoonlijke tips en hulpbronnen aanbieden.\n\n👉 Bekijk je dashboard: ${process.env.NEXTAUTH_URL}/dashboard`
  }),
}
