import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function GET(request: Request) {
  // Rate limiting: 5 pogingen per 5 minuten
  const ip = getClientIp(request)
  const rateLimit = await checkRateLimit(ip, "check-phone", { maxRequests: 5, windowSeconds: 300 })
  if (!rateLimit.allowed) {
    return NextResponse.json({ exists: false }, { status: 429 })
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
    // Check of er een caregiver is met dit telefoonnummer
    const caregiver = await prisma.caregiver.findFirst({
      where: {
        OR: [
          { phoneNumber: normalizedPhone },
          { phoneNumber: phoneWithPrefix },
          { phoneNumber: phoneWithWhatsApp },
        ],
      },
    })

    // Timing-safe: altijd ~100ms responstijd, ongeacht resultaat
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json({ exists: !!caregiver })
  } catch (error) {
    console.error("Check phone error:", error)
    return NextResponse.json({ exists: false })
  }
}
