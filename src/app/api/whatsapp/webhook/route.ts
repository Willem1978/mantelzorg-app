import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseIncomingWhatsAppMessage } from '@/lib/twilio'
import {
  getTestSession,
  getHulpSession,
  getOnboardingSession,
} from '@/lib/whatsapp-session'

import { handleTestSession } from './handlers/belastbaarheidstest'
import { handleHulpSession } from './handlers/hulp-session'
import { handleOnboardingSession } from './handlers/onboarding-session'
import { handleLoggedInUser } from './handlers/logged-in-menu'
import { handleGuestMenu } from './handlers/guest-menu'
import { sendResponse, sendTwiML } from './handlers/response'

export const dynamic = 'force-dynamic'

/**
 * Strip 'whatsapp:' prefix van telefoonnummer
 */
function stripWhatsAppPrefix(phoneNumber: string): string {
  return phoneNumber.replace('whatsapp:', '')
}

/**
 * ===========================================
 * WHATSAPP WEBHOOK - ROUTER
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
 * 1. Eerste bericht → Menu: Test / Hulp / Dashboard / Contact
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

    // Zoek gekoppelde gebruiker
    const phoneWithPrefix = message.from
    const phoneWithoutPrefix = stripWhatsAppPrefix(message.from)

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

export async function GET() {
  return NextResponse.json({ message: 'WhatsApp webhook endpoint' })
}
