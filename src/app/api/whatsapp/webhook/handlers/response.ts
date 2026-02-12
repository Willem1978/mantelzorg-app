import { NextResponse } from 'next/server'
import type { QuickReplyButton } from './types'

export async function sendResponse(
  response: string,
  phoneNumber: string,
  useInteractiveButtons: boolean,
  interactiveContentSid?: string,
  interactiveBodyText?: string,
  quickReplyButtons?: QuickReplyButton[]
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
    // Voeg altijd menu optie toe met 0
    messageWithButtons += `\n0️⃣ Terug naar menu\n`
    messageWithButtons += `\n_Typ het nummer van je keuze_`
    return sendTwiML(messageWithButtons)
  }

  return sendTwiML(response)
}

export function sendTwiML(message: string): NextResponse {
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
