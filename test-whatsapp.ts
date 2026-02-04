/**
 * Test script voor WhatsApp integratie
 *
 * Gebruik: npx ts-node test-whatsapp.ts
 */

import { sendWhatsAppMessage, WhatsAppTemplates } from './src/lib/twilio.js'

async function testWhatsApp() {
  console.log('🧪 WhatsApp Test Script')
  console.log('========================\n')

  // Vervang met je eigen telefoonnummer (met landcode)
  const testPhoneNumber = '+31612345678' // VERANDER DIT!

  console.log(`📱 Test nummer: ${testPhoneNumber}`)
  console.log('⚠️  Zorg dat je eerst "join <sandbox-code>" hebt gestuurd naar het Twilio sandbox nummer!\n')

  try {
    console.log('📤 Versturen test bericht...')

    const testMessage = `Hoi! 👋\n\nDit is een test bericht van je Mantelzorgmaatje app.\n\nAls je dit ontvangt, werkt de WhatsApp integratie! 🎉\n\nTyp "hulp" om te zien wat ik kan doen.`

    const result = await sendWhatsAppMessage({
      to: testPhoneNumber,
      body: testMessage,
    })

    console.log('✅ Bericht verzonden!')
    console.log(`📨 Message SID: ${result.sid}`)
    console.log(`📅 Verzonden op: ${result.dateCreated}`)
    console.log(`💰 Prijs: ${result.price} ${result.priceUnit}`)
    console.log(`📊 Status: ${result.status}`)

    console.log('\n🎯 Test geslaagd!')
    console.log('\nVolgende stappen:')
    console.log('1. Check je WhatsApp voor het test bericht')
    console.log('2. Stuur "hulp" terug om de chatbot te testen')
    console.log('3. Configureer je webhook URL in Twilio Console')
    console.log(`   URL: https://jouw-domain.com/api/whatsapp/webhook`)
  } catch (error: any) {
    console.error('❌ Fout bij test:', error.message)

    if (error.code === 20003) {
      console.log('\n⚠️  Authenticatie fout! Check je Twilio credentials in .env')
    } else if (error.code === 21614) {
      console.log('\n⚠️  Telefoonnummer is niet verbonden met de Twilio sandbox!')
      console.log('Stuur eerst "join <sandbox-code>" naar het Twilio sandbox nummer')
    } else {
      console.log('\nDebug info:', error)
    }
  }
}

// Test verschillende templates
async function testTemplates() {
  console.log('\n📋 Template Tests')
  console.log('==================\n')

  const testNaam = 'Jan'

  console.log('1. Check-in Reminder:')
  console.log(WhatsAppTemplates.checkInReminder(testNaam, 'Februari 2026').body)
  console.log('\n---\n')

  console.log('2. Task Reminder:')
  console.log(WhatsAppTemplates.taskReminder(testNaam, 'Boodschappen doen', '10 feb 2026').body)
  console.log('\n---\n')

  console.log('3. High Burden Alert:')
  console.log(WhatsAppTemplates.highBurdenAlert(testNaam, 18).body)
  console.log('\n---\n')

  console.log('4. Welcome Message:')
  console.log(WhatsAppTemplates.welcomeMessage(testNaam).body)
  console.log('\n---\n')
}

// Run tests
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--templates')) {
    await testTemplates()
  } else if (args.includes('--send')) {
    await testWhatsApp()
  } else {
    console.log('Gebruik:')
    console.log('  npx ts-node test-whatsapp.ts --templates  (Toon templates)')
    console.log('  npx ts-node test-whatsapp.ts --send       (Verstuur test bericht)')
    console.log('\n⚠️  Vergeet niet je telefoonnummer in te vullen in het script!')
  }
}

main()
