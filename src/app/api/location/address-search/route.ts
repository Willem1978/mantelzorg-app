import { NextRequest, NextResponse } from "next/server"
import { searchAddresses } from "@/lib/pdok"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query || query.length < 3) {
    return NextResponse.json({ addresses: [] })
  }

  try {
    const addresses = await searchAddresses(query)
    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("Address search error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het zoeken" },
      { status: 500 }
    )
  }
}
