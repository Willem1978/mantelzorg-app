import { describe, it, expect } from "vitest"
import { prioritizeUnshown, toKeySet, shuffle } from "../variation"

describe("toKeySet", () => {
  it("normaliseert keys: lowercase + trim", () => {
    const set = toKeySet(["  Arnhem ", "ZUTPHEN", "arnhem"])
    expect(set.has("arnhem")).toBe(true)
    expect(set.has("zutphen")).toBe(true)
    expect(set.size).toBe(2) // dedupliceert "arnhem" / "Arnhem"
  })

  it("retourneert lege set bij undefined of leeg", () => {
    expect(toKeySet(undefined).size).toBe(0)
    expect(toKeySet([]).size).toBe(0)
  })
})

describe("prioritizeUnshown", () => {
  it("zet ongetoonde items voor getoonde items", () => {
    const items = [
      { naam: "Stichting A" },
      { naam: "Stichting B" },
      { naam: "Stichting C" },
    ]
    const shown = toKeySet(["Stichting A"])
    const result = prioritizeUnshown(items, (i) => i.naam, shown)
    // A moet achteraan staan, B en C voor (volgorde tussen B/C is gerandomiseerd)
    expect(result[result.length - 1].naam).toBe("Stichting A")
    expect(result.slice(0, 2).map((r) => r.naam).sort()).toEqual(["Stichting B", "Stichting C"])
  })

  it("retourneert geshuffeld als niets eerder getoond is", () => {
    const items = [{ naam: "X" }, { naam: "Y" }, { naam: "Z" }]
    const result = prioritizeUnshown(items, (i) => i.naam, toKeySet([]))
    expect(result.length).toBe(3)
    // Elk item komt precies één keer voor
    expect(new Set(result.map((r) => r.naam))).toEqual(new Set(["X", "Y", "Z"]))
  })
})

describe("shuffle", () => {
  it("retourneert een nieuwe array met dezelfde items", () => {
    const input = [1, 2, 3, 4, 5]
    const out = shuffle(input)
    expect(out).not.toBe(input) // niet dezelfde referentie
    expect(out.sort()).toEqual([1, 2, 3, 4, 5])
  })
})
