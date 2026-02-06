import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Lichtgewicht endpoint voor navigatie badge
// Alleen aantal zware taken ophalen
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ count: 0 })
    }

    // Alleen de laatste test ophalen met taakSelecties
    // MOEILIJK = ja (zwaar), GEMIDDELD = soms (matig zwaar)
    const latestTest = await prisma.belastbaarheidTest.findFirst({
      where: {
        caregiverId: session.user.caregiverId,
        isCompleted: true
      },
      orderBy: { completedAt: "desc" },
      select: {
        taakSelecties: {
          where: {
            isGeselecteerd: true,
            moeilijkheid: { in: ['MOEILIJK', 'ZEER_MOEILIJK', 'GEMIDDELD'] }
          },
          select: { id: true }
        }
      }
    })

    return NextResponse.json({
      count: latestTest?.taakSelecties?.length || 0
    })
  } catch (error) {
    return NextResponse.json({ count: 0 })
  }
}
