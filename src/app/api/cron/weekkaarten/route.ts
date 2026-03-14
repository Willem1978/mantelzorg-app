import { NextResponse } from "next/server"
import { genereerWeekKaartenVoorIedereen } from "@/lib/weekkaarten/genereer-weekkaarten"

export const dynamic = "force-dynamic"

/**
 * GET /api/cron/weekkaarten — Wekelijkse generatie van hulpkaarten.
 * Bedoeld voor Vercel Cron (elke maandag).
 *
 * Beveiligd via CRON_SECRET header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await genereerWeekKaartenVoorIedereen()

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[CRON] Weekkaarten generatie mislukt:", error)
    return NextResponse.json(
      { error: "Generatie mislukt" },
      { status: 500 }
    )
  }
}
