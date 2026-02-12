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

// Hierarchical location matching: hoe lokaler hoe beter
// Returns hulpbronnen sorted by locality: wijk > woonplaats > gemeente > provincie > landelijk
async function findHulpbronnenHierarchisch(
  filters: { onderdeelTest?: string; soortHulp?: string },
  gemeente?: string | null,
  woonplaats?: string | null,
  wijk?: string | null
) {
  const where: any = {
    isActief: true,
    ...filters,
  }

  const alleHulpbronnen = await prisma.zorgorganisatie.findMany({
    where,
    orderBy: { naam: 'asc' },
  })

  // Score each hulpbron by locality match (higher = more local = better)
  const scored = alleHulpbronnen.map((h) => {
    let score = 0
    const niveau = h.dekkingNiveau || (h.gemeente ? 'GEMEENTE' : 'LANDELIJK')

    if (niveau === 'WIJK' && gemeente && h.gemeente === gemeente) {
      // Check if user's wijk is in the coverage
      const wkList = (h.dekkingWijken as string[] | null) || []
      if (wijk && wkList.includes(wijk)) {
        score = 5 // Best: exact wijk match
      } else if (wkList.length > 0) {
        score = 0 // Has specific wijken but user's wijk is not in it
      } else {
        score = 3 // Fallback: whole gemeente
      }
    } else if (niveau === 'WOONPLAATS' && gemeente && h.gemeente === gemeente) {
      // Check if user's woonplaats is in the coverage
      const wpList = (h.dekkingWoonplaatsen as string[] | null) || []
      if (woonplaats && wpList.includes(woonplaats)) {
        score = 4 // Great: exact woonplaats match
      } else if (wpList.length > 0) {
        score = 0 // Has specific woonplaatsen but user's woonplaats is not in it
      } else {
        score = 3 // Fallback: whole gemeente
      }
    } else if (niveau === 'GEMEENTE' && gemeente && h.gemeente === gemeente) {
      score = 3 // Good: whole gemeente match
    } else if (niveau === 'PROVINCIE' && h.provincie) {
      // We don't currently store province on caregiver, so just include province-level
      score = 2
    } else if (niveau === 'LANDELIJK') {
      score = 1 // Fallback: landelijk
    }

    return { hulpbron: h, score }
  })

  // Filter out non-matching (score 0) and sort by score descending
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.hulpbron)
}

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
      const woonplaats = caregiver?.city
      const wijk = caregiver?.neighborhood

      const hulpbronnen = await findHulpbronnenHierarchisch(
        { onderdeelTest: 'Mantelzorgondersteuning', soortHulp: soortHulp.dbValue },
        gemeente,
        woonplaats,
        wijk
      )

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

      // For task help, use care recipient location (more relevant for local services)
      const gemeente = caregiver?.careRecipientMunicipality || caregiver?.municipality
      const woonplaats = caregiver?.careRecipientCity || caregiver?.city
      const wijk = caregiver?.careRecipientNeighborhood || caregiver?.neighborhood

      const hulpbronnen = await findHulpbronnenHierarchisch(
        { onderdeelTest: onderdeelTaak.dbValue },
        gemeente,
        woonplaats,
        wijk
      )

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
  if (gemeente) response += `_In ${gemeente} en omgeving_\n`
  response += `\n`

  for (const hulp of hulpbronnen) {
    const kortNaam = hulp.naam.length > 40 ? hulp.naam.substring(0, 40) + '...' : hulp.naam
    const niveau = hulp.dekkingNiveau || (hulp.gemeente ? 'GEMEENTE' : 'LANDELIJK')
    const locatieLabel = niveau === 'LANDELIJK' ? '🇳🇱' :
                         niveau === 'PROVINCIE' ? `🏛️ ${hulp.provincie || ''}` :
                         `📍`
    response += `${locatieLabel} *${kortNaam}*\n`
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
