import { describe, it, expect } from "vitest"
import { artikelSchema } from "../validations"

describe("artikelSchema", () => {
  it("accepteert minimaal artikel", () => {
    const result = artikelSchema.safeParse({
      titel: "Test artikel",
      beschrijving: "Beschrijving",
      categorie: "praktische-tips",
    })
    expect(result.success).toBe(true)
  })

  it("accepteert volledig artikel", () => {
    const result = artikelSchema.safeParse({
      titel: "Veilig tillen",
      beschrijving: "Leer hoe je veilig tilt",
      inhoud: "Uitgebreide inhoud...",
      url: "https://example.com/artikel",
      bron: "MantelzorgNL",
      emoji: "💪",
      categorie: "praktische-tips",
      subHoofdstuk: "veiligheid-zware-taken",
      bronLabel: "Landelijk",
      type: "ARTIKEL",
      status: "GEPUBLICEERD",
      gemeente: "Zutphen",
      sorteerVolgorde: 1,
    })
    expect(result.success).toBe(true)
  })

  it("weigert lege titel", () => {
    expect(artikelSchema.safeParse({
      titel: "",
      beschrijving: "Beschrijving",
      categorie: "cat",
    }).success).toBe(false)
  })

  it("weigert lege beschrijving", () => {
    expect(artikelSchema.safeParse({
      titel: "Titel",
      beschrijving: "",
      categorie: "cat",
    }).success).toBe(false)
  })

  it("weigert lege categorie", () => {
    expect(artikelSchema.safeParse({
      titel: "Titel",
      beschrijving: "Beschrijving",
      categorie: "",
    }).success).toBe(false)
  })

  it("weigert ongeldig type", () => {
    expect(artikelSchema.safeParse({
      titel: "Titel",
      beschrijving: "Beschrijving",
      categorie: "cat",
      type: "ONGELDIG",
    }).success).toBe(false)
  })

  it("weigert ongeldige status", () => {
    expect(artikelSchema.safeParse({
      titel: "Titel",
      beschrijving: "Beschrijving",
      categorie: "cat",
      status: "VERWIJDERD",
    }).success).toBe(false)
  })

  it("weigert ongeldige URL", () => {
    expect(artikelSchema.safeParse({
      titel: "Titel",
      beschrijving: "Beschrijving",
      categorie: "cat",
      url: "geen-url",
    }).success).toBe(false)
  })

  it("accepteert lege URL string", () => {
    expect(artikelSchema.safeParse({
      titel: "Titel",
      beschrijving: "Beschrijving",
      categorie: "cat",
      url: "",
    }).success).toBe(true)
  })
})
