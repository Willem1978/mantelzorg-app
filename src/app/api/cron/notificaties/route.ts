import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 120 // 2 minuten max

/**
 * GET /api/cron/notificaties — Proactieve notificaties (4.5)
 *
 * Cron endpoint dat controleert:
 * 1. Mantelzorgers die >14 dagen geen check-in hebben gedaan
 * 2. Nieuwe artikelen (afgelopen 7 dagen) die matchen met gebruikersprofielen
 *
 * Beveiligd via CRON_SECRET header (optioneel).
 *
 * Notification model bestaat al in schema.prisma met:
 *   - userId, type (NotificationType), title, message, link, isRead, scheduledFor, sentAt
 *   - NotificationType enum: CHECK_IN_REMINDER, TASK_REMINDER, HELP_REQUEST_UPDATE, TIP, SYSTEM, ...
 *
 * Geen extra model nodig — we gebruiken het bestaande Notification model
 * met types CHECK_IN_REMINDER (voor check-in herinneringen)
 * en TIP (voor nieuwe artikel-matches).
 */
export async function GET(request: Request) {
  // S5: CRON_SECRET is verplicht — voorkom ongeautoriseerde cron triggers
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const nu = new Date()
    const veertienDagenGeleden = new Date(nu.getTime() - 14 * 24 * 60 * 60 * 1000)
    const zevenDagenGeleden = new Date(nu.getTime() - 7 * 24 * 60 * 60 * 1000)

    // =============================================
    // 1. Check-in herinneringen (>14 dagen inactief)
    // =============================================

    // Zoek de laatste check-in per caregiver
    const caregivers = await prisma.caregiver.findMany({
      select: {
        id: true,
        userId: true,
        monthlyCheckIns: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    })

    // Filter caregivers die al een recente CHECK_IN_REMINDER notificatie hebben
    // (voorkom spam: max 1 herinnering per 14 dagen)
    const checkInReminderNotificaties: Array<{
      userId: string
      type: "CHECK_IN_REMINDER"
      title: string
      message: string
      link: string
    }> = []

    for (const cg of caregivers) {
      const laatsteCheckIn = cg.monthlyCheckIns[0]?.createdAt
      const heeftGeenRecenteCheckIn = !laatsteCheckIn || laatsteCheckIn < veertienDagenGeleden

      if (!heeftGeenRecenteCheckIn) continue

      // Controleer of er al een recente herinnering is
      const bestaandeHerinnering = await prisma.notification.findFirst({
        where: {
          userId: cg.userId,
          type: "CHECK_IN_REMINDER",
          createdAt: { gte: veertienDagenGeleden },
        },
      })

      if (!bestaandeHerinnering) {
        const dagenGeleden = laatsteCheckIn
          ? Math.floor((nu.getTime() - laatsteCheckIn.getTime()) / (1000 * 60 * 60 * 24))
          : null

        checkInReminderNotificaties.push({
          userId: cg.userId,
          type: "CHECK_IN_REMINDER",
          title: "Tijd voor een check-in",
          message: dagenGeleden
            ? `Je hebt ${dagenGeleden} dagen geen check-in gedaan. Hoe gaat het met je?`
            : "Je hebt nog geen check-in gedaan. Neem even de tijd om te reflecteren.",
          link: "/checkin",
        })
      }
    }

    // Maak check-in herinneringen aan
    let checkInAantal = 0
    if (checkInReminderNotificaties.length > 0) {
      const result = await prisma.notification.createMany({
        data: checkInReminderNotificaties,
        skipDuplicates: true,
      })
      checkInAantal = result.count
    }

    // =============================================
    // 2. Nieuwe artikelen die matchen met profiel
    // =============================================

    // Zoek artikelen gepubliceerd in de afgelopen 7 dagen
    const nieuweArtikelen = await prisma.artikel.findMany({
      where: {
        isActief: true,
        status: "GEPUBLICEERD",
        publicatieDatum: { gte: zevenDagenGeleden },
      },
      select: {
        id: true,
        titel: true,
        categorie: true,
        tags: {
          select: {
            tag: {
              select: { slug: true, type: true },
            },
          },
        },
      },
    })

    // Zoek caregivers met hun aandoening en voorkeuren
    const caregiversMetVoorkeuren = await prisma.caregiver.findMany({
      where: {
        aandoening: { not: null },
      },
      select: {
        id: true,
        userId: true,
        aandoening: true,
        voorkeuren: {
          select: { slug: true, type: true },
        },
      },
    })

    const artikelNotificaties: Array<{
      userId: string
      type: "TIP"
      title: string
      message: string
      link: string
    }> = []

    for (const cg of caregiversMetVoorkeuren) {
      // Verzamel relevante slugs van de caregiver
      const relevanteSlugs = new Set<string>()
      if (cg.aandoening) relevanteSlugs.add(cg.aandoening)
      for (const voorkeur of cg.voorkeuren) {
        relevanteSlugs.add(voorkeur.slug)
      }

      // Match artikelen
      const matchendeArtikelen = nieuweArtikelen.filter((artikel) => {
        const artikelSlugs = artikel.tags.map((t) => t.tag.slug)
        return artikelSlugs.some((slug) => relevanteSlugs.has(slug))
      })

      if (matchendeArtikelen.length === 0) continue

      // Controleer of er al een TIP-notificatie is voor deze week
      const bestaandeTip = await prisma.notification.findFirst({
        where: {
          userId: cg.userId,
          type: "TIP",
          createdAt: { gte: zevenDagenGeleden },
        },
      })

      if (bestaandeTip) continue

      if (matchendeArtikelen.length === 1) {
        const artikel = matchendeArtikelen[0]
        artikelNotificaties.push({
          userId: cg.userId,
          type: "TIP",
          title: "Nieuw artikel voor jou",
          message: `Er is een nieuw artikel dat past bij jouw profiel: "${artikel.titel}"`,
          link: `/artikelen/${artikel.id}`,
        })
      } else {
        artikelNotificaties.push({
          userId: cg.userId,
          type: "TIP",
          title: `${matchendeArtikelen.length} nieuwe artikelen voor jou`,
          message: `Er zijn ${matchendeArtikelen.length} nieuwe artikelen die passen bij jouw profiel, waaronder "${matchendeArtikelen[0].titel}"`,
          link: "/artikelen",
        })
      }
    }

    // Maak artikel-notificaties aan
    let artikelAantal = 0
    if (artikelNotificaties.length > 0) {
      const result = await prisma.notification.createMany({
        data: artikelNotificaties,
        skipDuplicates: true,
      })
      artikelAantal = result.count
    }

    return new Response(
      JSON.stringify({
        succes: true,
        samenvatting: {
          checkInHerinneringen: checkInAantal,
          artikelNotificaties: artikelAantal,
          totaal: checkInAantal + artikelAantal,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    const bericht = error instanceof Error ? error.message : "Onbekende fout"
    console.error("Proactieve notificaties cron fout:", error)

    return new Response(
      JSON.stringify({ succes: false, fout: bericht }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
