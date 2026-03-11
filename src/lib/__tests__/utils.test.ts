import { describe, it, expect } from "vitest"
import { ensureAbsoluteUrl, getErrorMessage } from "../utils"

describe("ensureAbsoluteUrl", () => {
  it("retourneert lege string voor null", () => {
    expect(ensureAbsoluteUrl(null)).toBe("")
  })

  it("retourneert lege string voor undefined", () => {
    expect(ensureAbsoluteUrl(undefined)).toBe("")
  })

  it("retourneert lege string voor lege string", () => {
    expect(ensureAbsoluteUrl("")).toBe("")
  })

  it("behoudt http:// URL", () => {
    expect(ensureAbsoluteUrl("http://example.com")).toBe("http://example.com")
  })

  it("behoudt https:// URL", () => {
    expect(ensureAbsoluteUrl("https://example.com")).toBe("https://example.com")
  })

  it("behoudt relatieve URL met /", () => {
    expect(ensureAbsoluteUrl("/pad/naar/pagina")).toBe("/pad/naar/pagina")
  })

  it("voegt https:// toe aan kale domeinnaam", () => {
    expect(ensureAbsoluteUrl("example.com")).toBe("https://example.com")
  })

  it("voegt https:// toe aan www. URL", () => {
    expect(ensureAbsoluteUrl("www.example.com")).toBe("https://www.example.com")
  })
})

describe("getErrorMessage", () => {
  it("retourneert message van Error object", () => {
    expect(getErrorMessage(new Error("fout!"))).toBe("fout!")
  })

  it("retourneert string direct", () => {
    expect(getErrorMessage("een fout")).toBe("een fout")
  })

  it("retourneert fallback voor onbekend type", () => {
    expect(getErrorMessage(42)).toBe("Er ging iets mis")
  })

  it("retourneert fallback voor null", () => {
    expect(getErrorMessage(null)).toBe("Er ging iets mis")
  })

  it("retourneert fallback voor undefined", () => {
    expect(getErrorMessage(undefined)).toBe("Er ging iets mis")
  })
})
