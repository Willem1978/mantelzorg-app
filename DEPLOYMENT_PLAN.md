# 🚀 Deployment Plan - Mantelzorg WhatsApp Bot

## Huidige Problemen
1. Server valt uit door database queries die hangen
2. Localhost werkt niet op mobiel
3. ngrok is tijdelijk en niet stabiel voor productie
4. Code is al op GitHub maar niet deployed

## Oplossing: Deploy naar Vercel

### Waarom Vercel?
- ✅ Gratis hosting voor Next.js projecten
- ✅ Automatische deployment vanuit GitHub
- ✅ Altijd online (geen crashes)
- ✅ Publieke HTTPS URL (geen ngrok nodig)
- ✅ Ingebouwde database support
- ✅ Perfect voor WhatsApp webhooks

### Stappen:

#### 1. GitHub Repository
```bash
# Check of project al op GitHub staat
git remote -v

# Zo niet, dan:
git init
git add .
git commit -m "Initial commit - Mantelzorg WhatsApp bot"
git branch -M main
git remote add origin https://github.com/JOUW_USERNAME/mantelzorg-app.git
git push -u origin main
```

#### 2. Vercel Deployment
1. Ga naar: https://vercel.com
2. Login met GitHub account
3. Klik "Add New..." > "Project"
4. Selecteer je `mantelzorg-app` repository
5. Vercel detecteert automatisch Next.js
6. Klik "Deploy"

#### 3. Database Setup (Vercel Postgres)
1. In Vercel dashboard > je project > "Storage"
2. Klik "Create Database" > "Postgres"
3. Copy de `POSTGRES_URL` environment variable
4. Voeg toe aan Vercel environment variables

#### 4. Environment Variables in Vercel
```
DATABASE_URL=your_vercel_postgres_url
NEXTAUTH_SECRET=your_secret_key
TWILIO_ACCOUNT_SID=AC18848eaa95ecb249d8ca0fefaec6aebb
TWILIO_AUTH_TOKEN=620ff78f6fefda0c3406ac38b3677f32
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
NEXTAUTH_URL=https://jouw-project.vercel.app
```

#### 5. Twilio Webhook Update
1. Ga naar: https://console.twilio.com/
2. Messaging > Try it out > Send a WhatsApp message
3. Sandbox settings
4. Update webhook URL naar: `https://jouw-project.vercel.app/api/whatsapp/webhook`

### Voordelen na deployment:
- ✅ Geen crashes meer
- ✅ 24/7 beschikbaar
- ✅ Werkt overal (mobiel, desktop)
- ✅ Gratis
- ✅ Automatische updates bij nieuwe commits

### Wat is je GitHub repository URL?
Dan kan ik je helpen met de exacte deployment stappen.
