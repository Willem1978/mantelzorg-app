import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Lichtgewicht endpoint voor navbar badge
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.favoriet.count({
      where: {
        caregiverId: session.user.caregiverId,
        isVoltooid: false,
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    return NextResponse.json({ count: 0 })
  }
}
