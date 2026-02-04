/**
 * Simpel test script voor WhatsApp integratie
 * Run met: node test-whatsapp-simple.js
 */

const twilio = require('twilio');

// Laad environment variables
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

console.log('🧪 WhatsApp Test Script');
console.log('========================\n');

// Check credentials
if (!accountSid || accountSid === 'your_account_sid_here') {
  console.error('❌ TWILIO_ACCOUNT_SID niet geconfigureerd in .env');
  process.exit(1);
}

if (!authToken || authToken === 'your_auth_token_here') {
  console.error('❌ TWILIO_AUTH_TOKEN niet geconfigureerd in .env');
  process.exit(1);
}

console.log('✅ Credentials geladen');
console.log(`📱 Van nummer: ${whatsappFrom}`);
console.log(`🔑 Account SID: ${accountSid.substring(0, 10)}...`);
console.log();

// Check command line arguments
const args = process.argv.slice(2);

if (args[0] === '--templates') {
  console.log('📋 Beschikbare Templates:\n');

  console.log('1. ✅ Check-in Reminder:');
  console.log('─'.repeat(50));
  console.log(`Hoi Jan! 👋

Het is weer tijd voor je maandelijkse check-in voor Februari 2026.

Hoe gaat het met je? Neem even de tijd om je welzijn te delen.

🔗 Login op: http://localhost:3000/check-in

Groet,
Je Mantelzorgmaatje`);
  console.log();

  console.log('2. 📋 Task Reminder:');
  console.log('─'.repeat(50));
  console.log(`Hoi Jan! 📋

Herinnering voor je taak:
"Boodschappen doen"

Vervaldatum: 10 feb 2026

✅ Markeer als voltooid op: http://localhost:3000/taken

Succes!`);
  console.log();

  console.log('3. 🚨 High Burden Alert:');
  console.log('─'.repeat(50));
  console.log(`Hoi Jan, 💛

We zien dat je belastbaarheidsscore hoog is (18/24).

Weet dat je er niet alleen voor staat. Er is hulp beschikbaar.

📞 Praat met iemand:
- Mantelzorglijn: 030-760 60 55
- Bel direct: 113 (bij crisis)

💬 Bekijk hulpbronnen: http://localhost:3000/hulp`);
  console.log();

  console.log('4. 🎉 Welcome Message:');
  console.log('─'.repeat(50));
  console.log(`Welkom Jan! 🎉

Bedankt voor je registratie bij Mantelzorgmaatje.

We helpen je graag om je welzijn als mantelzorger te monitoren en ondersteunen waar nodig.

Start hier: http://localhost:3000/intake

Veel sterkte! 💪`);
  console.log();

  process.exit(0);
}

if (args[0] === '--send') {
  // VERANDER DIT NAAR JOUW NUMMER!
  const testPhoneNumber = '+31619323793'; // ← Vul hier je nummer in!

  console.log(`📤 Test bericht versturen naar: ${testPhoneNumber}`);
  console.log('⚠️  Zorg dat je "join fifty-weather" hebt gestuurd!\n');

  const client = twilio(accountSid, authToken);

  const testMessage = `Hoi! 👋

Dit is een test bericht van je Mantelzorgmaatje app.

Als je dit ontvangt, werkt de WhatsApp integratie! 🎉

Typ "hulp" om te zien wat ik kan doen.`;

  client.messages
    .create({
      from: whatsappFrom,
      to: `whatsapp:${testPhoneNumber}`,
      body: testMessage,
    })
    .then(message => {
      console.log('✅ Bericht verzonden!');
      console.log(`📨 Message SID: ${message.sid}`);
      console.log(`📊 Status: ${message.status}`);
      console.log();
      console.log('🎯 Test geslaagd!');
      console.log('\nVolgende stappen:');
      console.log('1. Check je WhatsApp voor het test bericht');
      console.log('2. Stuur "hulp" terug om de chatbot te testen');
    })
    .catch(error => {
      console.error('❌ Fout bij versturen:', error.message);

      if (error.code === 20003) {
        console.log('\n⚠️  Authenticatie fout! Check je credentials');
      } else if (error.code === 21614) {
        console.log('\n⚠️  Telefoonnummer niet verbonden met sandbox!');
        console.log('Stuur eerst "join fifty-weather" naar +1 415 523 8886');
      } else if (error.code === 21408) {
        console.log('\n⚠️  Ongeldig telefoonnummer formaat!');
        console.log('Gebruik formaat: +31612345678');
      }
    });
} else {
  console.log('Gebruik:');
  console.log('  node test-whatsapp-simple.js --templates  (Toon templates)');
  console.log('  node test-whatsapp-simple.js --send       (Verstuur test bericht)');
  console.log();
  console.log('⚠️  Voor --send: Pas eerst je telefoonnummer aan in het script!');
}
