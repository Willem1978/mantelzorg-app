import { describe, it, expect } from "vitest"
import { aiChatSchema } from "../validations"

describe("aiChatSchema", () => {
  it("accepteert geldig bericht", () => {
    const result = aiChatSchema.safeParse({
      messages: [{ role: "user", content: "Hallo Ger!" }],
    })
    expect(result.success).toBe(true)
  })

  it("accepteert meerdere berichten", () => {
    const result = aiChatSchema.safeParse({
      messages: [
        { role: "user", content: "Hallo" },
        { role: "assistant", content: "Hoi! Hoe kan ik je helpen?" },
        { role: "user", content: "Ik zoek hulp" },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("weigert lege messages array", () => {
    expect(aiChatSchema.safeParse({ messages: [] }).success).toBe(false)
  })

  it("weigert ongeldige role", () => {
    expect(aiChatSchema.safeParse({
      messages: [{ role: "admin", content: "test" }],
    }).success).toBe(false)
  })

  it("accepteert system role", () => {
    expect(aiChatSchema.safeParse({
      messages: [{ role: "system", content: "Je bent Ger" }],
    }).success).toBe(true)
  })

  it("weigert te lange content (> 10000 tekens)", () => {
    expect(aiChatSchema.safeParse({
      messages: [{ role: "user", content: "a".repeat(10001) }],
    }).success).toBe(false)
  })

  it("accepteert bericht met parts", () => {
    const result = aiChatSchema.safeParse({
      messages: [{ role: "user", parts: [{ type: "text", text: "Hallo" }] }],
    })
    expect(result.success).toBe(true)
  })
})
