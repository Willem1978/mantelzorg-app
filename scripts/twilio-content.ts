/**
 * Script om Twilio Content Templates te beheren
 *
 * Gebruik:
 * npx ts-node scripts/twilio-content.ts list    - Bekijk alle templates
 * npx ts-node scripts/twilio-content.ts create  - Maak nieuwe template met emoji knoppen
 */

import twilio from 'twilio'
import * as dotenv from 'dotenv'

dotenv.config()

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

if (!accountSid || !authToken) {
  console.error('TWILIO_ACCOUNT_SID en TWILIO_AUTH_TOKEN moeten in .env staan')
  process.exit(1)
}

const client = twilio(accountSid, authToken)

async function listContentTemplates() {
  console.log('\n📋 Bestaande Content Templates:\n')

  try {
    const contents = await client.content.v1.contents.list({ limit: 20 })

    if (contents.length === 0) {
      console.log('Geen Content Templates gevonden.')
      return
    }

    for (const content of contents) {
      console.log(`SID: ${content.sid}`)
      console.log(`  Naam: ${content.friendlyName}`)
      console.log(`  Types: ${JSON.stringify(content.types)}`)
      console.log('')
    }
  } catch (error: any) {
    console.error('Fout bij ophalen templates:', error.message)
  }
}

async function createEmojiButtonTemplate() {
  console.log('\n🎨 Nieuwe Content Template aanmaken met emoji knoppen...\n')

  try {
    // Maak een Quick Reply template met emoji's in de knopteksten
    const content = await client.content.v1.contents.create({
      friendlyName: 'balanstest-antwoord-emoji',
      language: 'nl',
      types: {
        'twilio/quick-reply': {
          body: 'Hoe is dit voor jou?',
          actions: [
            { id: 'ja', title: '🔴 Ja' },
            { id: 'soms', title: '🟠 Soms' },
            { id: 'nee', title: '🟢 Nee' },
          ],
        },
      } as any,
    })

    console.log('✅ Content Template aangemaakt!')
    console.log(`   SID: ${content.sid}`)
    console.log(`   Naam: ${content.friendlyName}`)
    console.log('')
    console.log('📝 Voeg deze SID toe aan je .env bestand:')
    console.log(`   TWILIO_CONTENT_SID_TEST_ANSWER="${content.sid}"`)

  } catch (error: any) {
    console.error('Fout bij aanmaken template:', error.message)
    if (error.code === 20001) {
      console.log('\n💡 Tip: Controleer of je Twilio account Content API toegang heeft.')
    }
  }
}

async function deleteTemplate(sid: string) {
  console.log(`\n🗑️ Template ${sid} verwijderen...`)

  try {
    await client.content.v1.contents(sid).remove()
    console.log('✅ Template verwijderd!')
  } catch (error: any) {
    console.error('Fout bij verwijderen:', error.message)
  }
}

// Main
const command = process.argv[2]

switch (command) {
  case 'list':
    listContentTemplates()
    break
  case 'create':
    createEmojiButtonTemplate()
    break
  case 'delete':
    const sid = process.argv[3]
    if (!sid) {
      console.error('Gebruik: npx ts-node scripts/twilio-content.ts delete <SID>')
      process.exit(1)
    }
    deleteTemplate(sid)
    break
  default:
    console.log('Twilio Content Template Manager')
    console.log('')
    console.log('Gebruik:')
    console.log('  npx ts-node scripts/twilio-content.ts list     - Bekijk alle templates')
    console.log('  npx ts-node scripts/twilio-content.ts create   - Maak emoji template')
    console.log('  npx ts-node scripts/twilio-content.ts delete <SID> - Verwijder template')
}
