import { NextRequest, NextResponse } from "next/server"
import { lookupLocation, extractMunicipalityOnly } from "@/lib/pdok"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { error: "ID is verplicht" },
      { status: 400 }
    )
  }

  try {
    const address = await lookupLocation(id)

    if (!address) {
      return NextResponse.json(
        { error: "Locatie niet gevonden" },
        { status: 404 }
      )
    }

    // Privacy: alleen gemeente info retourneren, niet het exacte adres
    const municipality = extractMunicipalityOnly(address)

    return NextResponse.json({ municipality })
  } catch (error) {
    console.error("Location lookup error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het opzoeken" },
      { status: 500 }
    )
  }
}
