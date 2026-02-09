// Alle informatieartikelen voor de Leren & Tips sectie
// Geschreven in B1 Nederlands, ouderenvriendelijk

export interface Artikel {
  id: string
  titel: string
  beschrijving: string
  url: string
  bron: string // Naam van de bron (bijv. "MantelzorgNL")
  emoji: string
}

export interface GemeenteNieuws {
  id: string
  titel: string
  beschrijving: string
  gemeente: string // Naam gemeente
  datum: string // ISO date string
  url?: string
  emoji: string
}

export const artikelen: Record<string, Artikel[]> = {
  "praktische-tips": [
    {
      id: "pt-1",
      titel: "Veilig tillen en verplaatsen",
      beschrijving:
        "Leer hoe je iemand veilig helpt bij het opstaan of verplaatsen. Gebruik hulpmiddelen zoals een tillift of glijzeil. Zo voorkom je rugklachten.",
      url: "https://www.hulpmiddelenwijzer.nl/activiteit/verzorgen/helpen-bij-verplaatsen",
      bron: "Hulpmiddelenwijzer",
      emoji: "🏋️",
    },
    {
      id: "pt-2",
      titel: "Tips voor veilig medicijngebruik",
      beschrijving:
        "Als mantelzorger help je vaak met medicijnen. Neem altijd het medicijnoverzicht mee naar de dokter. Let op veranderingen zoals sufheid of verwardheid.",
      url: "https://www.zorgvoorbeter.nl/tips-tools/tips/6-tips-voor-mantelzorgers-voor-veilig-medicijngebruik",
      bron: "Zorg voor Beter",
      emoji: "💊",
    },
    {
      id: "pt-3",
      titel: "Dagstructuur bij dementie",
      beschrijving:
        "Een vaste dagindeling geeft rust voor iemand met dementie. Begin vroeg met dagbesteding. Het geeft structuur en jij hebt even tijd voor jezelf.",
      url: "https://www.dementie.nl/zorg-en-regelzaken/zorg-en-hulp-voor-thuis/dagbesteding-voor-je-naaste-met-dementie",
      bron: "Dementie.nl",
      emoji: "📅",
    },
    {
      id: "pt-4",
      titel: "Communiceren met je naaste",
      beschrijving:
        "Praten wordt soms moeilijker. Gebruik korte zinnen, maak oogcontact en geef de tijd om te antwoorden. Geduld en begrip maken een groot verschil.",
      url: "https://www.dementie.nl/lichamelijke-veranderingen/praten-en-horen/tien-tips-voor-betere-communicatie-bij-dementie",
      bron: "Dementie.nl",
      emoji: "💬",
    },
    {
      id: "pt-5",
      titel: "Samenwerken met de thuiszorg",
      beschrijving:
        "Maak goede afspraken met de thuiszorg of het verpleeghuis. Bespreek het zorgplan en maak een zorgrooster. Zo weet iedereen wie wat doet.",
      url: "https://www.mantelzorg.nl/onderwerpen/zorg/je-naaste-in-een-zorgorganisatie-8-tips/",
      bron: "MantelzorgNL",
      emoji: "🤝",
    },
  ],

  "zelfzorg": [
    {
      id: "zz-1",
      titel: "Herken overbelasting op tijd",
      beschrijving:
        "Mantelzorg kan zwaar zijn. Let op signalen zoals slecht slapen, prikkelbaar zijn of je somber voelen. Neem het serieus en zoek hulp als het te veel wordt.",
      url: "https://www.mantelzorg.nl/onderwerpen/balans/overbelasting-en-mantelzorg/",
      bron: "MantelzorgNL",
      emoji: "⚠️",
    },
    {
      id: "zz-2",
      titel: "Grenzen stellen als mantelzorger",
      beschrijving:
        "Je wilt graag helpen, maar je kunt niet alles doen. Gezonde grenzen zijn nodig om het vol te houden. Leer hoe je nee zegt zonder je schuldig te voelen.",
      url: "https://www.mantelzorg.nl/onderwerpen/balans/mantelzorgen-met-gezonde-grenzen/",
      bron: "MantelzorgNL",
      emoji: "🛑",
    },
    {
      id: "zz-3",
      titel: "Respijtzorg: even vrij van zorgen",
      beschrijving:
        "Geef de zorg tijdelijk aan iemand anders. Dat heet respijtzorg. Denk aan dagopvang, een logeerhuis of een vrijwilliger aan huis. Zo heb jij even rust.",
      url: "https://www.mantelzorg.nl/pro/onderwerpen/mantelzorgondersteuning/vervangende-zorg-of-respijtzorg/",
      bron: "MantelzorgNL",
      emoji: "🌿",
    },
    {
      id: "zz-4",
      titel: "Werk en mantelzorg combineren",
      beschrijving:
        "Veel mantelzorgers werken ook. Praat erover met je werkgever. Vaak is er meer mogelijk dan je denkt, zoals thuiswerken of aangepaste werktijden.",
      url: "https://www.mantelzorg.nl/onderwerpen/werk/werkende-mantelzorgers-valkuilen-en-tips/",
      bron: "MantelzorgNL",
      emoji: "💼",
    },
    {
      id: "zz-5",
      titel: "De Mantelzorglijn: praat met iemand",
      beschrijving:
        "Heb je vragen of wil je je verhaal kwijt? Bel de Mantelzorglijn op 030 760 60 55. Je kunt ook WhatsAppen of mailen. Ze staan voor je klaar.",
      url: "https://www.mantelzorg.nl/onderwerpen/ondersteuning/mantelzorglijn-voor-al-je-vragen-over-mantelzorg/",
      bron: "MantelzorgNL",
      emoji: "📞",
    },
  ],

  "rechten": [
    {
      id: "re-1",
      titel: "De Wmo: hulp via je gemeente",
      beschrijving:
        "Via de Wet maatschappelijke ondersteuning (Wmo) kun je hulp krijgen van je gemeente. Denk aan huishoudelijke hulp, vervoer of aanpassingen in huis.",
      url: "https://www.mantelzorg.nl/onderwerpen/wetten/wmo-en-mantelzorg/",
      bron: "MantelzorgNL",
      emoji: "🏛️",
    },
    {
      id: "re-2",
      titel: "Mantelzorg is altijd vrijwillig",
      beschrijving:
        "De gemeente mag je niet verplichten om mantelzorg te geven. Je mag altijd nee zeggen. Vraag de gemeente dan om een andere oplossing te zoeken.",
      url: "https://www.mantelzorg.nl/onderwerpen/wetten/rechten-en-plichten-van-de-mantelzorger/",
      bron: "MantelzorgNL",
      emoji: "✋",
    },
    {
      id: "re-3",
      titel: "Recht op zorgverlof van je werk",
      beschrijving:
        "Als werknemer heb je recht op kortdurend zorgverlof (70% loon) en langdurend zorgverlof (onbetaald). Je werkgever mag dit alleen weigeren bij ernstige bedrijfsproblemen.",
      url: "https://www.rijksoverheid.nl/onderwerpen/zorgverlof",
      bron: "Rijksoverheid",
      emoji: "📋",
    },
    {
      id: "re-4",
      titel: "Het keukentafelgesprek",
      beschrijving:
        "De gemeente nodigt je uit voor een gesprek over de zorg. Dit heet het keukentafelgesprek. Ga er altijd bij zitten, want het gaat ook over hulp aan jou.",
      url: "https://www.rijksoverheid.nl/onderwerpen/mantelzorg/vraag-en-antwoord/hoe-kan-ik-als-mantelzorger-hulp-bij-de-zorg-krijgen",
      bron: "Rijksoverheid",
      emoji: "☕",
    },
    {
      id: "re-5",
      titel: "Recht op respijtzorg",
      beschrijving:
        "Je hebt recht op tijdelijke vervanging van de zorg. Dit kan via de Wmo, de Wlz of je zorgverzekeraar. De eigen bijdrage is maximaal 21 euro per maand.",
      url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/wie-betaalt-voor-respijtzorg/",
      bron: "MantelzorgNL",
      emoji: "🔄",
    },
  ],

  "financieel": [
    {
      id: "fi-1",
      titel: "Mantelzorgwaardering van je gemeente",
      beschrijving:
        "Veel gemeenten geven jaarlijks een blijk van waardering aan mantelzorgers. Dit kan geld zijn, een cadeaubon of een activiteit. Vraag het aan bij je gemeente.",
      url: "https://www.mantelzorg.nl/pro/onderwerpen/mantelzorgondersteuning/mantelzorgwaardering-door-gemeente/",
      bron: "MantelzorgNL",
      emoji: "🎁",
    },
    {
      id: "fi-2",
      titel: "Betaald worden via een PGB",
      beschrijving:
        "Je naaste kan een persoonsgebonden budget (PGB) aanvragen. Daaruit kun jij als mantelzorger betaald worden. Je mag maximaal 40 uur per week declareren.",
      url: "https://www.mantelzorg.nl/onderwerpen/persoonsgebonden-budget/wat-is-het-persoonsgebonden-budget/",
      bron: "MantelzorgNL",
      emoji: "💶",
    },
    {
      id: "fi-3",
      titel: "Belasting en PGB-inkomen",
      beschrijving:
        "Krijg je geld uit een PGB? Dan moet je dit opgeven bij de belastingaangifte als inkomsten uit overig werk. Let op: dit kan gevolgen hebben voor je toeslagen.",
      url: "https://www.mantelzorg.nl/veelgestelde-vragen-belastingaangifte/",
      bron: "MantelzorgNL",
      emoji: "📊",
    },
    {
      id: "fi-4",
      titel: "Zorgkosten aftrekken bij de belasting",
      beschrijving:
        "Hoge zorgkosten voor iemand in je huishouden? Die kun je soms aftrekken bij de belastingaangifte. Denk aan medicijnen, hulpmiddelen of reiskosten.",
      url: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/relatie_familie_en_gezondheid/gezondheid/persoonsgebonden-budget/persoonsgebonden-budget",
      bron: "Belastingdienst",
      emoji: "🧾",
    },
    {
      id: "fi-5",
      titel: "Hulpmiddelen via de Wmo of Wlz",
      beschrijving:
        "Hulpmiddelen zoals een tillift, rolstoel of hoog-laag bed kunnen vergoed worden via de gemeente (Wmo) of het zorgkantoor (Wlz). Vraag het aan bij je gemeente.",
      url: "https://www.rijksoverheid.nl/onderwerpen/mantelzorg/vraag-en-antwoord/hoe-kan-ik-als-mantelzorger-hulp-bij-de-zorg-krijgen",
      bron: "Rijksoverheid",
      emoji: "🦽",
    },
  ],
}

// Gemeente nieuws items - statisch voor nu
// In de toekomst kan dit vanuit een CMS of database komen
export const gemeenteNieuws: GemeenteNieuws[] = [
  {
    id: "gn-nijmegen-1",
    titel: "Gratis mantelzorgcursus in Nijmegen",
    beschrijving:
      "De gemeente Nijmegen biedt in maart een gratis cursus aan voor mantelzorgers. Je leert omgaan met stress en krijgt praktische tips. Aanmelden kan via de website van STIP Nijmegen.",
    gemeente: "Nijmegen",
    datum: "2026-02-07",
    url: "https://www.nijmegen.nl",
    emoji: "🎓",
  },
  {
    id: "gn-nijmegen-2",
    titel: "Mantelzorgwaardering Nijmegen 2026",
    beschrijving:
      "Mantelzorgers in Nijmegen kunnen dit jaar weer de jaarlijkse waardering aanvragen. Dit is een bedrag van 200 euro. Aanvragen kan tot 1 juni via het Sociaal Wijkteam.",
    gemeente: "Nijmegen",
    datum: "2026-02-01",
    url: "https://www.nijmegen.nl",
    emoji: "🎁",
  },
  {
    id: "gn-arnhem-1",
    titel: "Nieuw steunpunt mantelzorg in Arnhem",
    beschrijving:
      "In Arnhem-Zuid is een nieuw steunpunt geopend voor mantelzorgers. Je kunt er terecht voor advies, een kopje koffie en contact met andere mantelzorgers. Elke dinsdag en donderdag open.",
    gemeente: "Arnhem",
    datum: "2026-02-05",
    url: "https://www.arnhem.nl",
    emoji: "🏠",
  },
  {
    id: "gn-arnhem-2",
    titel: "Respijtzorg aanvragen in Arnhem vereenvoudigd",
    beschrijving:
      "De gemeente Arnhem heeft het aanvragen van respijtzorg makkelijker gemaakt. Via het online formulier kun je nu binnen 5 werkdagen een antwoord verwachten.",
    gemeente: "Arnhem",
    datum: "2026-01-28",
    url: "https://www.arnhem.nl",
    emoji: "📝",
  },
]

// Categorie metadata
export const categorieInfo: Record<string, { titel: string; beschrijving: string; emoji: string }> = {
  "praktische-tips": {
    titel: "Praktische tips",
    beschrijving: "Handige tips voor het dagelijks leven als mantelzorger.",
    emoji: "💡",
  },
  "zelfzorg": {
    titel: "Zelfzorg tips",
    beschrijving: "Zorg ook goed voor jezelf. Dat is net zo belangrijk.",
    emoji: "🧘",
  },
  "rechten": {
    titel: "Je rechten",
    beschrijving: "Dit zijn je rechten als mantelzorger. Goed om te weten.",
    emoji: "⚖️",
  },
  "financieel": {
    titel: "Financieel",
    beschrijving: "Vergoedingen en regelingen waar je recht op hebt.",
    emoji: "💰",
  },
}
