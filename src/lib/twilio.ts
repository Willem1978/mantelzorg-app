import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured. WhatsApp features will be disabled.')
}

export const twilioClient = accountSid && authToken
  ? twilio(accountSid, authToken)
  : null

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
