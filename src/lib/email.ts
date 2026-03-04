/**
 * Email service voor MantelBuddy.
 * Gebruikt nodemailer met SMTP configuratie.
 *
 * Benodigde environment variabelen:
 * - SMTP_HOST (bijv. smtp.gmail.com, smtp.sendgrid.net)
 * - SMTP_PORT (bijv. 587)
 * - SMTP_USER
 * - SMTP_PASSWORD
 * - EMAIL_FROM (bijv. "MantelBuddy <noreply@mantelbuddy.nl>")
 *
 * Als SMTP niet geconfigureerd is, worden emails gelogd naar de console.
 */

import { branding } from "@/config/branding"

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

const APP_NAME = branding.appName
const BASE_URL = branding.urls.production

function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!isSmtpConfigured()) {
    console.log(`[Email] SMTP niet geconfigureerd. Email naar ${options.to}:`)
    console.log(`  Onderwerp: ${options.subject}`)
    console.log(`  Inhoud: ${options.text || options.html.substring(0, 200)}...`)
    return true
  }

  try {
    // Dynamische import zodat nodemailer alleen geladen wordt als SMTP geconfigureerd is
    const nodemailer = await import("nodemailer")
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@mantelbuddy.nl>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    return true
  } catch (error) {
    console.error("[Email] Verzenden mislukt:", error)
    return false
  }
}

// --- Email templates ---

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:system-ui, -apple-system, sans-serif;">
  <div style="max-width:480px; margin:0 auto; padding:32px 16px;">
    <div style="background:white; border-radius:16px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,.1);">
      <div style="text-align:center; margin-bottom:24px;">
        <span style="font-size:24px; font-weight:700; color:#2C7A7B;">${APP_NAME}</span>
      </div>
      ${content}
      <div style="margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; text-align:center;">
        <p style="font-size:12px; color:#9ca3af; margin:0;">
          Dit bericht is verstuurd door ${APP_NAME}.<br>
          Je ontvangt dit omdat je bent aangemeld bij ${APP_NAME}.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`

  return sendEmail({
    to: email,
    subject: `Bevestig je e-mailadres - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">Welkom bij ${APP_NAME}!</h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 24px;">
        Fijn dat je je hebt aangemeld. Klik op de knop om je e-mailadres te bevestigen.
      </p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${verifyUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          E-mailadres bevestigen
        </a>
      </div>
      <p style="font-size:13px; color:#9ca3af; margin:0;">
        Deze link is 24 uur geldig. Werkt de knop niet? Kopieer dan deze link:<br>
        <a href="${verifyUrl}" style="color:#2C7A7B; word-break:break-all;">${verifyUrl}</a>
      </p>
    `),
    text: `Welkom bij ${APP_NAME}! Bevestig je e-mailadres via deze link: ${verifyUrl} (24 uur geldig)`,
  })
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${BASE_URL}/wachtwoord-reset?token=${token}`

  return sendEmail({
    to: email,
    subject: `Wachtwoord resetten - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">Wachtwoord resetten</h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 24px;">
        Je hebt gevraagd om je wachtwoord te resetten. Klik op de knop om een nieuw wachtwoord in te stellen.
      </p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          Nieuw wachtwoord instellen
        </a>
      </div>
      <p style="font-size:13px; color:#9ca3af; margin:0;">
        Deze link is 1 uur geldig. Heb je dit niet aangevraagd? Dan kun je dit bericht negeren.<br>
        Werkt de knop niet? Kopieer dan deze link:<br>
        <a href="${resetUrl}" style="color:#2C7A7B; word-break:break-all;">${resetUrl}</a>
      </p>
    `),
    text: `Wachtwoord resetten: ${resetUrl} (1 uur geldig). Heb je dit niet aangevraagd? Negeer dit bericht.`,
  })
}

export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const dashboardUrl = `${BASE_URL}/dashboard`

  return sendEmail({
    to: email,
    subject: `Welkom bij ${APP_NAME}!`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">
        Hallo${name ? ` ${name}` : ""}!
      </h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 16px;">
        Welkom bij ${APP_NAME}. Wij helpen je om de zorg voor je naaste beter vol te houden.
      </p>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 24px;">
        Dit kun je doen in de app:
      </p>
      <ul style="font-size:15px; color:#4b5563; line-height:1.8; padding-left:20px; margin:0 0 24px;">
        <li>Doe de balanstest om te zien hoe het met je gaat</li>
        <li>Vind hulp bij je in de buurt</li>
        <li>Lees tips van andere mantelzorgers</li>
      </ul>
      <div style="text-align:center; margin:24px 0;">
        <a href="${dashboardUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          Ga naar je dashboard
        </a>
      </div>
    `),
    text: `Welkom bij ${APP_NAME}! Ga naar je dashboard: ${dashboardUrl}`,
  })
}

// --- Balanstest opvolging emails ---

export async function sendBalanstestResultEmail(
  email: string,
  naam: string,
  score: number,
  niveau: "LAAG" | "GEMIDDELD" | "HOOG",
  gemeenteAdvies?: string | null,
): Promise<boolean> {
  const rapportUrl = `${BASE_URL}/rapport/persoonlijk`

  const niveauKleur = {
    LAAG: "#16a34a",
    GEMIDDELD: "#f59e0b",
    HOOG: "#ef4444",
  }[niveau]

  const niveauLabel = {
    LAAG: "Laag",
    GEMIDDELD: "Gemiddeld",
    HOOG: "Hoog",
  }[niveau]

  const niveauTekst = {
    LAAG: "Dat is goed nieuws! Je belasting is op dit moment beheersbaar.",
    GEMIDDELD: "Je belasting is gemiddeld. Het is verstandig om hulp te overwegen bij taken die je zwaar vallen.",
    HOOG: "Je belasting is hoog. We raden je aan om actie te ondernemen en hulp te zoeken.",
  }[niveau]

  const checkInInterval = niveau === "HOOG" ? "1 week" : niveau === "GEMIDDELD" ? "2 weken" : "4 weken"

  return sendEmail({
    to: email,
    subject: `Je balanstest resultaat - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">
        Hoi ${naam}, hier is je resultaat
      </h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 16px;">
        Bedankt voor het invullen van de balanstest. Hieronder je samenvatting.
      </p>
      <div style="background:#f9fafb; border-radius:12px; padding:20px; text-align:center; margin:0 0 20px;">
        <p style="font-size:13px; color:#6b7280; margin:0 0 8px;">Je belastingscore</p>
        <p style="font-size:36px; font-weight:700; color:${niveauKleur}; margin:0;">${score}/24</p>
        <p style="font-size:14px; font-weight:600; color:${niveauKleur}; margin:4px 0 0;">
          ${niveauLabel} belasting
        </p>
      </div>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 16px;">
        ${niveauTekst}
      </p>
      ${gemeenteAdvies ? `
      <div style="background:#f0fdf4; border-left:4px solid #16a34a; padding:12px 16px; border-radius:0 8px 8px 0; margin:0 0 20px;">
        <p style="font-size:13px; font-weight:600; color:#166534; margin:0 0 4px;">Advies van je gemeente</p>
        <p style="font-size:14px; color:#15803d; margin:0; line-height:1.5;">${gemeenteAdvies}</p>
      </div>` : ""}
      <div style="text-align:center; margin:24px 0;">
        <a href="${rapportUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          Bekijk je persoonlijk rapport
        </a>
      </div>
      <p style="font-size:13px; color:#9ca3af; margin:0; text-align:center;">
        Over ${checkInInterval} sturen we je een check-in om te kijken hoe het gaat.
      </p>
    `),
    text: `Hoi ${naam}, je balanstest score is ${score}/24 (${niveauLabel}). Bekijk je rapport: ${rapportUrl}`,
  })
}

export async function sendCheckInReminderEmail(
  email: string,
  naam: string,
): Promise<boolean> {
  const checkInUrl = `${BASE_URL}/dashboard`

  return sendEmail({
    to: email,
    subject: `Hoe gaat het met je? - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">
        Hoi ${naam}, hoe gaat het?
      </h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 24px;">
        Het is weer even tijd om stil te staan bij hoe het met je gaat als mantelzorger.
        Vul de korte check-in in zodat we je beter kunnen helpen.
      </p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${checkInUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          Check-in invullen
        </a>
      </div>
    `),
    text: `Hoi ${naam}, hoe gaat het? Vul de check-in in: ${checkInUrl}`,
  })
}

// --- Buddy matching emails ---

export async function sendBuddyReactieEmail(
  email: string,
  mantelzorgerNaam: string,
  buddyNaam: string,
  taakTitel: string,
): Promise<boolean> {
  const buddysUrl = `${BASE_URL}/buddys`

  return sendEmail({
    to: email,
    subject: `Nieuwe reactie op je hulpvraag - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">
        Hoi ${mantelzorgerNaam}!
      </h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 16px;">
        <strong>${buddyNaam}</strong> wil je helpen met <strong>&ldquo;${taakTitel}&rdquo;</strong>.
      </p>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 24px;">
        Bekijk het profiel en kies of je deze buddy wilt accepteren.
      </p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${buddysUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          Bekijk reactie
        </a>
      </div>
    `),
    text: `${buddyNaam} wil je helpen met "${taakTitel}". Bekijk de reactie: ${buddysUrl}`,
  })
}

export async function sendMatchBevestigEmail(
  email: string,
  buddyNaam: string,
  taakTitel: string,
): Promise<boolean> {
  const dashboardUrl = `${BASE_URL}/buddy/dashboard`

  return sendEmail({
    to: email,
    subject: `Je bent gekozen als buddy! - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">
        Goed nieuws, ${buddyNaam}!
      </h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 16px;">
        Je bent gekozen voor de hulpvraag <strong>&ldquo;${taakTitel}&rdquo;</strong>.
      </p>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 24px;">
        Bevestig de match om te beginnen met helpen. Na bevestiging kun je chatten met de mantelzorger.
      </p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${dashboardUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          Bevestig de match
        </a>
      </div>
    `),
    text: `Je bent gekozen voor "${taakTitel}". Bevestig de match: ${dashboardUrl}`,
  })
}

export async function sendMatchActiefEmail(
  email: string,
  mantelzorgerNaam: string,
  buddyNaam: string,
): Promise<boolean> {
  const buddysUrl = `${BASE_URL}/buddys`

  return sendEmail({
    to: email,
    subject: `Match bevestigd! - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">
        Hoi ${mantelzorgerNaam}!
      </h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 16px;">
        <strong>${buddyNaam}</strong> heeft de match bevestigd. Jullie kunnen nu chatten!
      </p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${buddysUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          Open de chat
        </a>
      </div>
    `),
    text: `${buddyNaam} heeft de match bevestigd! Open de chat: ${buddysUrl}`,
  })
}

export async function sendNieuwBerichtEmail(
  email: string,
  ontvangerNaam: string,
  afzenderNaam: string,
  berichtPreview: string,
): Promise<boolean> {
  const dashboardUrl = `${BASE_URL}/dashboard`

  return sendEmail({
    to: email,
    subject: `Nieuw bericht van ${afzenderNaam} - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">
        Hoi ${ontvangerNaam}!
      </h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 16px;">
        <strong>${afzenderNaam}</strong> heeft je een bericht gestuurd:
      </p>
      <div style="background:#f9fafb; border-left:4px solid #2C7A7B; padding:12px 16px; border-radius:0 8px 8px 0; margin:0 0 20px;">
        <p style="font-size:14px; color:#374151; margin:0; line-height:1.5; font-style:italic;">
          &ldquo;${berichtPreview}&rdquo;
        </p>
      </div>
      <div style="text-align:center; margin:24px 0;">
        <a href="${dashboardUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          Bekijk bericht
        </a>
      </div>
    `),
    text: `${afzenderNaam}: "${berichtPreview}". Bekijk het bericht: ${dashboardUrl}`,
  })
}

export async function sendContentEmail(
  email: string,
  naam: string,
  content: {
    titel: string
    beschrijving?: string | null
    organisatie?: string | null
    gemeente?: string | null
    telefoon?: string | null
    website?: string | null
    kosten?: string | null
    openingstijden?: string | null
    soortHulp?: string | null
  },
): Promise<boolean> {
  const detailRijen = [
    content.organisatie && `<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:13px;vertical-align:top;">Organisatie</td><td style="color:#111827;padding:4px 0;font-size:13px;">${content.organisatie}</td></tr>`,
    content.gemeente && `<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:13px;vertical-align:top;">Locatie</td><td style="color:#111827;padding:4px 0;font-size:13px;">${content.gemeente}</td></tr>`,
    content.soortHulp && `<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:13px;vertical-align:top;">Soort hulp</td><td style="color:#111827;padding:4px 0;font-size:13px;">${content.soortHulp}</td></tr>`,
    content.kosten && `<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:13px;vertical-align:top;">Kosten</td><td style="color:#111827;padding:4px 0;font-size:13px;">${content.kosten}</td></tr>`,
    content.openingstijden && `<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:13px;vertical-align:top;">Bereikbaar</td><td style="color:#111827;padding:4px 0;font-size:13px;">${content.openingstijden}</td></tr>`,
    content.telefoon && `<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:13px;vertical-align:top;">Telefoon</td><td style="color:#111827;padding:4px 0;font-size:13px;"><a href="tel:${content.telefoon}" style="color:#2C7A7B;text-decoration:none;">${content.telefoon}</a></td></tr>`,
  ].filter(Boolean).join("")

  const websiteKnop = content.website
    ? `<div style="text-align:center;margin:20px 0 0;">
        <a href="${content.website}" style="display:inline-block;padding:12px 28px;background:#2C7A7B;color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
          Naar website
        </a>
      </div>`
    : ""

  const plainDetails = [
    content.organisatie && `Organisatie: ${content.organisatie}`,
    content.gemeente && `Locatie: ${content.gemeente}`,
    content.telefoon && `Telefoon: ${content.telefoon}`,
    content.website && `Website: ${content.website}`,
    content.kosten && `Kosten: ${content.kosten}`,
  ].filter(Boolean).join("\n")

  return sendEmail({
    to: email,
    subject: `${content.titel} - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">
        Hoi${naam ? ` ${naam}` : ""}!
      </h1>
      <p style="font-size:15px; color:#4b5563; line-height:1.6; margin:0 0 16px;">
        Je hebt het volgende item bewaard vanuit ${APP_NAME}:
      </p>
      <div style="background:#f9fafb; border-radius:12px; padding:20px; margin:0 0 20px;">
        <h2 style="font-size:17px; color:#111827; margin:0 0 8px; font-weight:700;">
          ${content.titel}
        </h2>
        ${content.beschrijving ? `<p style="font-size:14px; color:#4b5563; line-height:1.5; margin:0 0 12px;">${content.beschrijving}</p>` : ""}
        ${detailRijen ? `<table style="border-collapse:collapse;">${detailRijen}</table>` : ""}
      </div>
      ${websiteKnop}
    `),
    text: `${content.titel}\n\n${content.beschrijving || ""}\n\n${plainDetails}`,
  })
}

export async function sendAlarmNotificationEmail(
  email: string,
  gemeenteNaam: string,
  alarmType: string,
  urgentie: string,
  beschrijving: string,
): Promise<boolean> {
  const dashboardUrl = `${BASE_URL}/gemeente`

  const urgentieKleur: Record<string, string> = {
    CRITICAL: "#dc2626",
    HIGH: "#f59e0b",
    MEDIUM: "#3b82f6",
    LOW: "#6b7280",
  }

  return sendEmail({
    to: email,
    subject: `[${urgentie}] Nieuw alarm in ${gemeenteNaam} - ${APP_NAME}`,
    html: emailWrapper(`
      <h1 style="font-size:20px; color:#111827; margin:0 0 8px;">
        Nieuw alarm: ${gemeenteNaam}
      </h1>
      <div style="background:#fef2f2; border-left:4px solid ${urgentieKleur[urgentie] || "#6b7280"}; padding:12px 16px; border-radius:0 8px 8px 0; margin:0 0 20px;">
        <p style="font-size:13px; font-weight:600; color:${urgentieKleur[urgentie] || "#6b7280"}; margin:0 0 4px;">${urgentie} - ${alarmType.replace(/_/g, " ")}</p>
        <p style="font-size:14px; color:#374151; margin:0; line-height:1.5;">${beschrijving}</p>
      </div>
      <p style="font-size:14px; color:#4b5563; margin:0 0 20px;">
        Er is een geanonimiseerde melding binnengekomen uit uw gemeente.
        Ga naar het gemeenteportaal voor meer informatie.
      </p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${dashboardUrl}" style="display:inline-block; padding:14px 32px; background:#2C7A7B; color:white; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px;">
          Naar gemeenteportaal
        </a>
      </div>
    `),
    text: `[${urgentie}] Nieuw alarm in ${gemeenteNaam}: ${beschrijving}`,
  })
}
