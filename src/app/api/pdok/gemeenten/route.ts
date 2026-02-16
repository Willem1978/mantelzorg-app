import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { searchGemeenten } from "@/lib/pdok"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""

  if (q.length < 2) {
    return NextResponse.json({ gemeenten: [] })
  }

  const gemeenten = await searchGemeenten(q)
  return NextResponse.json({ gemeenten })
}
