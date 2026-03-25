import prisma from '@/lib/prisma'
import {
  getOnboardingSession,
  updateOnboardingSession,
  clearOnboardingSession,
  isValidPostcode,
  normalizePostcode,
  RELATIE_OPTIES,
} from '@/lib/whatsapp-session'
import { branding } from '@/config/branding'
import type { HandlerResult } from './types'
import { ONBOARDING_CHOICE_BUTTONS } from './types'
import { savePendingTestResults } from './belastbaarheidstest'
import { getLoggedInMenu } from './logged-in-menu'

export async function handleOnboardingSession(
  phoneNumber: string,
  input: string,
  session: Awaited<ReturnType<typeof getOnboardingSession>>
): Promise<HandlerResult> {
  if (!session) return { response: '' }

  const command = input.trim()
  const commandLower = command.toLowerCase()

  // Stop/annuleer
  if (commandLower === 'stop' || commandLower === '0') {
    await clearOnboardingSession(phoneNumber)
    return { response: `_Geannuleerd_\n\n_Typ 0 voor menu_` }
  }

  // STAP: Keuze na test (inloggen of registreren)
  if (session.currentStep === 'choice') {
    const num = parseInt(command)

    if (num === 1 || commandLower === 'inloggen') {
      const baseUrl = branding.urls.production
      await clearOnboardingSession(phoneNumber)
      return {
        response: `🔑 *Inloggen*

Je testresultaten worden opgeslagen na inloggen.

👉 ${baseUrl}/login

_Typ 0 voor menu_`,
      }
    }

    if (num === 2 || commandLower === 'registreren') {
      const baseUrl = branding.urls.production
      await clearOnboardingSession(phoneNumber)
      return {
        response: `✨ *Account aanmaken*

Je testresultaten worden opgeslagen na registratie.

👉 ${baseUrl}/register

_Typ 0 voor menu_`,
      }
    }

    return {
      response: `💾 *Wil je dit resultaat bewaren?*`,
      quickReplyButtons: ONBOARDING_CHOICE_BUTTONS,
    }
  }

  // STAP: Locatie - Eigen postcode
  if (session.currentStep === 'location_own_postcode') {
    if (!isValidPostcode(command)) {
      return { response: `❌ Ongeldige postcode.\n\n📮 Typ je postcode (bijv: 1234 AB):` }
    }

    const postcode = normalizePostcode(command)
    await updateOnboardingSession(phoneNumber, 'location_own_huisnummer', { ownPostcode: postcode })
    return { response: `🏠 Wat is je huisnummer?` }
  }

  // STAP: Locatie - Eigen huisnummer
  if (session.currentStep === 'location_own_huisnummer') {
    const addressData = await lookupAddress(session.data.ownPostcode!, command)

    await updateOnboardingSession(phoneNumber, 'location_care_name', {
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
    await updateOnboardingSession(phoneNumber, 'location_care_relation', { careName: command })

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

    await updateOnboardingSession(phoneNumber, 'location_care_postcode', { careRelation: relation })
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
    await updateOnboardingSession(phoneNumber, 'location_care_huisnummer', { carePostcode: postcode })
    return { response: `🏠 Wat is het huisnummer van ${session.data.careName}?` }
  }

  // STAP: Locatie - Naaste huisnummer
  if (session.currentStep === 'location_care_huisnummer') {
    const addressData = await lookupAddress(session.data.carePostcode!, command)

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

      if (session.pendingTestResults) {
        await savePendingTestResults(caregiver.id, session.pendingTestResults)
      }
    }

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

    await clearOnboardingSession(phoneNumber)

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
