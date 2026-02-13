import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const userId = session.user.id

    // Verwijder de gebruiker - cascade deletes in schema verwijderen:
    // - Account (auth)
    // - Session (sessies)
    // - MagicLinkToken
    // - Caregiver (en via cascade: BelastbaarheidTest, IntakeResponse,
    //   MonthlyCheckIn, Task, CalendarEvent, HelpRequest, Favoriet,
    //   BuddyMatch, BuddyTaak, CaregiverOrganisation, BuddyBeoordeling)
    // - MantelBuddy (als vrijwilliger)
    // - OrganisationMember
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Fout bij verwijderen account:", error)
    return NextResponse.json(
      { error: "Er is iets misgegaan bij het verwijderen van je account" },
      { status: 500 }
    )
  }
}
