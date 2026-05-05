import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Geeft een gepersonaliseerde welkomst voor de chat met Ger.
 *
 * Niet via AI — server-side opgebouwd uit de laatste balanstest, zodat de
 * eerste indruk meteen relevant is en er direct een duidelijke keuze ligt:
 *   1. Hulp voor de mantelzorger zelf
 *   2. Hulp bij een taak die hij voor de zorgvrager doet
 *   3. Even praten over hoe het gaat
 *
 * Deze drie paden komen terug als zowel "keuzeTegels" (voor visuele weergave)
 * als "vraagknoppen" (compatibel met bestaande chip-UI).
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return defaultResponse()
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: {
      careRecipientName: true,
      belastbaarheidTests: {
        where: { isCompleted: true },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: {
          belastingNiveau: true,
          taakSelecties: {
            where: { isGeselecteerd: true },
            orderBy: { urenPerWeek: "desc" },
            take: 1,
            select: { taakNaam: true },
          },
        },
      },
    },
  })

  const naasteNaam = caregiver?.careRecipientName?.trim() || null
  const test = caregiver?.belastbaarheidTests?.[0] || null
  const zwaarsteTaak = test?.taakSelecties?.[0]?.taakNaam || null

  const begroeting = buildBegroeting(test?.belastingNiveau, naasteNaam, zwaarsteTaak)
  const keuzeTegels = buildKeuzeTegels(naasteNaam, zwaarsteTaak)
  const vraagknoppen = keuzeTegels.map((t) => t.actie)

  return NextResponse.json({
    opener: begroeting,
    heeftTest: !!test,
    naasteNaam,
    keuzeTegels,
    vraagknoppen,
  })
}

function defaultResponse() {
  return NextResponse.json({
    opener: "Hoi! Ik ben Ger. Vertel me wat je bezighoudt.",
    heeftTest: false,
    naasteNaam: null,
    keuzeTegels: [],
    vraagknoppen: [],
  })
}

function buildBegroeting(niveau: string | null | undefined, naasteNaam: string | null, zwaarsteTaak: string | null): string {
  // Geen test? Korte opening met uitnodiging.
  if (!niveau) {
    return "Hoi! Ik ben Ger. Fijn dat je er bent. Waar kan ik je vandaag mee helpen?"
  }

  if (niveau === "HOOG") {
    if (zwaarsteTaak && naasteNaam) {
      return `Fijn dat je er bent. Ik zie dat je flink wat doet voor ${naasteNaam} — waar kan ik je vandaag mee helpen?`
    }
    return "Fijn dat je er bent. Het is op dit moment best pittig — waar kan ik je vandaag mee helpen?"
  }

  if (niveau === "GEMIDDELD") {
    return "Goed dat je er bent. Waar kan ik je vandaag mee helpen?"
  }

  return "Goed dat je er bent. Het gaat eigenlijk best goed met je balans — knap! Waar kan ik je vandaag mee helpen?"
}

interface KeuzeTegel {
  emoji: string
  titel: string
  omschrijving: string
  /** De tekst die naar Ger wordt gestuurd als de gebruiker erop klikt. */
  actie: string
}

function buildKeuzeTegels(naasteNaam: string | null, zwaarsteTaak: string | null): KeuzeTegel[] {
  const naasteLabel = naasteNaam ? `voor ${naasteNaam}` : "voor mijn naaste"
  const taakHint = zwaarsteTaak ? `, zoals ${zwaarsteTaak.toLowerCase()}` : ""

  return [
    {
      emoji: "🧑",
      titel: "Hulp voor mij zelf",
      omschrijving: "Steunpunt, lotgenoten, even op adem komen, slaap of stress",
      actie: "Ik wil hulp voor mij zelf",
    },
    {
      emoji: "🤝",
      titel: `Hulp bij een taak ${naasteLabel}`,
      omschrijving: `Boodschappen, verzorging, vervoer, huishouden${taakHint}`,
      actie: zwaarsteTaak
        ? `Ik zoek hulp bij ${zwaarsteTaak.toLowerCase()} ${naasteLabel}`
        : `Ik zoek hulp bij een taak ${naasteLabel}`,
    },
    {
      emoji: "💬",
      titel: "Even praten over hoe het gaat",
      omschrijving: "Vertel hoe je je voelt, ik luister mee",
      actie: "Ik wil even vertellen hoe het met me gaat",
    },
  ]
}
