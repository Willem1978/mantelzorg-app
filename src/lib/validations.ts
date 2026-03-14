/**
 * Zod validatieschema's voor API input.
 * Centraal beheer van alle validatieregels.
 */

import { z } from "zod"

// --- Wachtwoord schema (herbruikbaar) ---
// Eisen: min 8 tekens, 1 hoofdletter, 1 cijfer, 1 speciaal teken

export const passwordSchema = z.string()
  .min(8, "Wachtwoord moet minimaal 8 tekens bevatten")
  .regex(/[A-Z]/, "Wachtwoord moet minimaal 1 hoofdletter bevatten")
  .regex(/[0-9]/, "Wachtwoord moet minimaal 1 cijfer bevatten")
  .regex(/[^A-Za-z0-9]/, "Wachtwoord moet minimaal 1 speciaal teken bevatten (!@#$%&*)")

// --- Auth schema's ---

export const loginSchema = z.object({
  email: z.string()
    .min(1, "E-mailadres is verplicht")
    .email("Vul een geldig e-mailadres in"),
  password: z.string()
    .min(1, "Wachtwoord is verplicht"),
})

export const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string()
    .min(1, "E-mailadres is verplicht")
    .email("Vul een geldig e-mailadres in"),
  password: passwordSchema,
  phoneNumber: z.string()
    .regex(/^06\d{8}$/, "Vul een geldig telefoonnummer in (06 + 8 cijfers)")
    .optional()
    .or(z.literal("")),
  postalCode: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  municipality: z.object({
    code: z.string(),
    name: z.string(),
    provinceCode: z.string(),
    provinceName: z.string(),
  }),
  careRecipientName: z.string().optional(),
  careRecipientRelation: z.string().optional(),
  careRecipientStreet: z.string().optional(),
  careRecipientCity: z.string().optional(),
  careRecipientMunicipality: z.string().optional(),
  privacyConsent: z.boolean().refine((v) => v === true, {
    message: "Je moet akkoord gaan met het privacybeleid",
  }),
  dataProcessingConsent: z.boolean().refine((v) => v === true, {
    message: "Je moet akkoord gaan met de gegevensverwerking",
  }),
})

export const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, "E-mailadres is verplicht")
    .email("Vul een geldig e-mailadres in"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is verplicht"),
  password: passwordSchema,
})

// --- Beheer schema's ---

export const artikelSchema = z.object({
  titel: z.string().min(1, "Titel is verplicht"),
  beschrijving: z.string().min(1, "Beschrijving is verplicht"),
  inhoud: z.string().optional().default(""),
  url: z.string().url("Vul een geldige URL in").optional().or(z.literal("")),
  bron: z.string().optional().default(""),
  emoji: z.string().optional().default(""),
  categorie: z.string().min(1, "Categorie is verplicht"),
  subHoofdstuk: z.string().optional().default(""),
  bronLabel: z.string().optional().default(""),
  type: z.enum(["ARTIKEL", "GEMEENTE_NIEUWS", "TIP"]).default("ARTIKEL"),
  status: z.enum(["CONCEPT", "GEPUBLICEERD", "GEARCHIVEERD"]).default("CONCEPT"),
  gemeente: z.string().optional().default(""),
  publicatieDatum: z.string().optional().default(""),
  sorteerVolgorde: z.number().int().default(0),
})

export const hulpbronSchema = z.object({
  naam: z.string().min(1, "Naam is verplicht"),
  beschrijving: z.string().optional().default(""),
  categorie: z.string().min(1, "Categorie is verplicht"),
  telefoon: z.string().optional().default(""),
  email: z.string().email("Vul een geldig e-mailadres in").optional().or(z.literal("")),
  website: z.string().url("Vul een geldige URL in").optional().or(z.literal("")),
  adres: z.string().optional().default(""),
  gemeente: z.string().optional().default(""),
  isActief: z.boolean().default(true),
})

// --- Check-in schema ---

export const checkInSchema = z.object({
  score: z.number().int().min(1).max(5),
  notitie: z.string().optional().default(""),
})

// --- Hulpvragen schema ---

export const hulpvraagSchema = z.object({
  titel: z.string().min(1, "Titel is verplicht").max(200),
  categorie: z.string().min(1, "Categorie is verplicht"),
  beschrijving: z.string().min(1, "Beschrijving is verplicht").max(2000),
  datum: z.string().optional(),
  tijdstip: z.string().optional(),
  isFlexibel: z.boolean().optional().default(false),
})

export const hulpvraagReactieSchema = z.object({
  bericht: z.string().min(1, "Bericht is verplicht").max(2000),
})

// --- Profiel schema ---

export const profielSchema = z.object({
  naam: z.string().min(1, "Naam is verplicht").max(100).optional(),
  straat: z.string().max(200).optional(),
  woonplaats: z.string().max(100).optional(),
  postcode: z.string().max(10).optional(),
  gemeente: z.string().max(100).optional(),
  wijk: z.string().max(100).optional(),
  naasteNaam: z.string().max(100).optional(),
  naasteRelatie: z.string().max(100).optional(),
  naasteStraat: z.string().max(200).optional(),
  naasteWoonplaats: z.string().max(100).optional(),
  naasteGemeente: z.string().max(100).optional(),
  telefoon: z.string().max(20).optional(),
})

// --- Favorieten schema ---

export const favorietSchema = z.object({
  type: z.string().min(1),
  itemId: z.string().min(1),
  titel: z.string().max(200).optional().default(""),
  beschrijving: z.string().max(500).optional().default(""),
  categorie: z.string().optional().default(""),
  url: z.string().optional().default(""),
  telefoon: z.string().optional().default(""),
  icon: z.string().optional().default(""),
})

// --- Kalender schema ---

export const calendarEventSchema = z.object({
  title: z.string().min(1, "Titel is verplicht").max(200),
  description: z.string().max(2000).optional().default(""),
  location: z.string().max(200).optional().default(""),
  startTime: z.string().min(1, "Starttijd is verplicht"),
  endTime: z.string().min(1, "Eindtijd is verplicht"),
  isAllDay: z.boolean().optional().default(false),
  eventType: z.string().optional().default("GENERAL"),
  reminderMinutes: z.number().int().min(0).optional(),
  color: z.string().optional(),
})

// --- Belastbaarheidstest schema ---

export const belastbaarheidstestSchema = z.object({
  registratie: z.object({
    voornaam: z.string().min(1).max(100),
    email: z.string().email().optional().or(z.literal("")),
    postcode: z.string().max(10).optional().default(""),
    huisnummer: z.string().max(10).optional().default(""),
    straat: z.string().max(200).optional().default(""),
    woonplaats: z.string().max(100).optional().default(""),
    gemeente: z.string().max(100).optional().default(""),
  }),
  antwoorden: z.record(z.string(), z.enum(["ja", "soms", "nee"])),
  taken: z.record(z.string(), z.object({
    isGeselecteerd: z.boolean(),
    uren: z.string().optional().default(""),
    belasting: z.string().optional().default(""),
  })).optional().default({}),
})

// --- Voorkeuren schema ---

export const voorkeurenSchema = z.object({
  voorkeuren: z.array(z.object({
    type: z.string(),
    slug: z.string(),
  })),
  aandoening: z.string().optional(),
  aandoeningen: z.array(z.string()).optional(), // Multi-select aandoeningen
})

// --- Onboarding profiel schema ---

export const onboardingProfielSchema = z.object({
  gemeente: z.string().optional(),
  careRecipient: z.string().optional(),
  careHoursPerWeek: z.string().optional(),
  careSinceDuration: z.string().optional(),
})

// --- Notificatie schema ---

export const notificatieSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  link: z.string().optional(),
  scheduledFor: z.string().optional(),
})

// --- Buddy match schema ---

export const buddyMatchSchema = z.object({
  zorgtaken: z.array(z.string()).optional().default([]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  beschikbaarheid: z.string().optional(),
  maxAfstandKm: z.number().min(1).max(100).optional().default(25),
})

// --- Intake schema ---

export const intakeSchema = z.object({
  answers: z.record(z.string(), z.string()),
})

// --- AI Chat schema ---

export const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().max(10000).optional(),
    parts: z.array(z.any()).optional(),
  })).min(1),
})

// --- Beheer schema's (admin) ---

export const gemeenteSchema = z.object({
  naam: z.string().min(1, "Naam is verplicht"),
  code: z.string().optional(),
  isActief: z.boolean().optional().default(true),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactTelefoon: z.string().optional().default(""),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  wmoLoketUrl: z.string().url().optional().or(z.literal("")),
  adviesLaag: z.string().optional().default(""),
  adviesGemiddeld: z.string().optional().default(""),
  adviesHoog: z.string().optional().default(""),
  mantelzorgSteunpunt: z.string().optional().default(""),
  mantelzorgSteunpuntNaam: z.string().optional().default(""),
  respijtzorgUrl: z.string().url().optional().or(z.literal("")),
  dagopvangUrl: z.string().url().optional().or(z.literal("")),
  notities: z.string().optional().default(""),
})

export const inviteSchema = z.object({
  token: z.string().min(1, "Token is verplicht"),
  name: z.string().min(1, "Naam is verplicht"),
  password: passwordSchema,
})

// --- Beheer gebruiker update schema (admin) ---

export const beheerGebruikerUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN", "GEMEENTE_ADMIN"]).optional(),
  name: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  adminNotities: z.string().max(5000).optional().nullable(),
  resetPassword: passwordSchema.optional(),
})

// --- Gemeente content schema ---

export const gemeenteContentSchema = z.object({
  titel: z.string().min(1, "Titel is verplicht").max(200),
  beschrijving: z.string().min(1, "Beschrijving is verplicht").max(2000),
  inhoud: z.string().max(10000).optional().nullable(),
  url: z.string().url().optional().or(z.literal("")).nullable(),
  bron: z.string().max(200).optional().nullable(),
  emoji: z.string().max(10).optional().nullable(),
  publicatieDatum: z.string().optional().nullable(),
})

// --- Gemeente evenement schema ---

export const gemeenteEvenementSchema = z.object({
  titel: z.string().min(1, "Titel is verplicht").max(200),
  beschrijving: z.string().min(1, "Beschrijving is verplicht").max(2000),
  publicatieDatum: z.string().min(1, "Datum is verplicht"),
  inhoud: z.string().max(10000).optional().nullable(),
  url: z.string().url().optional().or(z.literal("")).nullable(),
  emoji: z.string().max(10).optional().nullable(),
})

// --- Gemeente hulpbron schema ---

export const gemeenteHulpbronInformatieSchema = z.object({
  sectie: z.literal("informatie"),
  titel: z.string().min(1, "Titel is verplicht").max(200),
  beschrijving: z.string().min(1, "Beschrijving is verplicht").max(2000),
  inhoud: z.string().max(10000).optional().nullable(),
  url: z.string().url().optional().or(z.literal("")).nullable(),
  publicatieDatum: z.string().optional().nullable(),
})

export const gemeenteHulpbronHulpSchema = z.object({
  sectie: z.literal("hulp").optional(),
  naam: z.string().min(1, "Naam is verplicht").max(200),
  beschrijving: z.string().max(2000).optional().nullable(),
  doelgroep: z.string().max(100).optional().nullable(),
  onderdeelTest: z.string().max(100).optional().nullable(),
  soortHulp: z.string().max(100).optional().nullable(),
  telefoon: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
})

export const gemeenteHulpbronUpdateSchema = z.object({
  id: z.string().min(1, "ID is verplicht"),
  naam: z.string().min(1).max(200).optional(),
  beschrijving: z.string().max(2000).optional().nullable(),
  doelgroep: z.string().max(100).optional().nullable(),
  onderdeelTest: z.string().max(100).optional().nullable(),
  soortHulp: z.string().max(100).optional().nullable(),
  telefoon: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  openingstijden: z.string().max(500).optional().nullable(),
  kosten: z.string().max(500).optional().nullable(),
  isActief: z.boolean().optional(),
})

// --- Gemeente gebruiker uitnodiging schema ---

export const gemeenteGebruikerUitnodigingSchema = z.object({
  email: z.string().min(1, "E-mailadres is verplicht").email("Vul een geldig e-mailadres in"),
  name: z.string().max(100).optional(),
  gemeenteRollen: z.array(z.enum(["COMMUNICATIE", "HULPBRONNEN", "BELEID"])).min(1, "Selecteer minimaal één rol"),
})

// --- Helper om Zod errors naar een leesbare string te converteren ---

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((e) => e.message).join(". ")
}

/**
 * Valideer request body met een Zod schema.
 * Geeft { success: true, data } of { success: false, error }.
 */
export function validateBody<T>(
  body: unknown,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: formatZodErrors(result.error) }
}
