import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ============================================
// BESCHIKBAARHEID MAPPING
// ============================================

const BESCHIKBAARHEID_MAP: Record<string, "EENMALIG" | "VAST" | "BEIDE"> = {
  eenmalig: "EENMALIG",
  wekelijks: "VAST",
  maandelijks: "VAST",
  flexibel: "BEIDE",
}

// ============================================
// POST /api/buddy/onboarding
// ============================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om de onboarding te voltooien." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { motivatie, skills, beschikbaarheid } = body

    // ---- Validation ----
    if (!motivatie || typeof motivatie !== "string") {
      return NextResponse.json(
        { error: "Motivatie is verplicht." },
        { status: 400 }
      )
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: "Selecteer minimaal één vaardigheid." },
        { status: 400 }
      )
    }

    if (!beschikbaarheid || typeof beschikbaarheid !== "string") {
      return NextResponse.json(
        { error: "Beschikbaarheid is verplicht." },
        { status: 400 }
      )
    }

    // ---- Map beschikbaarheid to enum ----
    const beschikbaarheidEnum = BESCHIKBAARHEID_MAP[beschikbaarheid] || "BEIDE"

    // ---- Find existing MantelBuddy profile linked to this user ----
    const bestaandeBuddy = await prisma.mantelBuddy.findUnique({
      where: { userId: session.user.id },
    })

    if (bestaandeBuddy) {
      // Update existing buddy profile with onboarding data
      await prisma.mantelBuddy.update({
        where: { id: bestaandeBuddy.id },
        data: {
          motivatie,
          hulpvormen: skills,
          beschikbaarheid: beschikbaarheidEnum,
        },
      })
    } else {
      // No linked MantelBuddy profile found — try to find by email
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true },
      })

      if (!user?.email) {
        return NextResponse.json(
          { error: "Geen e-mailadres gevonden voor je account." },
          { status: 400 }
        )
      }

      const buddyByEmail = await prisma.mantelBuddy.findUnique({
        where: { email: user.email },
      })

      if (buddyByEmail) {
        // Link and update
        await prisma.mantelBuddy.update({
          where: { id: buddyByEmail.id },
          data: {
            userId: session.user.id,
            motivatie,
            hulpvormen: skills,
            beschikbaarheid: beschikbaarheidEnum,
          },
        })
      } else {
        // No buddy profile exists at all — cannot complete onboarding
        // without the full registration (word-mantelbuddy page handles that)
        return NextResponse.json(
          {
            error:
              "Je hebt nog geen MantelBuddy-profiel. Meld je eerst aan via de aanmeldpagina.",
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[buddy/onboarding] Error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het opslaan van je onboarding." },
      { status: 500 }
    )
  }
}
