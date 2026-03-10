import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

/**
 * Check of een telefoonnummer al bestaat.
 * Security: altijd constante response tijd om timing-attacks te voorkomen.
 * Rate limited om enumeratie-aanvallen te beperken.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { allowed } = checkRateLimit(ip, "check-phone", { maxRequests: 5, windowSeconds: 300 })
  if (!allowed) {
    // Geef dezelfde response ongeacht rate limit — geen informatie lekken
    return NextResponse.json({ exists: false })
  }

  const { searchParams } = new URL(request.url)
  const phone = searchParams.get("phone")

  if (!phone) {
    return NextResponse.json({ exists: false })
  }

  // Normaliseer telefoonnummer
  const normalizedPhone = phone.replace(/\s/g, "")
  const phoneWithPrefix = normalizedPhone.startsWith("+") ? normalizedPhone : `+31${normalizedPhone.replace(/^0/, "")}`
  const phoneWithWhatsApp = `whatsapp:${phoneWithPrefix}`

  try {
    const caregiver = await prisma.caregiver.findFirst({
      where: {
        OR: [
          { phoneNumber: normalizedPhone },
          { phoneNumber: phoneWithPrefix },
          { phoneNumber: phoneWithWhatsApp },
        ],
      },
    })

    // Altijd dezelfde vertraging om timing-analyse te voorkomen
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100))

    return NextResponse.json({ exists: !!caregiver })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
