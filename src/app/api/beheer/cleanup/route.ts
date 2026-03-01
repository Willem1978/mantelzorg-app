import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export const dynamic = "force-dynamic"

// Retentieperiodes (in milliseconden)
const DAG = 24 * 60 * 60 * 1000
const RETENTIE = {
  afgewezenReacties: 90 * DAG,       // 90 dagen
  beeindigdeMatches: 180 * DAG,       // 6 maanden
  geannuleerdeTaken: 180 * DAG,       // 6 maanden
  onbevestigdeMatches: 14 * DAG,      // 14 dagen
  gelezenNotificaties: 90 * DAG,      // 90 dagen
  // AVG retentiebeleid
  oudeBerichten: 730 * DAG,           // 2 jaar
  oudeAuditLogs: 1095 * DAG,         // 3 jaar
  inactieveAccounts: 730 * DAG,       // 2 jaar (notificatie)
  verlopenPasswordTokens: 1 * DAG,    // 1 dag
}

// POST - Cleanup afgewezen/verlopen data + AVG retentiebeleid
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
        updatedAt: { lt: new Date(now.getTime() - RETENTIE.afgewezenReacties) },
      },
    })
    results.afgewezenReactiesVerwijderd = deletedReacties.count

    // 2. Verwijder beeindigde matches ouder dan 180 dagen
    const deletedMatches = await prisma.buddyMatch.deleteMany({
      where: {
        status: "BEEINDIGD",
        updatedAt: { lt: new Date(now.getTime() - RETENTIE.beeindigdeMatches) },
      },
    })
    results.beeindigdeMatchesVerwijderd = deletedMatches.count

    // 3. Verwijder geannuleerde taken ouder dan 180 dagen
    const deletedTaken = await prisma.buddyTaak.deleteMany({
      where: {
        status: "GEANNULEERD",
        updatedAt: { lt: new Date(now.getTime() - RETENTIE.geannuleerdeTaken) },
      },
    })
    results.geannuleerdeTakenVerwijderd = deletedTaken.count

    // 4. Markeer onbevestigde matches (CAREGIVER_AKKOORD > 14 dagen) als BEEINDIGD
    const verlopenMatches = await prisma.buddyMatch.updateMany({
      where: {
        status: "CAREGIVER_AKKOORD",
        updatedAt: { lt: new Date(now.getTime() - RETENTIE.onbevestigdeMatches) },
      },
      data: { status: "BEEINDIGD" },
    })
    results.verlopenMatchesBeeindigd = verlopenMatches.count

    // Bij verlopen matches: zet gekoppelde taken terug naar OPEN
    if (verlopenMatches.count > 0) {
      const verlopenMatchIds = await prisma.buddyMatch.findMany({
        where: {
          status: "BEEINDIGD",
          updatedAt: { lt: new Date(now.getTime() - RETENTIE.onbevestigdeMatches) },
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
        createdAt: { lt: new Date(now.getTime() - RETENTIE.gelezenNotificaties) },
      },
    })
    results.oudeNotificatiesVerwijderd = deletedNotifications.count

    // === AVG RETENTIEBELEID ===

    // 7. Verwijder berichten ouder dan 2 jaar
    const deletedBerichten = await prisma.bericht.deleteMany({
      where: {
        createdAt: { lt: new Date(now.getTime() - RETENTIE.oudeBerichten) },
      },
    })
    results.oudeBerichtenVerwijderd = deletedBerichten.count

    // 8. Verwijder audit logs ouder dan 3 jaar
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: new Date(now.getTime() - RETENTIE.oudeAuditLogs) },
      },
    })
    results.oudeAuditLogsVerwijderd = deletedAuditLogs.count

    // 9. Verwijder verlopen password reset tokens
    const deletedTokens = await prisma.passwordResetToken.deleteMany({
      where: {
        expires: { lt: now },
      },
    })
    results.verlopenTokensVerwijderd = deletedTokens.count

    // 10. Detecteer inactieve accounts (>2 jaar niet ingelogd)
    const inactieveAccounts = await prisma.user.findMany({
      where: {
        isActive: true,
        updatedAt: { lt: new Date(now.getTime() - RETENTIE.inactieveAccounts) },
        role: "CAREGIVER",
      },
      select: { id: true, email: true, name: true, updatedAt: true },
    })
    results.inactieveAccountsGevonden = inactieveAccounts.length

    // Log cleanup in audit trail
    await logAudit({
      userId: session.user.id,
      actie: "CLEANUP",
      entiteit: "System",
      details: {
        ...results,
        retentieConfig: {
          afgewezenReacties: "90 dagen",
          beeindigdeMatches: "180 dagen",
          berichten: "2 jaar",
          auditLogs: "3 jaar",
          inactieveAccounts: "2 jaar (detectie)",
        },
      },
    })

    return NextResponse.json({
      success: true,
      results,
      inactieveAccounts: inactieveAccounts.map(a => ({
        id: a.id,
        email: a.email,
        naam: a.name,
        laatsteActiviteit: a.updatedAt,
      })),
      retentiebeleid: {
        afgewezenReacties: "90 dagen",
        beeindigdeMatches: "6 maanden",
        geannuleerdeTaken: "6 maanden",
        berichten: "2 jaar",
        auditLogs: "3 jaar",
        inactieveAccounts: "2 jaar (detectie, handmatig opvolgen)",
      },
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
      oudeBerichten,
      oudeAuditLogs,
      verlopenTokens,
      inactieveAccounts,
    ] = await Promise.all([
      prisma.buddyTaakReactie.count({
        where: {
          status: "AFGEWEZEN",
          updatedAt: { lt: new Date(now.getTime() - RETENTIE.afgewezenReacties) },
        },
      }),
      prisma.buddyMatch.count({
        where: {
          status: "BEEINDIGD",
          updatedAt: { lt: new Date(now.getTime() - RETENTIE.beeindigdeMatches) },
        },
      }),
      prisma.buddyTaak.count({
        where: {
          status: "GEANNULEERD",
          updatedAt: { lt: new Date(now.getTime() - RETENTIE.geannuleerdeTaken) },
        },
      }),
      prisma.buddyMatch.count({
        where: {
          status: "CAREGIVER_AKKOORD",
          updatedAt: { lt: new Date(now.getTime() - RETENTIE.onbevestigdeMatches) },
        },
      }),
      prisma.mantelBuddy.count({
        where: { status: "AFGEWEZEN", isActief: true },
      }),
      prisma.notification.count({
        where: {
          isRead: true,
          createdAt: { lt: new Date(now.getTime() - RETENTIE.gelezenNotificaties) },
        },
      }),
      prisma.bericht.count({
        where: {
          createdAt: { lt: new Date(now.getTime() - RETENTIE.oudeBerichten) },
        },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { lt: new Date(now.getTime() - RETENTIE.oudeAuditLogs) },
        },
      }),
      prisma.passwordResetToken.count({
        where: { expires: { lt: now } },
      }),
      prisma.user.count({
        where: {
          isActive: true,
          updatedAt: { lt: new Date(now.getTime() - RETENTIE.inactieveAccounts) },
          role: "CAREGIVER",
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
        // AVG retentie
        oudeBerichten,
        oudeAuditLogs,
        verlopenTokens,
        inactieveAccounts,
      },
      retentiebeleid: {
        afgewezenReacties: "90 dagen",
        beeindigdeMatches: "6 maanden",
        geannuleerdeTaken: "6 maanden",
        berichten: "2 jaar",
        auditLogs: "3 jaar",
        inactieveAccounts: "2 jaar (detectie)",
        passwordTokens: "na verloopdatum",
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
