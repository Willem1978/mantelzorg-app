import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
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

    return NextResponse.json({ exists: !!caregiver })
  } catch (error) {
    console.error("Check phone error:", error)
    return NextResponse.json({ exists: false })
  }
}
