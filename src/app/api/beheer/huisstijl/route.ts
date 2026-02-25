import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

// Standaard instellingen die worden aangemaakt als ze nog niet bestaan
const DEFAULTS: Array<{
  categorie: string
  sleutel: string
  waarde: string
  label: string
  type: string
  groep: string
  volgorde: number
}> = [
  // ── Branding ──
  { categorie: "branding", sleutel: "branding.appName", waarde: "MantelBuddy", label: "App naam", type: "text", groep: "Identiteit", volgorde: 1 },
  { categorie: "branding", sleutel: "branding.tagline", waarde: "Samen lokaal sterk", label: "Tagline", type: "text", groep: "Identiteit", volgorde: 2 },
  { categorie: "branding", sleutel: "branding.description", waarde: "MantelBuddy verbindt mantelzorgers met vrijwilligers uit de buurt", label: "Beschrijving", type: "textarea", groep: "Identiteit", volgorde: 3 },
  { categorie: "branding", sleutel: "branding.logo", waarde: "", label: "Logo (upload)", type: "image", groep: "Logo", volgorde: 10 },
  { categorie: "branding", sleutel: "branding.contactEmail", waarde: "info@mantelbuddy.nl", label: "Contact e-mail", type: "text", groep: "Contact", volgorde: 20 },
  { categorie: "branding", sleutel: "branding.mantelzorglijn", waarde: "030 - 205 90 59", label: "Mantelzorglijn nummer", type: "text", groep: "Contact", volgorde: 21 },
  { categorie: "branding", sleutel: "branding.whatsappNumber", waarde: "+14155238886", label: "WhatsApp nummer", type: "text", groep: "Contact", volgorde: 22 },

  // ── Kleuren ──
  { categorie: "kleuren", sleutel: "kleuren.primary", waarde: "#2C7A7B", label: "Primaire kleur", type: "color", groep: "Hoofdkleuren", volgorde: 1 },
  { categorie: "kleuren", sleutel: "kleuren.primaryLight", waarde: "#319795", label: "Primaire kleur (licht)", type: "color", groep: "Hoofdkleuren", volgorde: 2 },
  { categorie: "kleuren", sleutel: "kleuren.background", waarde: "#F7FAFC", label: "Achtergrondkleur", type: "color", groep: "Hoofdkleuren", volgorde: 3 },
  { categorie: "kleuren", sleutel: "kleuren.scoreLaag", waarde: "#2E7D32", label: "Score laag (groen)", type: "color", groep: "Score kleuren", volgorde: 10 },
  { categorie: "kleuren", sleutel: "kleuren.scoreGemiddeld", waarde: "#C86800", label: "Score gemiddeld (oranje)", type: "color", groep: "Score kleuren", volgorde: 11 },
  { categorie: "kleuren", sleutel: "kleuren.scoreHoog", waarde: "#B71C1C", label: "Score hoog (rood)", type: "color", groep: "Score kleuren", volgorde: 12 },

  // ── Teksten ──
  { categorie: "teksten", sleutel: "teksten.landing.heroTitle", waarde: "Samen zorgen, samen sterk", label: "Hero titel (landingspagina)", type: "text", groep: "Landingspagina", volgorde: 1 },
  { categorie: "teksten", sleutel: "teksten.landing.heroSubtitle", waarde: "MantelBuddy verbindt mantelzorgers met vrijwilligers uit de buurt. Samen maken we mantelzorg lichter.", label: "Hero subtitel", type: "textarea", groep: "Landingspagina", volgorde: 2 },
  { categorie: "teksten", sleutel: "teksten.dashboard.greeting", waarde: "Welkom terug", label: "Begroeting dashboard", type: "text", groep: "Dashboard", volgorde: 10 },
  { categorie: "teksten", sleutel: "teksten.profiel.intro", waarde: "Hier kun je je gegevens bekijken en aanpassen. Met je adresgegevens zoeken we hulp bij jou in de buurt. Klik op 'Bewerken' om iets te veranderen.", label: "Profiel introductie", type: "textarea", groep: "Profiel", volgorde: 20 },
  { categorie: "teksten", sleutel: "teksten.hulp.tekst", waarde: "Wil je met iemand praten over mantelzorg? Bel de Mantelzorglijn. Zij luisteren en geven advies. Gratis en anoniem.", label: "Hulp nodig tekst", type: "textarea", groep: "Algemeen", volgorde: 30 },
  { categorie: "teksten", sleutel: "teksten.whatsapp.subtitle", waarde: "Je kunt MantelBuddy ook via WhatsApp gebruiken. Handig voor op je telefoon!", label: "WhatsApp beschrijving", type: "textarea", groep: "WhatsApp", volgorde: 40 },
  { categorie: "teksten", sleutel: "teksten.versie", waarde: "MantelBuddy v1.4.0", label: "Versie tekst", type: "text", groep: "Algemeen", volgorde: 50 },
]

/**
 * GET: Haal alle site-instellingen op (met auto-seed van defaults)
 */
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    // Zorg dat defaults bestaan
    const existing = await prisma.siteSettings.findMany()
    const existingKeys = new Set(existing.map((s) => s.sleutel))

    const missing = DEFAULTS.filter((d) => !existingKeys.has(d.sleutel))
    if (missing.length > 0) {
      await prisma.siteSettings.createMany({ data: missing })
    }

    // Haal alles opnieuw op (inclusief net aangemaakte)
    const settings = await prisma.siteSettings.findMany({
      orderBy: [{ categorie: "asc" }, { volgorde: "asc" }],
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Huisstijl ophalen mislukt:", error)
    return NextResponse.json({ error: "Huisstijl ophalen mislukt" }, { status: 500 })
  }
}

/**
 * PUT: Werk meerdere instellingen tegelijk bij
 */
export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { updates } = body as { updates: Array<{ sleutel: string; waarde: string }> }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Ongeldige data" }, { status: 400 })
    }

    // Batch update via transactie
    await prisma.$transaction(
      updates.map((update) =>
        prisma.siteSettings.update({
          where: { sleutel: update.sleutel },
          data: {
            waarde: update.waarde,
            updatedBy: session.user.id,
          },
        })
      )
    )

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "SiteSettings",
      details: { keys: updates.map((u) => u.sleutel) },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Huisstijl opslaan mislukt:", error)
    return NextResponse.json({ error: "Huisstijl opslaan mislukt" }, { status: 500 })
  }
}
