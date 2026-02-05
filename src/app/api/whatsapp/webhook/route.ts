import { NextRequest, NextResponse } from 'next/server'
import {
  parseIncomingWhatsAppMessage,
  sendQuickReplyMessage,
  sendContentTemplateMessage,
  CONTENT_SIDS,
  twilioClient,
} from '@/lib/twilio'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  startTestSession,
  getTestSession,
  updateTestAnswer,
  getCurrentQuestion,
  calculateScore,
  getScoreLevel,
  clearTestSession,
  BELASTBAARHEID_QUESTIONS,
  startOnboardingSession,
  getOnboardingSession,
  updateOnboardingSession,
  clearOnboardingSession,
} from '@/lib/whatsapp-session'

const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

/**
 * Webhook endpoint voor inkomende WhatsApp berichten van Twilio
 *
 * Configureer deze URL in je Twilio Console:
 * Messaging > Settings > WhatsApp Sandbox Settings
 * "WHEN A MESSAGE COMES IN": https://your-domain.com/api/whatsapp/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const formDataObj: any = {}

    body.forEach((value, key) => {
      formDataObj[key] = value
    })

    const message = parseIncomingWhatsAppMessage(formDataObj)

    // Check voor interactieve knop response
    // Twilio stuurt ButtonText als de gebruiker op een Quick Reply knop klikt
    const buttonText = formDataObj.ButtonText as string | undefined
    const listId = formDataObj.ListId as string | undefined // Voor list selecties

    console.log('Inkomend WhatsApp bericht:', {
      from: message.from,
      body: message.body,
      buttonText: buttonText,
      listId: listId,
      messageId: message.messageId,
    })

    // Gebruik buttonText als beschikbaar (knop geklikt), anders body (tekst getypt)
    const userInput = buttonText || message.body

    // Zoek gebruiker op basis van telefoonnummer
    const caregiver = await prisma.caregiver.findFirst({
      where: {
        phoneNumber: message.from,
      },
      include: {
        user: true,
      },
    })

    let response = ''

    // Helper functie om interactieve berichten te sturen (async, naast TwiML response)
    const sendInteractiveResponse = async (
      to: string,
      contentSid?: string
    ) => {
      if (!twilioClient || !contentSid) return

      try {
        // Gebruik content template voor echte knoppen
        await sendContentTemplateMessage(to, contentSid)
        console.log('Sent interactive message with contentSid:', contentSid)
      } catch (error) {
        console.error('Failed to send interactive response:', error)
      }
    }

    // Stuur altijd eerst een lege TwiML response, dan het interactieve bericht apart
    // Dit voorkomt dubbele berichten
    let useInteractiveButtons = false
    let interactiveContentSid: string | undefined

    // Check eerst of er een actieve test sessie is (ook voor gasten)
    const testSession = getTestSession(message.from)

    if (testSession && testSession.currentStep === 'questions') {
      // Gebruiker is bezig met test - verwerk antwoord
      // Accepteer zowel getypte tekst als knop-clicks
      const command = userInput.toLowerCase().trim()
      const validAnswers = ['ja', 'soms', 'nee', 'j', 's', 'n']
      let normalizedAnswer = command

      // Normaliseer antwoord - accepteer ook knop tekst
      if (command === 'j' || command === '1' || command === 'ja') normalizedAnswer = 'ja'
      else if (command === 's' || command === '2' || command === 'soms') normalizedAnswer = 'soms'
      else if (command === 'n' || command === '3' || command === 'nee') normalizedAnswer = 'nee'

      if (validAnswers.includes(normalizedAnswer) || ['1', '2', '3'].includes(command)) {
        const updatedSession = updateTestAnswer(message.from, normalizedAnswer)

        if (updatedSession && updatedSession.currentStep === 'completed') {
          // Test voltooid - bereken score
          const score = calculateScore(updatedSession.answers)
          const level = getScoreLevel(score)

          let levelEmoji = '🟢'
          let levelText = 'laag'
          if (level === 'GEMIDDELD') { levelEmoji = '🟠'; levelText = 'gemiddeld' }
          if (level === 'HOOG') { levelEmoji = '🔴'; levelText = 'hoog' }

          response = `✅ *Test Voltooid!*\n\n📊 Je score: *${score}/24*\n${levelEmoji} Belastingniveau: *${levelText}*\n\n`

          if (level === 'HOOG') {
            response += `⚠️ Je score is hoog. Dit betekent dat je mogelijk overbelast bent.\n\n📞 Praat met iemand:\n- Mantelzorglijn: 030-760 60 55\n- Crisis: 113 (24/7)\n\n`
          } else if (level === 'GEMIDDELD') {
            response += `💛 Je score is gemiddeld. Blijf goed op jezelf letten!\n\n`
          } else {
            response += `💚 Je score is laag. Goed bezig!\n\n`
          }

          // Alleen opslaan als gebruiker een account heeft
          if (caregiver) {
            try {
              const testResult = await prisma.belastbaarheidTest.create({
                data: {
                  caregiverId: caregiver.id,
                  voornaam: caregiver.user.name || 'Onbekend',
                  email: caregiver.user.email,
                  postcode: caregiver.postalCode || '0000XX',
                  huisnummer: '0',
                  totaleBelastingScore: score,
                  belastingNiveau: level as any,
                  totaleZorguren: 0,
                  isCompleted: true,
                  completedAt: new Date(),
                },
              })

              // Maak antwoorden apart aan
              for (const [vraagId, antwoord] of Object.entries(updatedSession.answers)) {
                const vraag = BELASTBAARHEID_QUESTIONS.find(q => q.id === vraagId)
                let scoreVal = 0
                if (antwoord === 'ja') scoreVal = 2
                else if (antwoord === 'soms') scoreVal = 1

                await prisma.belastbaarheidAntwoord.create({
                  data: {
                    testId: testResult.id,
                    vraagId,
                    vraagTekst: vraag?.vraag || vraagId,
                    antwoord: antwoord as string,
                    score: scoreVal,
                    gewicht: vraag?.weight || 1.0,
                  },
                })
              }

              response += `📄 Bekijk je volledige rapport:\n${process.env.NEXTAUTH_URL}/rapport\n\n`
            } catch (error) {
              console.error('Error saving test:', error)
              // Niet fataal - toon gewoon resultaat
            }
          } else {
            response += `💡 *Wil je je resultaat bewaren?*\n\nMaak een gratis account aan door "account" te typen.\n\n`
          }

          response += `_Typ 0 voor menu_`
          clearTestSession(message.from)
        } else if (updatedSession) {
          // Volgende vraag - stuur interactieve knoppen
          const nextQuestion = getCurrentQuestion(updatedSession)
          if (nextQuestion) {
            const questionNum = updatedSession.currentQuestion + 1
            response = `📊 *Vraag ${questionNum}/${BELASTBAARHEID_QUESTIONS.length}*\n\n${nextQuestion.vraag}`

            // Stuur interactieve knoppen als Content SID beschikbaar is
            if (CONTENT_SIDS.testAnswer) {
              useInteractiveButtons = true
              interactiveContentSid = CONTENT_SIDS.testAnswer
            } else {
              response += `\n\n🔴 Ja\n🟠 Soms\n🟢 Nee`
            }
          }
        }
      } else if (command === 'stop' || command === 'stoppen') {
        // Stop de test
        clearTestSession(message.from)
        response = `❌ Test gestopt.\n\n_Typ 0 voor menu_`
      } else {
        // Ongeldig antwoord - stuur interactieve knoppen opnieuw
        response = `❌ Kies een antwoord:`

        if (CONTENT_SIDS.testAnswer) {
          useInteractiveButtons = true
          interactiveContentSid = CONTENT_SIDS.testAnswer
        } else {
          response += `\n\n🔴 Ja\n🟠 Soms\n🟢 Nee\n\n_Typ "stop" om te stoppen_`
        }
      }
    }

    // Check of er een actieve onboarding sessie is
    else {
      const onboardingSession = getOnboardingSession(message.from)

      if (onboardingSession) {
      // Gebruiker is bezig met onboarding
      const command = userInput.trim()

      if (onboardingSession.currentStep === 'choice') {
        // Accepteer zowel nummers als knopteksten
        if (command === '1' || command === 'ja, koppelen' || command === 'koppelen') {
          // Gebruiker heeft al een account - start login flow
          updateOnboardingSession(message.from, 'login_email')
          response = `✅ Prima! Laten we inloggen.\n\n📧 Wat is je email adres?`
        } else if (command === '2' || command === 'nee, nieuw' || command === 'nieuw') {
          // Gebruiker heeft nog geen account - start registratie flow
          updateOnboardingSession(message.from, 'register_name')
          response = `✅ Welkom! Laten we je account aanmaken.\n\n👤 Wat is je naam?`
        } else {
          response = `Kies een optie:`

          if (CONTENT_SIDS.onboardingChoice) {
            useInteractiveButtons = true
            interactiveContentSid = CONTENT_SIDS.onboardingChoice
          } else {
            response += `\n\n1️⃣ Ik heb al een account\n2️⃣ Ik heb nog geen account\n\nTyp 1 of 2`
          }
        }
      } else if (onboardingSession.currentStep === 'login_email') {
        // Opslaan email en vraag om wachtwoord
        updateOnboardingSession(message.from, 'login_password', { email: command })
        response = `🔒 Wat is je wachtwoord?`
      } else if (onboardingSession.currentStep === 'login_password') {
        // Probeer in te loggen
        try {
          const user = await prisma.user.findUnique({
            where: { email: onboardingSession.data.email },
            include: { caregiver: true }
          })

          if (!user) {
            clearOnboardingSession(message.from)
            response = `❌ Email niet gevonden.\n\nProbeer opnieuw met een willekeurig bericht.`
          } else if (!user.password) {
            clearOnboardingSession(message.from)
            response = `❌ Account heeft geen wachtwoord.\n\nProbeer opnieuw met een willekeurig bericht.`
          } else {
            const passwordMatch = await bcrypt.compare(command, user.password)

            if (!passwordMatch) {
              clearOnboardingSession(message.from)
              response = `❌ Onjuist wachtwoord.\n\nProbeer opnieuw met een willekeurig bericht.`
            } else {
              // Link telefoonnummer aan caregiver
              if (user.caregiver) {
                await prisma.caregiver.update({
                  where: { id: user.caregiver.id },
                  data: { phoneNumber: message.from }
                })
              }

              clearOnboardingSession(message.from)
              response = `✅ Welkom terug ${user.name}!\n\n📋 *MENU* - Typ een nummer:\n\n1️⃣ Mantelzorg Balanstest 📊\n2️⃣ Mijn taken voor vandaag\n3️⃣ Hulp in de buurt 🗺️\n4️⃣ Mijn dashboard\n5️⃣ Persoonlijk contact 💬\n\n💬 Typ het nummer!`
            }
          }
        } catch (error) {
          console.error('Login error:', error)
          clearOnboardingSession(message.from)
          response = `❌ Er ging iets mis. Probeer opnieuw met een willekeurig bericht.`
        }
      } else if (onboardingSession.currentStep === 'register_name') {
        // Opslaan naam en vraag om email
        updateOnboardingSession(message.from, 'register_email', { name: command })
        response = `📧 Wat is je email adres?`
      } else if (onboardingSession.currentStep === 'register_email') {
        // Valideer email formaat
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(command)) {
          response = `❌ Dat is geen geldig email adres.\n\n📧 Probeer opnieuw:`
        } else {
          // Check of email al bestaat
          const existingUser = await prisma.user.findUnique({
            where: { email: command }
          })

          if (existingUser) {
            clearOnboardingSession(message.from)
            response = `❌ Dit email adres is al in gebruik.\n\nHeb je al een account? Stuur een willekeurig bericht om opnieuw te beginnen.`
          } else {
            updateOnboardingSession(message.from, 'register_password', { email: command })
            response = `🔒 Kies een wachtwoord (minimaal 6 tekens):`
          }
        }
      } else if (onboardingSession.currentStep === 'register_password') {
        // Valideer wachtwoord en maak account aan
        if (command.length < 6) {
          response = `❌ Wachtwoord moet minimaal 6 tekens zijn.\n\n🔒 Probeer opnieuw:`
        } else {
          try {
            // Hash wachtwoord
            const hashedPassword = await bcrypt.hash(command, 10)

            // Maak gebruiker aan
            const user = await prisma.user.create({
              data: {
                email: onboardingSession.data.email!,
                name: onboardingSession.data.name!,
                password: hashedPassword,
                role: 'CAREGIVER',
                emailVerified: new Date(),
              }
            })

            // Maak caregiver profiel aan
            await prisma.caregiver.create({
              data: {
                userId: user.id,
                phoneNumber: message.from,
                intakeCompleted: false,
              }
            })

            clearOnboardingSession(message.from)
            response = `🎉 Account aangemaakt!\n\nWelkom ${user.name}!\n\n📋 *MENU* - Typ een nummer:\n\n1️⃣ Mantelzorg Balanstest 📊\n2️⃣ Mijn taken voor vandaag\n3️⃣ Hulp in de buurt 🗺️\n4️⃣ Mijn dashboard\n5️⃣ Persoonlijk contact 💬\n\n💬 Typ het nummer!`
          } catch (error) {
            console.error('Registration error:', error)
            clearOnboardingSession(message.from)
            response = `❌ Er ging iets mis bij het aanmaken van je account.\n\nProbeer opnieuw met een willekeurig bericht.`
          }
        }
      }
    }
    }

    // Geen onboarding sessie actief - check of gebruiker ingelogd is
    if (!response && !caregiver) {
      // Nieuwe gebruiker - stuur link naar website
      const command = userInput.toLowerCase().trim()
      const baseUrl = process.env.NEXTAUTH_URL || 'https://mantelzorg-app.vercel.app'

      if (command === '1' || command === 'test' || command === 'balanstest') {
        response = `📊 *Balanstest*\n\nDoe de test op onze website:\n\n🔗 ${baseUrl}/belastbaarheidstest\n\n_Typ 0 voor menu_`
      } else if (command === '2' || command === 'account' || command === 'inloggen' || command === 'login') {
        response = `🔐 *Inloggen of Registreren*\n\nGa naar onze website:\n\n📝 Nieuw account:\n${baseUrl}/register\n\n🔑 Inloggen:\n${baseUrl}/login\n\n_Typ 0 voor menu_`
      } else if (command === '3' || command === 'hulp' || command === 'help') {
        response = `🗺️ *Hulp & Contact*\n\n📞 Mantelzorglijn: 030-760 60 55\n🚨 Crisis: 113 (24/7)\n\n🌐 Website: ${baseUrl}\n\n_Typ 0 voor menu_`
      } else {
        // Hoofdmenu voor gasten - simpele opties
        response = `👋 *Welkom bij KER!*\n\nWij helpen mantelzorgers.\n\n1️⃣ Balanstest\n2️⃣ Inloggen/Registreren\n3️⃣ Hulp & Contact\n\n🌐 ${baseUrl}`
      }
    }

    // Ingelogde gebruikers - command handler
    if (!response && caregiver) {
      const command = userInput.toLowerCase().trim()

      if (command === '1' || command === 'test' || command === 'balanstest' || command === 'balanstest' || command === 'mantelzorg balanstest' || command === 'check-in' || command === 'checkin') {
        // Start test
        const session = startTestSession(message.from)
        const firstQuestion = getCurrentQuestion(session)

        response = `📊 *Mantelzorg Balanstest*\n\nIk stel je 12 korte vragen.\n\n*Vraag 1/12*\n\n${firstQuestion?.vraag}`

        // Stuur interactieve knoppen als Content SID beschikbaar is
        if (CONTENT_SIDS.testAnswer) {
          useInteractiveButtons = true
          interactiveContentSid = CONTENT_SIDS.testAnswer
        } else {
          response += `\n\n🔴 Ja\n🟠 Soms\n🟢 Nee`
        }

        session.currentStep = 'questions'
      } else if (command === 'menu' || command === 'start' || command === 'help' || command === 'hulp' || command === '0') {
        // Hoofdmenu - altijd tekst met alle opties (geen interactieve knoppen)
        response = `👋 Hoi ${caregiver.user.name}!\n\n*Wat wil je doen?*\n\n1️⃣ Balanstest 📊\n2️⃣ Mijn taken 📋\n3️⃣ Hulp vinden 🗺️\n4️⃣ Dashboard 📈\n5️⃣ Contact 💬\n\n_Typ het nummer van je keuze_`
      } else if (command === '2' || command === 'taken' || command === 'tasks' || command === 'mijn status' || command === 'status') {
        // Taken voor vandaag
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const tasks = await prisma.task.findMany({
          where: {
            caregiverId: caregiver.id,
            status: { in: ['TODO', 'IN_PROGRESS'] },
            OR: [
              { dueDate: { gte: today, lt: tomorrow } },
              { dueDate: null },
            ],
          },
          take: 5,
          orderBy: { dueDate: 'asc' },
        })

        if (tasks.length === 0) {
          response = `🎉 *Geen taken voor vandaag!*\n\nGoed bezig!\n\n📋 Alle taken:\n${process.env.NEXTAUTH_URL}/taken\n\n_Typ 0 voor menu_`
        } else {
          response = `📋 *Taken voor vandaag:*\n\n`
          tasks.forEach((task, i) => {
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('nl-NL') : 'Geen deadline'
            response += `${i + 1}. ${task.title}\n   📅 ${dueDate}\n\n`
          })
          response += `🔗 Beheer taken:\n${process.env.NEXTAUTH_URL}/taken\n\n_Typ 0 voor menu_`
        }
      } else if (command === '3' || command === 'hulp' || command === 'help' || command === 'buurt') {
        // Hulp in de buurt
        response = `🗺️ *Hulp in de Buurt*\n\n📞 Mantelzorglijn\n    030-760 60 55\n    (ma-vr 9-17u)\n\n🌐 Lokale hulp & steunpunten:\n    ${process.env.NEXTAUTH_URL}/hulp\n\n💬 Hulpvraag stellen:\n    ${process.env.NEXTAUTH_URL}/hulpvragen\n\n❤️ Je staat er niet alleen voor!\n\n_Typ 0 voor menu_`
      } else if (command === '4' || command === 'dashboard' || command === 'status') {
        // Dashboard / Mijn overzicht
        const lastCheckIn = await prisma.monthlyCheckIn.findFirst({
          where: { caregiverId: caregiver.id },
          orderBy: { createdAt: 'desc' },
        })

        const openTasks = await prisma.task.count({
          where: {
            caregiverId: caregiver.id,
            status: { in: ['TODO', 'IN_PROGRESS'] },
          },
        })

        response = `📊 *Mijn Dashboard*\n\n`

        if (lastCheckIn && lastCheckIn.overallWellbeing) {
          response += `😊 Welzijn: ${lastCheckIn.overallWellbeing}/10\n`
        } else {
          response += `⚠️ Nog geen check-in gedaan\n`
        }

        response += `📋 Open taken: ${openTasks}\n\n`
        response += `🔗 Volledig dashboard:\n${process.env.NEXTAUTH_URL}/dashboard\n\n_Typ 0 voor menu_`
      } else if (command === '5' || command === 'praten' || command === 'contact') {
        response = `💬 *Persoonlijk Contact*\n\nWil je met iemand praten?\n\n📞 Direct bellen:\n    Mantelzorglijn: 030-760 60 55\n    Crisis: 113 (24/7)\n\n✉️ Bericht naar zorgorganisatie:\n    ${process.env.NEXTAUTH_URL}/hulpvragen\n\n👥 Je contactpersoon bereiken via je organisatie\n\n_Typ 0 voor menu_`
      } else {
        // Onbekend commando of willekeurig bericht - toon altijd menu
        const greetings = ['hoi', 'hallo', 'hey', 'goedemorgen', 'goedemiddag', 'goedenavond', 'dag', 'hi', 'hello']
        const isGreeting = greetings.some(g => command.includes(g))

        if (isGreeting) {
          response = `👋 Hoi ${caregiver.user.name}!\n\n*Wat wil je doen?*\n\n1️⃣ Balanstest 📊\n2️⃣ Mijn taken 📋\n3️⃣ Hulp vinden 🗺️\n4️⃣ Dashboard 📈\n5️⃣ Contact 💬\n\n_Typ het nummer van je keuze_`
        } else {
          response = `*Wat wil je doen?*\n\n1️⃣ Balanstest 📊\n2️⃣ Mijn taken 📋\n3️⃣ Hulp vinden 🗺️\n4️⃣ Dashboard 📈\n5️⃣ Contact 💬\n\n_Typ het nummer van je keuze_`
        }
      }
    }

    // Stuur TwiML response terug
    console.log('Response to send:', response)
    console.log('Use interactive buttons:', useInteractiveButtons, interactiveContentSid)

    if (!response) {
      response = '❌ Geen response gegenereerd. Stuur een willekeurig bericht om opnieuw te beginnen.'
    }

    // Als we interactieve knoppen willen gebruiken, stuur dan:
    // 1. EERST de tekst response via Twilio API
    // 2. DAN de knoppen via Content Template
    // 3. Return lege TwiML om dubbele berichten te voorkomen
    if (useInteractiveButtons && interactiveContentSid) {
      // Format het to-nummer met whatsapp: prefix (message.from heeft dit niet)
      const formattedTo = message.from.startsWith('whatsapp:')
        ? message.from
        : `whatsapp:${message.from}`

      try {
        // Stuur EERST de tekst (vraag) via Twilio API
        await twilioClient?.messages.create({
          from: whatsappFrom,
          to: formattedTo,
          body: response,
        })
        console.log('Text message sent successfully to:', formattedTo)

        // Stuur DAN de knoppen via Content Template
        await sendInteractiveResponse(message.from, interactiveContentSid)
        console.log('Interactive buttons sent successfully')
      } catch (err) {
        console.error('Failed to send messages:', err)
        // Fallback: stuur gewoon de tekst response via TwiML
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${response}</Message>
</Response>`
        return new NextResponse(twiml, {
          status: 200,
          headers: {
            'Content-Type': 'text/xml',
          },
        })
      }

      // Return lege TwiML - berichten zijn al gestuurd via API
      const emptyTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`

      return new NextResponse(emptyTwiml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      })
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${response}</Message>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('Webhook error:', error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, er is iets misgegaan. Probeer het later opnieuw.</Message>
</Response>`

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}

// Voor Twilio webhook verificatie
export async function GET() {
  return NextResponse.json({ message: 'WhatsApp webhook endpoint' })
}
