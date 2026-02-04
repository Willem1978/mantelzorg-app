import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage, WhatsAppTemplates } from '@/lib/twilio'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

/**
 * API endpoint om WhatsApp berichten te versturen
 *
 * POST /api/whatsapp/send
 *
 * Body:
 * {
 *   "caregiverId": "clxxx",
 *   "template": "checkInReminder" | "taskReminder" | "welcomeMessage" | "custom",
 *   "customMessage"?: "Custom bericht tekst",
 *   "templateData"?: { ... } // Data voor template
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caregiverId, template, customMessage, templateData } = body

    if (!caregiverId) {
      return NextResponse.json(
        { error: 'caregiverId is verplicht' },
        { status: 400 }
      )
    }

    // Haal caregiver op met telefoonnummer
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId },
      include: { user: true },
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: 'Caregiver niet gevonden' },
        { status: 404 }
      )
    }

    if (!caregiver.phoneNumber) {
      return NextResponse.json(
        { error: 'Geen telefoonnummer bekend voor deze caregiver' },
        { status: 400 }
      )
    }

    let messageBody: string

    // Genereer bericht op basis van template
    if (template === 'custom' && customMessage) {
      messageBody = customMessage
    } else if (template === 'checkInReminder') {
      const maand = new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
      messageBody = WhatsAppTemplates.checkInReminder(caregiver.user.name || 'daar', maand).body
    } else if (template === 'taskReminder' && templateData) {
      messageBody = WhatsAppTemplates.taskReminder(
        caregiver.user.name || 'daar',
        templateData.taakTitel,
        templateData.dueDate
      ).body
    } else if (template === 'highBurdenAlert' && templateData) {
      messageBody = WhatsAppTemplates.highBurdenAlert(
        caregiver.user.name || 'daar',
        templateData.score
      ).body
    } else if (template === 'welcomeMessage') {
      messageBody = WhatsAppTemplates.welcomeMessage(caregiver.user.name || 'daar').body
    } else if (template === 'intakeComplete') {
      messageBody = WhatsAppTemplates.intakeComplete(caregiver.user.name || 'daar').body
    } else {
      return NextResponse.json(
        { error: 'Ongeldig template of ontbrekende data' },
        { status: 400 }
      )
    }

    // Verstuur WhatsApp bericht
    const result = await sendWhatsAppMessage({
      to: caregiver.phoneNumber,
      body: messageBody,
    })

    // Optioneel: Log notificatie in database
    await prisma.notification.create({
      data: {
        userId: caregiver.userId,
        type: 'SYSTEM',
        title: 'WhatsApp bericht verzonden',
        message: `Bericht verzonden naar ${caregiver.phoneNumber}`,
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      messageSid: result.sid,
      to: caregiver.phoneNumber,
    })
  } catch (error: any) {
    console.error('Fout bij versturen WhatsApp:', error)
    return NextResponse.json(
      {
        error: 'Fout bij versturen WhatsApp bericht',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint om te testen of de API werkt
 */
export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Send API',
    endpoint: '/api/whatsapp/send',
    method: 'POST',
    requiredFields: ['caregiverId', 'template'],
    availableTemplates: [
      'checkInReminder',
      'taskReminder',
      'welcomeMessage',
      'intakeComplete',
      'highBurdenAlert',
      'custom',
    ],
  })
}
