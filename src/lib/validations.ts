/**
 * Zod validatieschema's voor API input.
 * Centraal beheer van alle validatieregels.
 */

import { z } from "zod"

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
  password: z.string()
    .min(8, "Wachtwoord moet minimaal 8 tekens bevatten"),
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
  password: z.string()
    .min(8, "Wachtwoord moet minimaal 8 tekens bevatten"),
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
  belastingNiveau: z.enum(["ALLE", "LAAG", "GEMIDDELD", "HOOG"]).default("ALLE"),
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
