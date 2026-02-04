# WhatsApp Integratie Setup Guide

## 📱 Overzicht

Deze mantelzorg-app heeft nu WhatsApp integratie via Twilio. Gebruikers kunnen:
- 🔔 Herinneringen ontvangen voor check-ins en taken
- 💬 Commands sturen via WhatsApp (status, taken, hulp)
- 🤖 Interactie hebben met een chatbot
- 🚨 Alerts ontvangen bij hoge belastbaarheidscores

---

## 🚀 Stap 1: Twilio Account Aanmaken

1. Ga naar: https://www.twilio.com/try-twilio
2. Maak een gratis account aan
3. Verifieer je email en telefoonnummer
4. Je krijgt gratis credits ($15-20) voor testing

---

## 📞 Stap 2: WhatsApp Sandbox Activeren

1. **Log in op Twilio Console**: https://console.twilio.com

2. **Navigeer naar WhatsApp Sandbox**:
   - Klik op **"Messaging"** in het menu
   - Klik op **"Try it out"**
   - Selecteer **"Send a WhatsApp message"**

3. **Verbind je WhatsApp**:
   - Je ziet een sandbox nummer (bijvoorbeeld: `+1 415 523 8886`)
   - Je ziet een code zoals: `join example-word`
   - Open WhatsApp op je telefoon
   - Stuur exact deze code naar het sandbox nummer
   - Je ontvangt een bevestigingsbericht

4. **Noteer je Sandbox Code**:
   - Je krijgt een unieke sandbox code
   - Anderen moeten ook deze code sturen om WhatsApp berichten te ontvangen

---

## 🔑 Stap 3: API Credentials Ophalen

1. **Account SID en Auth Token**:
   - Ga naar https://console.twilio.com
   - Op je dashboard zie je:
     - **Account SID** (begint met AC...)
     - **Auth Token** (klik op "Show" om te zien)
   - Kopieer beide waarden

2. **WhatsApp Sandbox Nummer**:
   - Ga naar: **Messaging > Try it out > WhatsApp Sandbox**
   - Kopieer het nummer onder "Sandbox Configuration"
   - Formaat: `+14155238886` (dit varieert per account)

---

## ⚙️ Stap 4: Configureer Environment Variables

1. Open het `.env` bestand in de root van het project

2. Vul de volgende waarden in:

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

**Let op**:
- Vervang `ACxxxxxx...` met je echte Account SID
- Vervang `your_auth_token_here` met je Auth Token
- Update het `TWILIO_WHATSAPP_FROM` nummer met jouw sandbox nummer

---

## 🔄 Stap 5: Herstart Development Server

```bash
# Stop de huidige server (Ctrl+C)

# Start opnieuw
npm run dev
```

---

## 🧪 Stap 6: Test de Integratie

### Optie A: Test Templates (Geen Twilio account nodig)

```bash
npx ts-node test-whatsapp.ts --templates
```

Dit toont alle beschikbare WhatsApp bericht templates.

### Optie B: Verstuur Test Bericht

1. Open `test-whatsapp.ts`
2. Verander regel 14:
   ```typescript
   const testPhoneNumber = '+31612345678' // Jouw nummer met landcode!
   ```
3. Run de test:
   ```bash
   npx ts-node test-whatsapp.ts --send
   ```
4. Check je WhatsApp voor het test bericht

### Optie C: Test via API

Gebruik de send API endpoint:

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "caregiverId": "clxxx",
    "template": "welcomeMessage"
  }'
```

---

## 🌐 Stap 7: Configureer Webhook (voor inkomende berichten)

Om berichten van gebruikers te ontvangen, moet je een webhook instellen.

### Lokaal Testen met ngrok (Development)

1. **Installeer ngrok**: https://ngrok.com/download

2. **Start ngrok**:
   ```bash
   ngrok http 3000
   ```

3. **Kopieer de HTTPS URL** (bijvoorbeeld: `https://abc123.ngrok.io`)

4. **Configureer in Twilio**:
   - Ga naar: **Messaging > Settings > WhatsApp Sandbox Settings**
   - Bij **"WHEN A MESSAGE COMES IN"**:
     - Vul in: `https://abc123.ngrok.io/api/whatsapp/webhook`
     - HTTP Method: **POST**
   - Klik op **Save**

5. **Test inkomende berichten**:
   - Stuur "hulp" naar je Twilio sandbox nummer via WhatsApp
   - Je krijgt een lijst met beschikbare commands terug

### Productie (Deployed app)

Vervang de ngrok URL met je productie URL:
```
https://jouw-domain.com/api/whatsapp/webhook
```

---

## 💬 Beschikbare WhatsApp Commands

Gebruikers kunnen de volgende commands sturen via WhatsApp:

| Command | Beschrijving |
|---------|-------------|
| `hulp` of `help` | Toon alle beschikbare commands |
| `status` | Bekijk je welzijnsstatus en open taken |
| `taken` | Lijst met openstaande taken |
| `check-in` | Link naar maandelijkse check-in |
| `praten` | Contact opnemen met zorgorganisatie |

---

## 🎯 WhatsApp Functionaliteit in de App

### 1. Automatische Herinneringen

De app kan automatisch WhatsApp berichten sturen:

```typescript
// In je code
import { sendWhatsAppMessage, WhatsAppTemplates } from '@/lib/twilio'

// Verstuur check-in herinnering
await sendWhatsAppMessage({
  to: caregiver.phoneNumber,
  body: WhatsAppTemplates.checkInReminder(naam, maand).body
})
```

### 2. Gebruik de API Endpoints

**Verstuur bericht via API:**
```typescript
// POST /api/whatsapp/send
const response = await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    caregiverId: 'clxxx',
    template: 'checkInReminder'
  })
})
```

### 3. Webhook Handler

De webhook (`/api/whatsapp/webhook`) verwerkt automatisch inkomende berichten en:
- Herkent gebruikers op basis van telefoonnummer
- Verwerkt commands
- Stuurt relevante informatie terug

---

## 📊 Database Vereisten

Zorg dat caregivers een telefoonnummer hebben:

```typescript
// Update caregiver met telefoonnummer
await prisma.caregiver.update({
  where: { id: caregiverId },
  data: {
    phoneNumber: '+31612345678' // Met landcode!
  }
})
```

---

## 🔐 Beveiliging

### Productie Best Practices:

1. **Webhook Validatie**: Voeg Twilio signature validatie toe
2. **Rate Limiting**: Beperk aantal berichten per gebruiker
3. **Environment Variables**: Gebruik nooit hardcoded credentials
4. **HTTPS**: Gebruik altijd HTTPS voor webhooks

### Twilio Signature Validatie (Optioneel):

```typescript
import { validateRequest } from 'twilio'

const isValid = validateRequest(
  process.env.TWILIO_AUTH_TOKEN,
  twilioSignature,
  url,
  params
)
```

---

## 💰 Kosten

### Sandbox (Gratis):
- ✅ Gratis voor testing
- ⚠️ Beperkt tot 10 geregistreerde nummers
- ⚠️ "Twilio Sandbox:" prefix in berichten

### WhatsApp Business API (Productie):
- 📤 Berichten: €0.005 - €0.016 per bericht
- 📥 Gratis inkomende berichten (binnen 24u na outbound)
- 💳 Pay-as-you-go met je Twilio balance

Meer info: https://www.twilio.com/whatsapp/pricing

---

## 🐛 Troubleshooting

### Fout: "Authenticate Failed"
- ✅ Check je `TWILIO_ACCOUNT_SID` en `TWILIO_AUTH_TOKEN`
- ✅ Zorg dat er geen spaties staan in de credentials

### Fout: "Not a valid phone number"
- ✅ Gebruik internationaal formaat: `+31612345678`
- ✅ Voeg `whatsapp:` prefix automatisch toe (doet de code)

### Geen berichten ontvangen
- ✅ Check of je "join <code>" hebt gestuurd naar sandbox nummer
- ✅ Wacht 10-30 seconden, berichten kunnen vertraagd zijn
- ✅ Check Twilio logs: https://console.twilio.com/monitor/logs/messaging

### Webhook werkt niet
- ✅ Check of ngrok nog draait
- ✅ Controleer URL in Twilio console (moet /api/whatsapp/webhook zijn)
- ✅ Test eerst met GET request om te zien of endpoint bereikbaar is

---

## 📚 Volgende Stappen

1. **Voeg telefoonnummers toe** aan caregivers in je database
2. **Test de chatbot** door commands te sturen
3. **Implementeer scheduled berichten** met cron jobs
4. **Upgrade naar WhatsApp Business API** voor productie

---

## 🔗 Nuttige Links

- Twilio Console: https://console.twilio.com
- WhatsApp Sandbox: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
- Twilio Docs: https://www.twilio.com/docs/whatsapp
- WhatsApp Business API: https://www.twilio.com/whatsapp/pricing

---

**🎉 Succes met de WhatsApp integratie!**
