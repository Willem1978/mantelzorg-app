import { describe, it, expect } from "vitest"
import { sanitizeHtml, sanitizeText } from "../sanitize"

describe("sanitizeHtml", () => {
  it("staat veilige tags toe", () => {
    const input = "<strong>vet</strong> en <em>cursief</em>"
    expect(sanitizeHtml(input)).toBe(input)
  })

  it("staat <a> met href toe", () => {
    const input = '<a href="https://example.com" target="_blank" rel="noopener">link</a>'
    expect(sanitizeHtml(input)).toContain('href="https://example.com"')
  })

  it("verwijdert script tags", () => {
    const input = '<script>alert("xss")</script>Hallo'
    expect(sanitizeHtml(input)).toBe("Hallo")
  })

  it("verwijdert onclick handlers", () => {
    const input = '<p onclick="alert(1)">tekst</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain("onclick")
    expect(result).toContain("tekst")
  })

  it("verwijdert img tags", () => {
    const input = '<img src="x" onerror="alert(1)">tekst'
    expect(sanitizeHtml(input)).toBe("tekst")
  })

  it("verwijdert iframe tags", () => {
    const input = '<iframe src="https://evil.com"></iframe>veilig'
    expect(sanitizeHtml(input)).toBe("veilig")
  })

  it("staat <br>, <p>, <ul>, <ol>, <li> toe", () => {
    const input = "<p>tekst</p><br><ul><li>item</li></ul><ol><li>nummer</li></ol>"
    expect(sanitizeHtml(input)).toBe(input)
  })

  it("staat <span> met class toe", () => {
    const input = '<span class="highlight">tekst</span>'
    expect(sanitizeHtml(input)).toContain('class="highlight"')
  })

  it("verwijdert style attributen", () => {
    const input = '<p style="color:red">tekst</p>'
    expect(sanitizeHtml(input)).not.toContain("style")
  })
})

describe("sanitizeText", () => {
  it("verwijdert alle HTML tags", () => {
    const input = "<strong>vet</strong> en <em>cursief</em>"
    expect(sanitizeText(input)).toBe("vet en cursief")
  })

  it("verwijdert script tags en inhoud", () => {
    const input = '<script>alert("xss")</script>Hallo'
    expect(sanitizeText(input)).toBe("Hallo")
  })

  it("behoudt plain text", () => {
    const input = "Gewone tekst zonder HTML"
    expect(sanitizeText(input)).toBe(input)
  })

  it("verwijdert geneste HTML", () => {
    const input = "<div><p><strong>diep genest</strong></p></div>"
    expect(sanitizeText(input)).toBe("diep genest")
  })
})
