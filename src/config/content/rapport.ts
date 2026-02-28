/**
 * Rapport / resultaten pagina teksten (/rapport).
 */

export const rapportContent = {
  header: {
    greeting: (voornaam: string) => `Hoi ${voornaam}`,
    resultatenVan: (datum: string) => `Je resultaten van ${datum}`,
  },

  laden: "Laden...",

  fouten: {
    geenResultaten: "Geen resultaten",
    geenTest: "Je hebt nog geen test gedaan.",
    nietIngelogd: "Log eerst in om je resultaten te bekijken.",
    algemeenFout: "Oeps, dat lukte niet. Probeer het later opnieuw.",
    laadFout: "Oeps, dat lukte niet. Probeer het later opnieuw.",
  },

  geenTest: {
    title: "Doe eerst de balanstest.",
    subtitle: "Dan zie je hier je resultaten en tips die bij je passen.",
    button: "Start de Balanstest",
  },

  niveaus: {
    HOOG: {
      title: "Het is te zwaar",
      subtitle: "Dit is niet vol te houden. Je hebt nu hulp nodig.",
      acties: {
        title: "Dit moet je nu doen",
        huisarts: {
          title: "Bel je huisarts",
          beschrijving: "Maak een afspraak om je situatie te bespreken",
        },
        gemeente: {
          titleFn: (gemeente: string) => `Mantelzorgondersteuner ${gemeente}`,
          titleFallback: "Mantelzorgondersteuner gemeente",
          beschrijving: "Gratis hulp vanuit je gemeente",
        },
        mantelzorglijn: {
          title: "Mantelzorglijn",
          beschrijving: "030 - 205 90 59 (ma-vr, gratis)",
        },
      },
      takenTitle: "Deze taken moet je loslaten",
      takenSubtitleFn: (uren: number) =>
        `Je besteedt ${uren} uur per week aan zorgtaken. Dat is te veel.`,
      takenHint: "Klik op een taak om hulpbronnen te bekijken",
    },

    GEMIDDELD: {
      title: "Je balans staat onder druk",
      subtitle: "Zo doorgaan is niet houdbaar. Kijk welke taken je kunt overdragen.",
      zorgtijdFn: (uren: number) => `${uren} uur per week`,
      zorgtijdSuffix: " is veel. Probeer taken te delen met anderen.",
      takenTitle: "Hier kun je hulp bij krijgen",
      takenHint: "Klik op een taak om hulpbronnen te bekijken →",
      vindHulp: "Vind hulp",
      steunpunt: {
        title: "Steunpunt Mantelzorg",
        beschrijving: "Gratis advies en ondersteuning",
      },
      wmoFn: (gemeente: string) => `WMO loket ${gemeente}`,
      wmoBeschrijving: "Vraag hulp aan bij de gemeente",
    },

    LAAG: {
      title: "Goed bezig!",
      subtitle: "Je hebt een goede balans. Blijf goed voor jezelf zorgen.",
      letOpTaakFn: (count: number) => `Let op ${count === 1 ? "deze taak" : "deze taken"}`,
      letOpSubtitleFn: (count: number) =>
        `Je ervaart ${count === 1 ? "deze taak" : "deze taken"} als zwaar. Hier kun je hulp bij krijgen:`,
      zorgtaken: "Jouw zorgtaken",
      balansTitle: "Houd je balans vast",
      tips: [
        { emoji: "💚", tekst: "Plan elke dag iets leuks voor jezelf" },
        { emoji: "🔄", tekst: "Doe deze test elke 3 maanden om je balans te checken" },
        { emoji: "🤝", tekst: "Vraag hulp voordat je het nodig hebt" },
      ],
    },
  },

  opnieuw: "Doe de test opnieuw",

  // Hulptips per taak
  hulpTips: {
    t1: "Thuiszorg kan helpen met wassen, aankleden en andere persoonlijke verzorging.",
    t2: "Huishoudelijke hulp kun je aanvragen via de WMO van je gemeente.",
    t3: "Een apotheek kan medicijnen in weekdozen klaarzetten. Thuiszorg kan toezien op inname.",
    t4: "De gemeente kan aangepast vervoer regelen (Regiotaxi, WMO-vervoer).",
    t5: "Vraag bij je gemeente naar vrijwillige hulp bij administratie en formulieren.",
    t6: "Dagbesteding of vrijwilligers kunnen voor gezelschap zorgen.",
    t7: "Vervangende mantelzorg of dagopvang kan toezicht overnemen zodat jij even rust hebt.",
    t8: "Thuiszorg of wijkverpleging kan medische handelingen overnemen.",
    t9: "Vrijwilligers of een klussenbus kunnen helpen met klussen in huis.",
    default: "Vraag bij je gemeente naar hulpmogelijkheden.",
  } as Record<string, string>,
} as const
