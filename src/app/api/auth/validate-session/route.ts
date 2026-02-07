import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/auth/validate-session
 * Controleert of de huidige sessie nog geldig is
 * Returns { valid: true } of { valid: false, reason: "..." }
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ valid: false, reason: "not_authenticated" })
    }

    // Haal de actuele sessionVersion uit de database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { sessionVersion: true },
    })

    if (!user) {
      return NextResponse.json({ valid: false, reason: "user_not_found" })
    }

    // Vergelijk met de sessionVersion in de JWT
    const tokenSessionVersion = (session.user as any).sessionVersion

    if (tokenSessionVersion !== user.sessionVersion) {
      return NextResponse.json({
        valid: false,
        reason: "session_invalidated",
        message: "Je bent op een ander apparaat ingelogd",
      })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Validate session error:", error)
    return NextResponse.json({ valid: false, reason: "error" }, { status: 500 })
  }
}
