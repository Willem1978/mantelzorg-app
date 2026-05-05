import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Logt een klik op een AI-suggestie (hulpkaart of artikelkaart) zodat we
 * later kunnen ranken welke suggesties echt nuttig blijken voor mantelzorgers.
 *
 * Body: { type: "HULP" | "ARTIKEL", itemKey: string, categorie?: string, titel?: string, saved?: boolean }
 *
 * Niet-blocking: errors worden gelogd maar veroorzaken geen 500 zodat een
 * misgaande analytics-call de UX niet stuk maakt.
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const data = body as {
    type?: string
    itemKey?: string
    categorie?: string
    titel?: string
    saved?: boolean
  }

  if (!data.type || !data.itemKey) {
    return NextResponse.json({ ok: false, error: "type en itemKey zijn verplicht" }, { status: 400 })
  }
  if (data.type !== "HULP" && data.type !== "ARTIKEL" && data.type !== "VRAAGKNOP") {
    return NextResponse.json(
      { ok: false, error: "type moet HULP, ARTIKEL of VRAAGKNOP zijn" },
      { status: 400 },
    )
  }

  let userId: string | null = null
  try {
    const session = await auth()
    userId = session?.user?.id || null
  } catch {
    // Anonieme klikken (welkom-chat) ook loggen — geen blocker
  }

  try {
    await prisma.aiSuggestieClick.create({
      data: {
        userId,
        type: data.type,
        itemKey: data.itemKey.slice(0, 200),
        categorie: data.categorie?.slice(0, 100) || null,
        titel: data.titel?.slice(0, 200) || null,
        saved: !!data.saved,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    // Niet doorvallen naar 500: logging-fout mag geen UX-fout worden
    console.error("[suggestie-klik] log mislukt:", error)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
