import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

// GET - AVG Art. 20: Recht op dataportabiliteit
// Gebruiker kan al hun persoonlijke gegevens downloaden als JSON
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const userId = session.user.id

    // Haal alle gebruikersdata op in parallel
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gemeenteNaam: true,
        createdAt: true,
        updatedAt: true,
        caregiver: {
          select: {
            id: true,
            dateOfBirth: true,
            phoneNumber: true,
            postalCode: true,
            city: true,
            street: true,
            municipality: true,
            neighborhood: true,
            careRecipient: true,
            careRecipientName: true,
            careRecipientCity: true,
            careRecipientMunicipality: true,
            careRecipientNeighborhood: true,
            careRecipientStreet: true,
            careHoursPerWeek: true,
            careSince: true,
            intakeCompleted: true,
            profileCompleted: true,
            onboardedAt: true,
            privacyConsentAt: true,
            dataProcessingConsentAt: true,
            healthDataConsentAt: true,
            createdAt: true,
            updatedAt: true,
            // Gerelateerde data
            belastbaarheidTests: {
              select: {
                id: true,
                voornaam: true,
                email: true,
                totaleBelastingScore: true,
                belastingNiveau: true,
                totaleZorguren: true,
                isCompleted: true,
                completedAt: true,
                createdAt: true,
                antwoorden: {
                  select: {
                    vraagId: true,
                    vraagTekst: true,
                    antwoord: true,
                    score: true,
                  },
                },
                rapporten: {
                  select: {
                    samenvatting: true,
                    aandachtspunten: true,
                    aanbevelingen: true,
                    createdAt: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
            intakeResponses: {
              select: {
                id: true,
                questionId: true,
                value: true,
                score: true,
                createdAt: true,
                question: {
                  select: {
                    question: true,
                    category: { select: { name: true } },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
            monthlyCheckIns: {
              select: {
                id: true,
                month: true,
                overallWellbeing: true,
                physicalHealth: true,
                emotionalHealth: true,
                workLifeBalance: true,
                supportSatisfaction: true,
                highlights: true,
                challenges: true,
                needsHelp: true,
                completedAt: true,
                createdAt: true,
              },
              orderBy: { month: "desc" },
            },
            tasks: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                priority: true,
                status: true,
                dueDate: true,
                completedAt: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
            calendarEvents: {
              select: {
                id: true,
                title: true,
                description: true,
                location: true,
                startTime: true,
                endTime: true,
                eventType: true,
                createdAt: true,
              },
              orderBy: { startTime: "desc" },
            },
            helpRequests: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                urgency: true,
                status: true,
                response: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
            favorieten: {
              select: {
                id: true,
                type: true,
                titel: true,
                beschrijving: true,
                categorie: true,
                url: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
            buddyMatches: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                buddy: {
                  select: {
                    user: { select: { name: true } },
                  },
                },
              },
            },
            organisationLinks: {
              select: {
                shareWellbeing: true,
                shareNeeds: true,
                shareProgress: true,
                joinedAt: true,
                organisation: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 })
    }

    // Haal berichten apart op (staan op User niveau, niet Caregiver)
    const berichten = await prisma.bericht.findMany({
      where: { afzenderId: userId },
      select: {
        id: true,
        inhoud: true,
        isGelezen: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Haal notificaties op
    const notificaties = await prisma.notification.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Stel export samen
    const exportData = {
      exportDatum: new Date().toISOString(),
      exportVersie: "1.0",
      beschrijving: "AVG Art. 20 - Persoonlijke gegevensexport",
      account: {
        naam: user.name,
        email: user.email,
        rol: user.role,
        gemeente: user.gemeenteNaam,
        aangemaakt: user.createdAt,
        laatstGewijzigd: user.updatedAt,
      },
      profiel: user.caregiver ? {
        geboortedatum: user.caregiver.dateOfBirth,
        telefoon: user.caregiver.phoneNumber,
        postcode: user.caregiver.postalCode,
        woonplaats: user.caregiver.city,
        straat: user.caregiver.street,
        gemeente: user.caregiver.municipality,
        wijk: user.caregiver.neighborhood,
        zorgvrager: {
          naam: user.caregiver.careRecipientName,
          woonplaats: user.caregiver.careRecipientCity,
          gemeente: user.caregiver.careRecipientMunicipality,
          wijk: user.caregiver.careRecipientNeighborhood,
          straat: user.caregiver.careRecipientStreet,
        },
        zorgUrenPerWeek: user.caregiver.careHoursPerWeek,
        zorgtSinds: user.caregiver.careSince,
        profielCompleet: user.caregiver.profileCompleted,
        onboardedOp: user.caregiver.onboardedAt,
        toestemmingen: {
          privacy: user.caregiver.privacyConsentAt,
          gegevensverwerking: user.caregiver.dataProcessingConsentAt,
          gezondheidsdata: user.caregiver.healthDataConsentAt,
        },
      } : null,
      belastbaarheidTests: user.caregiver?.belastbaarheidTests || [],
      intakeResponses: user.caregiver?.intakeResponses || [],
      maandelijkseCheckIns: user.caregiver?.monthlyCheckIns || [],
      taken: user.caregiver?.tasks || [],
      kalenderEvents: user.caregiver?.calendarEvents || [],
      hulpvragen: user.caregiver?.helpRequests || [],
      favorieten: user.caregiver?.favorieten || [],
      buddyMatches: user.caregiver?.buddyMatches.map(m => ({
        id: m.id,
        status: m.status,
        buddyNaam: m.buddy?.user?.name || "Onbekend",
        aangemaakt: m.createdAt,
        laatstGewijzigd: m.updatedAt,
      })) || [],
      organisatieKoppelingen: user.caregiver?.organisationLinks.map(l => ({
        organisatie: l.organisation.name,
        deelWelzijn: l.shareWellbeing,
        deelBehoeften: l.shareNeeds,
        deelVoortgang: l.shareProgress,
        lidSinds: l.joinedAt,
      })) || [],
      verzondenBerichten: berichten,
      notificaties,
    }

    // Log de export in audit trail
    await logAudit({
      userId,
      actie: "DATA_EXPORT",
      entiteit: "User",
      entiteitId: userId,
      details: { formaat: "JSON", type: "persoonlijk" },
    })

    const filename = `mijn-gegevens-${new Date().toISOString().split("T")[0]}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Data export fout:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het exporteren van je gegevens" },
      { status: 500 }
    )
  }
}
