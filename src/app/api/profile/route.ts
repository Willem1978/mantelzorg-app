import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { validateBody } from "@/lib/validations"
import { findCaregiverId, getProfile, updateProfile } from "@/services/profiel.service"
import { createLogger } from "@/lib/logger"

const log = createLogger("api-profile")

const profileUpdateSchema = z.object({
  naam: z.string().max(200).optional(),
  telefoon: z.string().max(20).nullable().optional(),
  straat: z.string().max(200).optional(),
  woonplaats: z.string().max(100).optional(),
  postcode: z.string().max(7).optional(),
  gemeente: z.string().max(100).optional(),
  wijk: z.string().max(100).optional(),
  naasteNaam: z.string().max(200).optional(),
  naasteRelatie: z.string().max(100).optional(),
  naasteStraat: z.string().max(200).optional(),
  naasteWoonplaats: z.string().max(100).optional(),
  naasteGemeente: z.string().max(100).optional(),
  naasteWijk: z.string().max(100).optional(),
  woonsituatie: z.enum(["samen", "dichtbij", "op-afstand"]).nullable().optional(),
  werkstatus: z.enum(["fulltime", "parttime", "niet-werkend", "student", "gepensioneerd"]).nullable().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const caregiverId = await findCaregiverId(session.user.caregiverId, session.user.id)
    if (!caregiverId) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    const profile = await getProfile(caregiverId)
    if (!profile) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    log.error({ err: error }, "Profile GET error")
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const caregiverId = await findCaregiverId(session.user.caregiverId, session.user.id)
    if (!caregiverId) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    const rawBody = await request.json()
    const validation = validateBody(rawBody, profileUpdateSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const result = await updateProfile(caregiverId, session.user.id, validation.data)
    return NextResponse.json(result)
  } catch (error) {
    log.error({ err: error }, "Profile PUT error")
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
