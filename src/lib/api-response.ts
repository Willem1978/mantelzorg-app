import { NextResponse } from "next/server"

/**
 * Gestandaardiseerde API error responses.
 * Gebruik: return ApiErrors.unauthorized() in API routes.
 */
export const ApiErrors = {
  unauthorized: (message = "Niet ingelogd") =>
    NextResponse.json({ error: message }, { status: 401 }),

  forbidden: (message = "Geen toegang") =>
    NextResponse.json({ error: message }, { status: 403 }),

  notFound: (message = "Niet gevonden") =>
    NextResponse.json({ error: message }, { status: 404 }),

  badRequest: (message = "Ongeldig verzoek") =>
    NextResponse.json({ error: message }, { status: 400 }),

  methodNotAllowed: (message = "Methode niet toegestaan") =>
    NextResponse.json({ error: message }, { status: 405 }),

  conflict: (message = "Conflict") =>
    NextResponse.json({ error: message }, { status: 409 }),

  internal: (message = "Interne serverfout") =>
    NextResponse.json({ error: message }, { status: 500 }),
}

/**
 * Gestandaardiseerde success response.
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}
