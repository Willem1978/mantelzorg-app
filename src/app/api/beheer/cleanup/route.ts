import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// POST - Cleanup afgewezen/verlopen buddy data
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Alleen beheerders" },
        { status: 403 }
      )
    }

    const now = new Date()
    const results: Record<string, number> = {}

    // 1. Verwijder afgewezen buddy-reacties ouder dan 90 dagen
    const deletedReacties = await prisma.buddyTaakReactie.deleteMany({
      where: {
        status: "AFGEWEZEN",
        updatedAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
      },
    })
    results.afgewezenReactiesVerwijderd = deletedReacties.count

    // 2. Verwijder beeindigde matches ouder dan 180 dagen
    const deletedMatches = await prisma.buddyMatch.deleteMany({
      where: {
        status: "BEEINDIGD",
        updatedAt: { lt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
      },
    })
    results.beeindigdeMatchesVerwijderd = deletedMatches.count

    // 3. Verwijder geannuleerde taken ouder dan 180 dagen
    const deletedTaken = await prisma.buddyTaak.deleteMany({
      where: {
        status: "GEANNULEERD",
        updatedAt: { lt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
      },
    })
    results.geannuleerdeTakenVerwijderd = deletedTaken.count

    // 4. Markeer onbevestigde matches (CAREGIVER_AKKOORD > 14 dagen) als BEEINDIGD
    const verlopenMatches = await prisma.buddyMatch.updateMany({
      where: {
        status: "CAREGIVER_AKKOORD",
        updatedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      },
      data: { status: "BEEINDIGD" },
    })
    results.verlopenMatchesBeeindigd = verlopenMatches.count

    // Bij verlopen matches: zet gekoppelde taken terug naar OPEN
    if (verlopenMatches.count > 0) {
      const verlopenMatchIds = await prisma.buddyMatch.findMany({
        where: {
          status: "BEEINDIGD",
          updatedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
        },
        select: { buddyId: true },
      })

      for (const m of verlopenMatchIds) {
        await prisma.buddyTaak.updateMany({
          where: { toegewezenAan: m.buddyId, status: "TOEGEWEZEN" },
          data: { status: "OPEN", toegewezenAan: null },
        })
      }
    }

    // 5. Deactiveer afgewezen buddies die nog actief zijn
    const deactivated = await prisma.mantelBuddy.updateMany({
      where: {
        status: "AFGEWEZEN",
        isActief: true,
      },
      data: { isActief: false },
    })
    results.afgewezenBuddysGedeactiveerd = deactivated.count

    // 6. Verwijder gelezen notificaties ouder dan 90 dagen
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
      },
    })
    results.oudeNotificatiesVerwijderd = deletedNotifications.count

    return NextResponse.json({
      success: true,
      results,
      uitgevoerdOp: now.toISOString(),
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij de cleanup" },
      { status: 500 }
    )
  }
}

// GET - Toon cleanup statistieken (dry run)
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Alleen beheerders" },
        { status: 403 }
      )
    }

    const now = new Date()

    const [
      afgewezenReacties,
      beeindigdeMatches,
      geannuleerdeTaken,
      verlopenMatches,
      afgewezenActieveBuddys,
      oudeNotificaties,
    ] = await Promise.all([
      prisma.buddyTaakReactie.count({
        where: {
          status: "AFGEWEZEN",
          updatedAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.buddyMatch.count({
        where: {
          status: "BEEINDIGD",
          updatedAt: { lt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.buddyTaak.count({
        where: {
          status: "GEANNULEERD",
          updatedAt: { lt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.buddyMatch.count({
        where: {
          status: "CAREGIVER_AKKOORD",
          updatedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.mantelBuddy.count({
        where: { status: "AFGEWEZEN", isActief: true },
      }),
      prisma.notification.count({
        where: {
          isRead: true,
          createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    return NextResponse.json({
      preview: true,
      teVerwijderen: {
        afgewezenReacties,
        beeindigdeMatches,
        geannuleerdeTaken,
        verlopenMatches,
        afgewezenActieveBuddys,
        oudeNotificaties,
      },
    })
  } catch (error) {
    console.error("Cleanup preview error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
