/**
 * Dynamisch hulpadvies op basis van balanstest score en zorgtaken.
 * Genereert persoonlijke, B1-niveau adviezen.
 */

export interface Advies {
  id: string
  titel: string
  tekst: string
  emoji: string
  prioriteit: "hoog" | "gemiddeld" | "laag"
  link?: string
  linkTekst?: string
}

interface AdviesInput {
  belastingNiveau: "LAAG" | "GEMIDDELD" | "HOOG" | null
  score: number | null
  trend: "improved" | "same" | "worse" | null
  zwareTaken: string[]
  wellbeingTrend: "up" | "down" | "stable" | null
  daysSinceTest: number | null
  hasCheckIn: boolean
}

export function genereerAdvies(input: AdviesInput): Advies[] {
  const adviezen: Advies[] = []

  // Advies op basis van belastingniveau
  if (input.belastingNiveau === "HOOG") {
    adviezen.push({
      id: "hoog-hulp",
      titel: "Vraag hulp",
      tekst: "Je hebt veel op je bordje. Je hoeft het niet alleen te doen. Bel de Mantelzorglijn (030 - 205 90 59) of vraag hulp bij je gemeente.",
      emoji: "🆘",
      prioriteit: "hoog",
      link: "tel:0302059059",
      linkTekst: "Bel de Mantelzorglijn",
    })

    adviezen.push({
      id: "hoog-respijt",
      titel: "Neem pauze",
      tekst: "Respijtzorg kan je even ontlasten. Een dagopvang of tijdelijke vervanging geeft je rust. Vraag ernaar bij je gemeente.",
      emoji: "🛏️",
      prioriteit: "hoog",
      link: "/hulpvragen?tab=voor-mij",
      linkTekst: "Zoek respijtzorg",
    })
  }

  if (input.belastingNiveau === "GEMIDDELD") {
    adviezen.push({
      id: "gemiddeld-balans",
      titel: "Houd je balans in de gaten",
      tekst: "Je doet al veel. Probeer elke week iets voor jezelf te doen. Een wandeling, een kopje koffie met een vriend, of gewoon even rust.",
      emoji: "⚖️",
      prioriteit: "gemiddeld",
    })

    if (input.zwareTaken.length > 0) {
      adviezen.push({
        id: "gemiddeld-taken",
        titel: "Verdeel zware taken",
        tekst: `Je vindt ${input.zwareTaken.slice(0, 2).join(" en ")} zwaar. Kun je iemand vragen om te helpen? Familie, buren of vrijwilligers kunnen bijspringen.`,
        emoji: "🤝",
        prioriteit: "gemiddeld",
        link: "/hulpvragen?tab=voor-naaste",
        linkTekst: "Zoek hulp bij taken",
      })
    }
  }

  if (input.belastingNiveau === "LAAG") {
    adviezen.push({
      id: "laag-goed",
      titel: "Goed bezig!",
      tekst: "Je balans is goed. Blijf goed voor jezelf zorgen. Houd bij hoe het gaat met de maandelijkse check-in.",
      emoji: "💚",
      prioriteit: "laag",
    })
  }

  // Advies op basis van trend
  if (input.trend === "worse") {
    adviezen.push({
      id: "trend-slechter",
      titel: "Je score is gestegen",
      tekst: "Je belasting is hoger dan vorige keer. Neem dit serieus. Kijk of je ergens hulp bij kunt krijgen.",
      emoji: "📈",
      prioriteit: "hoog",
      link: "/hulpvragen",
      linkTekst: "Zoek hulp",
    })
  }

  if (input.trend === "improved") {
    adviezen.push({
      id: "trend-beter",
      titel: "Het gaat de goede kant op",
      tekst: "Je score is verbeterd. Wat je doet werkt. Ga zo door!",
      emoji: "📉",
      prioriteit: "laag",
    })
  }

  // Advies op basis van wellbeing trend
  if (input.wellbeingTrend === "down") {
    adviezen.push({
      id: "wellbeing-daling",
      titel: "Je voelt je minder goed",
      tekst: "Je check-ins laten zien dat het minder gaat. Praat erover met iemand die je vertrouwt. Of bel de Mantelzorglijn.",
      emoji: "💬",
      prioriteit: "gemiddeld",
    })
  }

  // Advies als test te oud is
  if (input.daysSinceTest && input.daysSinceTest > 90) {
    adviezen.push({
      id: "test-verouderd",
      titel: "Doe een nieuwe balanstest",
      tekst: "Je laatste test is meer dan 3 maanden geleden. Doe een nieuwe test om te kijken hoe het nu met je gaat.",
      emoji: "📊",
      prioriteit: "gemiddeld",
      link: "/belastbaarheidstest",
      linkTekst: "Start de balanstest",
    })
  }

  // Check-in herinnering
  if (!input.hasCheckIn) {
    adviezen.push({
      id: "checkin-reminder",
      titel: "Doe een check-in",
      tekst: "Hoe gaat het deze week? Een korte check-in helpt je om bij te houden hoe het gaat.",
      emoji: "✅",
      prioriteit: "laag",
      link: "/check-in",
      linkTekst: "Doe de check-in",
    })
  }

  // Sorteer op prioriteit
  const prioriteitVolgorde = { hoog: 0, gemiddeld: 1, laag: 2 }
  adviezen.sort((a, b) => prioriteitVolgorde[a.prioriteit] - prioriteitVolgorde[b.prioriteit])

  return adviezen
}
