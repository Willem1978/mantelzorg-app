import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { hash } from "bcryptjs"

/**
 * POST /api/beheer/gemeenten/onboarding
 *
 * Gecombineerd endpoint voor de gemeente onboarding wizard.
 * Maakt in één keer aan:
 * - Gemeente (met contactgegevens)
 * - Advies per belastingniveau
 * - Optioneel: eerste beheerder account
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validatie
    if (!body.naam?.trim()) {
      return NextResponse.json({ error: "Gemeente naam is verplicht" }, { status: 400 })
    }
    if (!body.contactEmail?.trim() && !body.contactTelefoon?.trim()) {
      return NextResponse.json(
        { error: "Minimaal e-mail of telefoon is verplicht" },
        { status: 400 },
      )
    }

    // Check of gemeente al bestaat
    const bestaand = await prisma.gemeente.findFirst({
      where: {
        OR: [
          { naam: { equals: body.naam.trim(), mode: "insensitive" } },
          ...(body.code ? [{ code: body.code.trim() }] : []),
        ],
      },
    })

    if (bestaand) {
      return NextResponse.json(
        { error: "Deze gemeente bestaat al", gemeenteId: bestaand.id },
        { status: 409 },
      )
    }

    // Maak gemeente aan
    const gemeente = await prisma.gemeente.create({
      data: {
        naam: body.naam.trim(),
        code: body.code?.trim() || null,
        isActief: true,
        contactEmail: body.contactEmail?.trim() || null,
        contactTelefoon: body.contactTelefoon?.trim() || null,
        websiteUrl: body.websiteUrl?.trim() || null,
        wmoLoketUrl: body.wmoLoketUrl?.trim() || null,
        adviesLaag: body.adviesLaag?.trim() || null,
        adviesGemiddeld: body.adviesGemiddeld?.trim() || null,
        adviesHoog: body.adviesHoog?.trim() || null,
        organisatieLaagId: body.organisatieLaagId || null,
        organisatieGemiddeldId: body.organisatieGemiddeldId || null,
        organisatieHoogId: body.organisatieHoogId || null,
        mantelzorgSteunpunt: body.mantelzorgSteunpunt?.trim() || null,
        mantelzorgSteunpuntNaam: body.mantelzorgSteunpuntNaam?.trim() || null,
        respijtzorgUrl: body.respijtzorgUrl?.trim() || null,
        dagopvangUrl: body.dagopvangUrl?.trim() || null,
        notities: body.notities?.trim() || null,
      },
    })

    // Optioneel: beheerder aanmaken
    let beheerder = null
    if (body.beheerderEmail?.trim()) {
      // Check of gebruiker al bestaat
      const bestaandeUser = await prisma.user.findUnique({
        where: { email: body.beheerderEmail.trim() },
      })

      if (bestaandeUser) {
        // Update rol naar GEMEENTE_ADMIN als dat nog niet zo is
        if (bestaandeUser.role !== "GEMEENTE_ADMIN" && bestaandeUser.role !== "ADMIN") {
          await prisma.user.update({
            where: { id: bestaandeUser.id },
            data: {
              role: "GEMEENTE_ADMIN",
              gemeenteNaam: gemeente.naam,
            },
          })
        }
        beheerder = { id: bestaandeUser.id, email: bestaandeUser.email, bestaand: true }
      } else {
        // Maak nieuw account aan
        const tempPassword = Math.random().toString(36).slice(-10)
        const hashedPassword = await hash(tempPassword, 12)

        const newUser = await prisma.user.create({
          data: {
            name: body.beheerderNaam?.trim() || "Gemeentebeheerder",
            email: body.beheerderEmail.trim(),
            password: hashedPassword,
            role: "GEMEENTE_ADMIN",
            gemeenteNaam: gemeente.naam,
          },
        })

        beheerder = { id: newUser.id, email: newUser.email, bestaand: false }
      }
    }

    await logAudit({
      userId: session.user.id!,
      actie: "CREATE",
      entiteit: "Gemeente",
      entiteitId: gemeente.id,
      details: {
        naam: gemeente.naam,
        viaWizard: true,
        beheerderAangemaakt: !!beheerder,
      },
    })

    return NextResponse.json({
      gemeente,
      beheerder,
      succes: true,
    }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Deze gemeente bestaat al" }, { status: 409 })
    }
    console.error("Onboarding mislukt:", error)
    return NextResponse.json({ error: "Onboarding mislukt" }, { status: 500 })
  }
}
