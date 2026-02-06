import { NextRequest, NextResponse } from "next/server"
import { searchStreets } from "@/lib/pdok"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json({ addresses: [] })
  }

  try {
    // Zoek straten (zonder huisnummers) voor privacy
    const streets = await searchStreets(query)
    return NextResponse.json({ addresses: streets })
  } catch (error) {
    console.error("Street search error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het zoeken" },
      { status: 500 }
    )
  }
}
