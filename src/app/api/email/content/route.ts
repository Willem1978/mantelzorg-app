import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendContentEmail } from "@/lib/email"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { titel, beschrijving, organisatie, gemeente, telefoon, website, kosten, openingstijden, soortHulp } = body

    if (!titel) {
      return NextResponse.json({ error: "Titel is verplicht" }, { status: 400 })
    }

    // Haal gebruikersnaam op
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true },
    })

    const success = await sendContentEmail(
      session.user.email,
      user?.name || "",
      { titel, beschrijving, organisatie, gemeente, telefoon, website, kosten, openingstijden, soortHulp },
    )

    if (!success) {
      return NextResponse.json({ error: "Email versturen mislukt" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Er is iets misgegaan" }, { status: 500 })
  }
}
