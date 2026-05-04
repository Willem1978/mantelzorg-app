import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { berekenDeelgebieden } from "@/lib/dashboard/deelgebieden"

/**
 * Geeft een gepersonaliseerde welkomstzin voor de chat met Ger.
 * Niet via AI — server-side opgebouwd uit de laatste balanstest, zodat de
 * eerste indruk meteen relevant is en de chat direct het juiste onderwerp
 * voorstelt.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({
      opener: "Hoi! Ik ben Ger. Vertel me wat je bezighoudt.",
      vraagknoppen: [],
    })
  }

  const test = await prisma.belastbaarheidTest.findFirst({
    where: { caregiver: { userId: session.user.id }, isCompleted: true },
    orderBy: { completedAt: "desc" },
    select: {
      belastingNiveau: true,
      antwoorden: { select: { vraagId: true, score: true, gewicht: true } },
      taakSelecties: {
        where: { isGeselecteerd: true },
        orderBy: { urenPerWeek: "desc" },
        take: 1,
        select: { taakNaam: true },
      },
    },
  })

  if (!test) {
    return NextResponse.json({
      opener:
        "Hoi! Ik ben Ger. We kennen elkaar nog niet — wil je eerst de balanstest doen? " +
        "Dan weet ik beter hoe ik je kan helpen. Of vertel meteen wat er speelt.",
      vraagknoppen: [
        "Ik wil de balanstest doen",
        "Ik wil eerst even praten",
        "Welke hulp is er bij mij in de buurt?",
      ],
    })
  }

  const deelgebieden = berekenDeelgebieden(
    test.antwoorden.map((a) => ({ vraagId: a.vraagId, score: a.score, gewicht: a.gewicht })),
  )
  const zwaarste = [...deelgebieden].sort((a, b) => b.percentage - a.percentage)[0]
  const zwaarsteTaak = test.taakSelecties[0]?.taakNaam

  let opener: string
  let vraagknoppen: string[]

  if (test.belastingNiveau === "HOOG") {
    opener = zwaarste
      ? `Fijn dat je er bent. Ik zie dat ${zwaarste.naam.toLowerCase()} op dit moment het meeste van je vraagt. Zal ik daar mee beginnen?`
      : "Fijn dat je er bent. Ik zie dat het pittig is op dit moment. Waar wil je het over hebben?"
    vraagknoppen = [
      zwaarste ? `Vertel meer over ${zwaarste.naam.toLowerCase()}` : "Hoe gaat het met mij?",
      "Welke hulp kan mij ontlasten?",
      "Ik wil het over iets anders hebben",
    ]
  } else if (test.belastingNiveau === "GEMIDDELD") {
    opener = zwaarsteTaak
      ? `Goed dat je er bent. ${zwaarsteTaak} kost je relatief veel tijd — wil je kijken hoe dat lichter kan?`
      : "Goed dat je er bent. Waar zou ik je vandaag mee kunnen helpen?"
    vraagknoppen = [
      zwaarsteTaak ? `Hulp bij ${zwaarsteTaak.toLowerCase()}` : "Welke hulp is er in de buurt?",
      "Tips voor mezelf",
      "Hoe gaat het met mij?",
    ]
  } else {
    opener =
      "Goed dat je er bent. Het gaat eigenlijk best goed met je balans — knap! " +
      "Wat houdt je vandaag bezig?"
    vraagknoppen = [
      "Tips om het zo te houden",
      "Iets over mezelf vertellen",
      "Welke hulp is er in de buurt?",
    ]
  }

  return NextResponse.json({ opener, vraagknoppen })
}
