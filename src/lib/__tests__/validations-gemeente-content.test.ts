import { describe, it, expect } from "vitest"
import {
  gemeenteContentSchema,
  gemeenteEvenementSchema,
  gemeenteHulpbronInformatieSchema,
  gemeenteHulpbronHulpSchema,
  gemeenteHulpbronUpdateSchema,
  gemeenteGebruikerUitnodigingSchema,
} from "../validations"

describe("gemeenteContentSchema", () => {
  it("accepteert geldig content", () => {
    expect(gemeenteContentSchema.safeParse({
      titel: "Nieuwsartikel",
      beschrijving: "Beschrijving van het nieuws",
    }).success).toBe(true)
  })

  it("accepteert met optionele velden", () => {
    expect(gemeenteContentSchema.safeParse({
      titel: "Nieuwsartikel",
      beschrijving: "Beschrijving",
      inhoud: "Lange inhoud...",
      url: "https://example.com",
      bron: "Gemeente Zutphen",
      emoji: "📰",
      publicatieDatum: "2025-01-15",
    }).success).toBe(true)
  })

  it("weigert lege titel", () => {
    expect(gemeenteContentSchema.safeParse({
      titel: "",
      beschrijving: "Beschrijving",
    }).success).toBe(false)
  })

  it("weigert lege beschrijving", () => {
    expect(gemeenteContentSchema.safeParse({
      titel: "Titel",
      beschrijving: "",
    }).success).toBe(false)
  })

  it("weigert te lange titel (> 200)", () => {
    expect(gemeenteContentSchema.safeParse({
      titel: "a".repeat(201),
      beschrijving: "Ok",
    }).success).toBe(false)
  })
})

describe("gemeenteEvenementSchema", () => {
  it("accepteert geldig evenement", () => {
    expect(gemeenteEvenementSchema.safeParse({
      titel: "Mantelzorgdag",
      beschrijving: "Jaarlijks evenement",
      publicatieDatum: "2025-11-10",
    }).success).toBe(true)
  })

  it("weigert zonder datum", () => {
    expect(gemeenteEvenementSchema.safeParse({
      titel: "Evenement",
      beschrijving: "Beschrijving",
      publicatieDatum: "",
    }).success).toBe(false)
  })
})

describe("gemeenteHulpbronInformatieSchema", () => {
  it("accepteert geldige informatie", () => {
    expect(gemeenteHulpbronInformatieSchema.safeParse({
      sectie: "informatie",
      titel: "Nieuw bericht",
      beschrijving: "Beschrijving",
    }).success).toBe(true)
  })

  it("weigert verkeerde sectie", () => {
    expect(gemeenteHulpbronInformatieSchema.safeParse({
      sectie: "hulp",
      titel: "Titel",
      beschrijving: "Beschrijving",
    }).success).toBe(false)
  })
})

describe("gemeenteHulpbronHulpSchema", () => {
  it("accepteert minimale hulpbron", () => {
    expect(gemeenteHulpbronHulpSchema.safeParse({
      naam: "Thuiszorg XYZ",
    }).success).toBe(true)
  })

  it("accepteert volledige hulpbron", () => {
    expect(gemeenteHulpbronHulpSchema.safeParse({
      naam: "Thuiszorg XYZ",
      beschrijving: "Hulp aan huis",
      doelgroep: "Ouderen",
      onderdeelTest: "Verzorging",
      soortHulp: "Praktisch",
      telefoon: "030-123456",
      email: "info@thuiszorg.nl",
      website: "https://thuiszorg.nl",
    }).success).toBe(true)
  })

  it("weigert lege naam", () => {
    expect(gemeenteHulpbronHulpSchema.safeParse({ naam: "" }).success).toBe(false)
  })
})

describe("gemeenteHulpbronUpdateSchema", () => {
  it("accepteert alleen id", () => {
    expect(gemeenteHulpbronUpdateSchema.safeParse({ id: "abc123" }).success).toBe(true)
  })

  it("weigert zonder id", () => {
    expect(gemeenteHulpbronUpdateSchema.safeParse({}).success).toBe(false)
  })

  it("accepteert isActief toggle", () => {
    expect(gemeenteHulpbronUpdateSchema.safeParse({
      id: "abc123",
      isActief: false,
    }).success).toBe(true)
  })
})

describe("gemeenteGebruikerUitnodigingSchema", () => {
  it("accepteert geldige uitnodiging", () => {
    expect(gemeenteGebruikerUitnodigingSchema.safeParse({
      email: "jan@example.com",
      gemeenteRollen: ["COMMUNICATIE"],
    }).success).toBe(true)
  })

  it("accepteert meerdere rollen", () => {
    expect(gemeenteGebruikerUitnodigingSchema.safeParse({
      email: "jan@example.com",
      gemeenteRollen: ["COMMUNICATIE", "HULPBRONNEN", "BELEID"],
    }).success).toBe(true)
  })

  it("weigert lege rollen array", () => {
    expect(gemeenteGebruikerUitnodigingSchema.safeParse({
      email: "jan@example.com",
      gemeenteRollen: [],
    }).success).toBe(false)
  })

  it("weigert ongeldige rol", () => {
    expect(gemeenteGebruikerUitnodigingSchema.safeParse({
      email: "jan@example.com",
      gemeenteRollen: ["ADMIN"],
    }).success).toBe(false)
  })

  it("weigert ongeldig email", () => {
    expect(gemeenteGebruikerUitnodigingSchema.safeParse({
      email: "geen-email",
      gemeenteRollen: ["BELEID"],
    }).success).toBe(false)
  })

  it("weigert leeg email", () => {
    expect(gemeenteGebruikerUitnodigingSchema.safeParse({
      email: "",
      gemeenteRollen: ["BELEID"],
    }).success).toBe(false)
  })
})
