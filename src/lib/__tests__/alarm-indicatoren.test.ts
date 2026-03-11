import { describe, it, expect } from "vitest"
import { checkAlarmindicatoren } from "../alarm-indicatoren"

describe("checkAlarmindicatoren", () => {
  it("detecteert hoge belasting bij score >= 13", () => {
    const alarmen = checkAlarmindicatoren({}, 13)
    expect(alarmen).toContainEqual(
      expect.objectContaining({ type: "HOGE_BELASTING", urgentie: "HIGH" })
    )
  })

  it("geeft geen hoge belasting bij score < 13", () => {
    const alarmen = checkAlarmindicatoren({}, 12)
    expect(alarmen.find(a => a.type === "HOGE_BELASTING")).toBeUndefined()
  })

  it("detecteert burn-out risico bij slaap + fysiek + emotie", () => {
    const antwoorden = { q1: "ja", q2: "ja", q4: "ja" }
    const alarmen = checkAlarmindicatoren(antwoorden, 0)
    expect(alarmen).toContainEqual(
      expect.objectContaining({ type: "KRITIEKE_COMBINATIE", urgentie: "CRITICAL" })
    )
  })

  it("geen burn-out risico als één factor ontbreekt", () => {
    const antwoorden = { q1: "ja", q2: "ja", q4: "nee" }
    const alarmen = checkAlarmindicatoren(antwoorden, 0)
    expect(alarmen.find(a => a.type === "KRITIEKE_COMBINATIE")).toBeUndefined()
  })

  it("detecteert energie uitputting bij q7 + q11 ja", () => {
    const antwoorden = { q7: "ja", q11: "ja" }
    const alarmen = checkAlarmindicatoren(antwoorden, 0)
    expect(alarmen).toContainEqual(
      expect.objectContaining({ type: "EMOTIONELE_NOOD", urgentie: "HIGH" })
    )
  })

  it("detecteert sociaal isolement bij q10 + q6 ja", () => {
    const antwoorden = { q10: "ja", q6: "ja" }
    const alarmen = checkAlarmindicatoren(antwoorden, 0)
    expect(alarmen).toContainEqual(
      expect.objectContaining({ type: "SOCIAAL_ISOLEMENT", urgentie: "MEDIUM" })
    )
  })

  it("retourneert meerdere alarmen bij combinatie", () => {
    const antwoorden = { q1: "ja", q2: "ja", q4: "ja", q7: "ja", q11: "ja" }
    const alarmen = checkAlarmindicatoren(antwoorden, 15)
    expect(alarmen.length).toBeGreaterThanOrEqual(3)
  })

  it("retourneert lege array als alles goed is", () => {
    const antwoorden = { q1: "nee", q2: "nee", q4: "nee" }
    const alarmen = checkAlarmindicatoren(antwoorden, 5)
    expect(alarmen).toEqual([])
  })

  it("negeert 'soms' antwoorden voor combinatie-checks", () => {
    const antwoorden = { q1: "soms", q2: "ja", q4: "ja" }
    const alarmen = checkAlarmindicatoren(antwoorden, 0)
    expect(alarmen.find(a => a.type === "KRITIEKE_COMBINATIE")).toBeUndefined()
  })
})
