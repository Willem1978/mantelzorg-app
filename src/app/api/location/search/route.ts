import { NextRequest, NextResponse } from "next/server"
import { searchLocation } from "@/lib/pdok"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const suggestions = await searchLocation(query)
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Location search error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het zoeken" },
      { status: 500 }
    )
  }
}
