import { describe, it, expect } from "vitest"
import { ApiErrors, apiSuccess } from "../api-response"

describe("ApiErrors", () => {
  it("unauthorized geeft 401 status", () => {
    const res = ApiErrors.unauthorized()
    expect(res.status).toBe(401)
  })

  it("unauthorized bevat standaard bericht", async () => {
    const res = ApiErrors.unauthorized()
    const body = await res.json()
    expect(body.error).toBe("Niet ingelogd")
  })

  it("unauthorized accepteert custom bericht", async () => {
    const res = ApiErrors.unauthorized("Sessie verlopen")
    const body = await res.json()
    expect(body.error).toBe("Sessie verlopen")
  })

  it("forbidden geeft 403 status", () => {
    expect(ApiErrors.forbidden().status).toBe(403)
  })

  it("notFound geeft 404 status", () => {
    expect(ApiErrors.notFound().status).toBe(404)
  })

  it("badRequest geeft 400 status", () => {
    expect(ApiErrors.badRequest().status).toBe(400)
  })

  it("methodNotAllowed geeft 405 status", () => {
    expect(ApiErrors.methodNotAllowed().status).toBe(405)
  })

  it("conflict geeft 409 status", () => {
    expect(ApiErrors.conflict().status).toBe(409)
  })

  it("internal geeft 500 status", () => {
    expect(ApiErrors.internal().status).toBe(500)
  })
})

describe("apiSuccess", () => {
  it("geeft 200 status standaard", () => {
    const res = apiSuccess({ ok: true })
    expect(res.status).toBe(200)
  })

  it("accepteert custom status", () => {
    const res = apiSuccess({ created: true }, 201)
    expect(res.status).toBe(201)
  })

  it("bevat data in body", async () => {
    const res = apiSuccess({ naam: "Test" })
    const body = await res.json()
    expect(body.naam).toBe("Test")
  })
})
