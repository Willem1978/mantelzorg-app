import { describe, it, expect } from "vitest"
import { profielSchema } from "../validations"

describe("profielSchema", () => {
  it("accepteert leeg object (alles optioneel)", () => {
    expect(profielSchema.safeParse({}).success).toBe(true)
  })

  it("accepteert volledig profiel", () => {
    const result = profielSchema.safeParse({
      naam: "Jan Jansen",
      straat: "Kerkstraat 1",
      woonplaats: "Zutphen",
      postcode: "7200 AA",
      gemeente: "Zutphen",
      wijk: "Centrum",
      naasteNaam: "Marie Jansen",
      naasteRelatie: "Moeder",
      telefoon: "0612345678",
    })
    expect(result.success).toBe(true)
  })

  it("weigert te lange naam", () => {
    const result = profielSchema.safeParse({
      naam: "a".repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it("weigert te lange straat", () => {
    const result = profielSchema.safeParse({
      straat: "a".repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it("weigert te lang telefoonnummer", () => {
    const result = profielSchema.safeParse({
      telefoon: "0".repeat(21),
    })
    expect(result.success).toBe(false)
  })
})
