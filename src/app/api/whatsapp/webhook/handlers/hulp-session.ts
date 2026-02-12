import prisma from '@/lib/prisma'
import {
  getHulpSession,
  updateHulpSession,
  clearHulpSession,
  HULP_VOOR_MANTELZORGER,
  HULP_BIJ_TAAK,
} from '@/lib/whatsapp-session'
import type { HandlerResult } from './types'
import { HULP_CHOICE_BUTTONS } from './types'

export async function handleHulpSession(
  phoneNumber: string,
  input: string,
  session: ReturnType<typeof getHulpSession>,
  caregiver: any
): Promise<HandlerResult> {
  if (!session) return { response: '' }

  const command = input.toLowerCase().trim()
  const num = parseInt(command)

  // Annuleren
  if (command === 'stop' || command === 'terug' || command === '0') {
    clearHulpSession(phoneNumber)
    return { response: `_Hulp zoeken geannuleerd_\n\n_Typ 0 voor menu_` }
  }

  // STAP 1: Hoofdkeuze - hulp voor mij of hulp bij taak
  if (session.currentStep === 'main_choice') {
    if (num === 1 || command === 'hulp_mij') {
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
      updateHulpSession(phoneNumber, 'onderdeel_taak', { mainChoice: 'taak' })

      const numEmojis2 = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
      let response = `🔧 *Hulp bij een zorgtaak*\n\nBij welke taak zoek je hulp?\n\n`
      HULP_BIJ_TAAK.forEach((opt, i) => {
        response += `${numEmojis2[i]} ${opt.naam}\n`
      })
      response += `\n_Typ 1 t/m ${HULP_BIJ_TAAK.length}, of 0 voor terug_`
      return { response }
    }

    return {
      response: `🗺️ *Hulp in de Buurt*\n\nWat voor hulp zoek je?`,
      quickReplyButtons: HULP_CHOICE_BUTTONS,
    }
  }

  // STAP 2A: Soort hulp kiezen (voor mantelzorger)
  if (session.currentStep === 'soort_hulp') {
    if (num >= 1 && num <= HULP_VOOR_MANTELZORGER.length) {
      const soortHulp = HULP_VOOR_MANTELZORGER[num - 1]
      updateHulpSession(phoneNumber, 'results', { soortHulp: soortHulp.dbValue })

      const gemeente = caregiver?.municipality

      const lokaleHulp = gemeente ? await prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          onderdeelTest: 'Mantelzorgondersteuning',
          soortHulp: soortHulp.dbValue,
          gemeente,
        },
        orderBy: { naam: 'asc' },
      }) : []

      const landelijkeHulp = await prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          onderdeelTest: 'Mantelzorgondersteuning',
          soortHulp: soortHulp.dbValue,
          gemeente: null,
        },
        orderBy: { naam: 'asc' },
      })

      const hulpbronnen = [...lokaleHulp, ...landelijkeHulp]

      clearHulpSession(phoneNumber)

      if (hulpbronnen.length === 0) {
        return {
          response: `😔 Geen hulpbronnen gevonden voor "${soortHulp.naam}"${gemeente ? ` in ${gemeente}` : ''}.\n\n📞 Bel de Mantelzorglijn: 030-760 60 55\nZij kunnen je verder helpen!\n\n_Typ 0 voor menu_`,
        }
      }

      return {
        response: formatHulpResults(soortHulp.naam, soortHulp.emoji, hulpbronnen, gemeente) + `\n\n_Typ 0 voor menu_`,
      }
    }

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

      const gemeente = caregiver?.careRecipientMunicipality || caregiver?.municipality

      const lokaleHulp = gemeente ? await prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          onderdeelTest: onderdeelTaak.dbValue,
          gemeente,
        },
        orderBy: { naam: 'asc' },
      }) : []

      const landelijkeHulp = await prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          onderdeelTest: onderdeelTaak.dbValue,
          gemeente: null,
        },
        orderBy: { naam: 'asc' },
      })

      const hulpbronnen = [...lokaleHulp, ...landelijkeHulp]

      clearHulpSession(phoneNumber)

      if (hulpbronnen.length === 0) {
        return {
          response: `😔 Geen hulpbronnen gevonden voor "${onderdeelTaak.naam}"${gemeente ? ` in ${gemeente}` : ''}.\n\n📞 Bel de Mantelzorglijn: 030-760 60 55\nZij kunnen je verder helpen!\n\n_Typ 0 voor menu_`,
        }
      }

      return {
        response: formatHulpResults(onderdeelTaak.naam, onderdeelTaak.emoji, hulpbronnen, gemeente) + `\n\n_Typ 0 voor menu_`,
      }
    }

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
