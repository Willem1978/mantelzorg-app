// Alle informatieartikelen voor de Leren & Tips sectie
// Geschreven in B1 Nederlands, ouderenvriendelijk
// Let op: de database (seed.ts) is de primaire bron. Dit bestand is een referentie.

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
      titel: "Dagstructuur en weekplanning",
      beschrijving:
        "Een vaste dagindeling geeft rust. Maak een weekplanning en bekijk wat je kunt uitbesteden. Zo houd je overzicht en bespaar je energie.",
      url: "https://www.mantelzorg.nl/onderwerpen/balans/",
      bron: "MantelzorgNL",
      emoji: "📅",
    },
    {
      id: "pt-2",
      titel: "Tips voor veilig medicijngebruik",
      beschrijving:
        "Als mantelzorger help je vaak met medicijnen. Neem altijd het medicijnoverzicht mee naar de dokter. Let op veranderingen zoals sufheid of verwardheid.",
      url: "https://www.zorgvoorbeter.nl/medicatieveiligheid",
      bron: "Zorg voor Beter",
      emoji: "💊",
    },
    {
      id: "pt-6",
      titel: "Zorgrooster maken met familie",
      beschrijving:
        "Verdeel de zorgtaken over meerdere mensen. Maak een rooster zodat iedereen weet wanneer hij of zij aan de beurt is. Gebruik een gedeelde agenda.",
      url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/",
      bron: "MantelzorgNL",
      emoji: "📋",
    },
    {
      id: "pt-3",
      titel: "Samenwerken met de thuiszorg",
      beschrijving:
        "Maak goede afspraken met de thuiszorg of het verpleeghuis. Bespreek het zorgplan en maak een zorgrooster. Zo weet iedereen wie wat doet.",
      url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/",
      bron: "MantelzorgNL",
      emoji: "🤝",
    },
    {
      id: "pt-4",
      titel: "Communiceren met je naaste",
      beschrijving:
        "Praten wordt soms moeilijker. Gebruik korte zinnen, maak oogcontact en geef de tijd om te antwoorden. Geduld en begrip maken een groot verschil.",
      url: "https://www.dementie.nl/omgaan-met-dementie/communiceren-bij-dementie/tien-tips-voor-betere-communicatie",
      bron: "Dementie.nl",
      emoji: "💬",
    },
    {
      id: "pt-7",
      titel: "Hulp vragen aan je omgeving",
      beschrijving:
        "Veel mensen willen wel helpen, maar weten niet hoe. Durf concreet te vragen: kun je maandag koken? Zo maak je het makkelijk om ja te zeggen.",
      url: "https://www.mantelzorg.nl/onderwerpen/balans/",
      bron: "MantelzorgNL",
      emoji: "🙋",
    },
    {
      id: "pt-5",
      titel: "Veilig tillen en verplaatsen",
      beschrijving:
        "Leer hoe je iemand veilig helpt bij het opstaan of verplaatsen. Gebruik hulpmiddelen zoals een tillift of glijzeil. Zo voorkom je rugklachten.",
      url: "https://www.hulpmiddelenwijzer.nl/",
      bron: "Hulpmiddelenwijzer",
      emoji: "🏋️",
    },
    {
      id: "pt-8",
      titel: "Valpreventie in huis",
      beschrijving:
        "Voorkom vallen door losse snoeren, kleedjes en drempels weg te halen. Zorg voor goede verlichting en steunpunten. Vraag de thuiszorg om advies.",
      url: "https://www.thuisarts.nl/vallen/ik-wil-vallen-voorkomen",
      bron: "Thuisarts.nl",
      emoji: "⚡",
    },
    {
      id: "pt-9",
      titel: "Dagstructuur bij dementie",
      beschrijving:
        "Een vaste dagindeling geeft rust voor iemand met dementie. Begin vroeg met dagbesteding. Het geeft structuur en jij hebt even tijd voor jezelf.",
      url: "https://www.dementie.nl/dagbesteding",
      bron: "Dementie.nl",
      emoji: "🧠",
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
      id: "zz-6",
      titel: "De mantelzorgtest: hoe belast ben jij?",
      beschrijving:
        "Doe de online test en ontdek hoe het met je gaat. Je krijgt tips die passen bij jouw situatie. Het duurt maar een paar minuten.",
      url: "https://www.mantelzorg.nl/onderwerpen/balans/",
      bron: "MantelzorgNL",
      emoji: "📊",
    },
    {
      id: "zz-3",
      titel: "Respijtzorg: even vrij van zorgen",
      beschrijving:
        "Geef de zorg tijdelijk aan iemand anders. Dat heet respijtzorg. Denk aan dagopvang, een logeerhuis of een vrijwilliger aan huis. Zo heb jij even rust.",
      url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/",
      bron: "MantelzorgNL",
      emoji: "🌿",
    },
    {
      id: "zz-7",
      titel: "Logeeropvang en vakantiemogelijkheden",
      beschrijving:
        "Je naaste kan tijdelijk logeren in een zorginstelling zodat jij op vakantie kunt. Vraag het aan via je gemeente of zorgkantoor. Plan het op tijd.",
      url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/",
      bron: "MantelzorgNL",
      emoji: "🏖️",
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
    {
      id: "zz-8",
      titel: "Lotgenotencontact: praat met andere mantelzorgers",
      beschrijving:
        "Het helpt om te praten met mensen die hetzelfde meemaken. Via MantelzorgNL of je steunpunt vind je lotgenotengroepen bij jou in de buurt.",
      url: "https://www.mantelzorg.nl/onderwerpen/ondersteuning/",
      bron: "MantelzorgNL",
      emoji: "👥",
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
      id: "re-4",
      titel: "Recht op zorgverlof van je werk",
      beschrijving:
        "Als werknemer heb je recht op kortdurend zorgverlof (70% loon) en langdurend zorgverlof (onbetaald). Je werkgever mag dit alleen weigeren bij ernstige bedrijfsproblemen.",
      url: "https://www.rijksoverheid.nl/onderwerpen/zorgverlof",
      bron: "Rijksoverheid",
      emoji: "📋",
    },
    {
      id: "re-6",
      titel: "Recht op respijtzorg",
      beschrijving:
        "Je hebt recht op tijdelijke vervanging van de zorg. Dit kan via de Wmo, de Wlz of je zorgverzekeraar. De eigen bijdrage is maximaal 21 euro per maand.",
      url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/wie-betaalt-voor-respijtzorg/",
      bron: "MantelzorgNL",
      emoji: "🔄",
    },
    {
      id: "re-7",
      titel: "De Wlz: langdurige zorg",
      beschrijving:
        "Bij blijvende, intensieve zorg kan je naaste in aanmerking komen voor de Wet langdurige zorg (Wlz). Het CIZ beoordeelt of iemand hiervoor in aanmerking komt.",
      url: "https://www.rijksoverheid.nl/onderwerpen/verpleeghuizen-en-zorginstellingen/wet-langdurige-zorg-wlz",
      bron: "Rijksoverheid",
      emoji: "🏥",
    },
    {
      id: "re-3",
      titel: "Het keukentafelgesprek",
      beschrijving:
        "De gemeente nodigt je uit voor een gesprek over de zorg. Dit heet het keukentafelgesprek. Ga er altijd bij zitten, want het gaat ook over hulp aan jou.",
      url: "https://www.rijksoverheid.nl/onderwerpen/zorg-en-ondersteuning-thuis/vraag-en-antwoord/hoe-vraag-ik-een-wmo-voorziening-aan",
      bron: "Rijksoverheid",
      emoji: "☕",
    },
    {
      id: "re-5",
      titel: "Gratis onafhankelijke clientondersteuning",
      beschrijving:
        "Kom je er niet uit? Een clientondersteuner helpt gratis bij het organiseren van zorg en ondersteuning. Onafhankelijk en via gemeente of Wlz-route beschikbaar.",
      url: "https://www.rijksoverheid.nl/onderwerpen/zorg-en-ondersteuning-thuis/clientondersteuning",
      bron: "Rijksoverheid",
      emoji: "🤝",
    },
    {
      id: "re-9",
      titel: "Regelhulp: welke zorg past bij jou?",
      beschrijving:
        "Via Regelhulp.nl vind je snel welke hulp en ondersteuning er is voor jouw situatie. Beantwoord een paar vragen en krijg een persoonlijk advies.",
      url: "https://www.regelhulp.nl/",
      bron: "Rijksoverheid",
      emoji: "🧭",
    },
  ],

  "financieel": [
    {
      id: "fi-1",
      titel: "Eigen bijdrage en kosten (CAK)",
      beschrijving:
        "Voor Wmo- en Wlz-zorg betaal je een eigen bijdrage. Het abonnementstarief voor Wmo is maximaal 21,80 euro per maand. Controleer je bijdrage via het CAK.",
      url: "https://www.hetcak.nl/",
      bron: "CAK",
      emoji: "💰",
    },
    {
      id: "fi-6",
      titel: "Zorgkosten aftrekken bij de belasting",
      beschrijving:
        "Hoge zorgkosten? Die kun je soms aftrekken bij je belastingaangifte. Denk aan medicijnen, hulpmiddelen of reiskosten naar het ziekenhuis.",
      url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/aftrek-en-kortingen/content/aftrek-specifieke-zorgkosten",
      bron: "Belastingdienst",
      emoji: "🧾",
    },
    {
      id: "fi-2",
      titel: "Mantelzorgwaardering van je gemeente",
      beschrijving:
        "Veel gemeenten geven jaarlijks een blijk van waardering aan mantelzorgers. Dit kan geld zijn, een cadeaubon of een activiteit. Vraag het aan bij je gemeente.",
      url: "https://www.mantelzorg.nl/onderwerpen/geldzaken/mantelzorgwaardering",
      bron: "MantelzorgNL",
      emoji: "🎁",
    },
    {
      id: "fi-3",
      titel: "Betaald worden via een PGB",
      beschrijving:
        "Je naaste kan een persoonsgebonden budget (PGB) aanvragen. Daaruit kun jij als mantelzorger betaald worden. Je mag maximaal 40 uur per week declareren.",
      url: "https://www.mantelzorg.nl/onderwerpen/persoonsgebonden-budget/",
      bron: "MantelzorgNL",
      emoji: "💶",
    },
    {
      id: "fi-4",
      titel: "Belasting en PGB-inkomen",
      beschrijving:
        "Krijg je geld uit een PGB? Dan moet je dit opgeven bij de belastingaangifte als inkomsten uit overig werk. Let op: dit kan gevolgen hebben voor je toeslagen.",
      url: "https://www.svb.nl/nl/pgb",
      bron: "SVB",
      emoji: "📊",
    },
    {
      id: "fi-5",
      titel: "Hulpmiddelen via de Wmo of Wlz",
      beschrijving:
        "Hulpmiddelen zoals een tillift, rolstoel of hoog-laag bed kunnen vergoed worden. Vraag altijd eerst vergoeding aan voordat je iets koopt.",
      url: "https://www.rijksoverheid.nl/onderwerpen/zorg-en-ondersteuning-thuis/hulpmiddelen-in-en-om-het-huis",
      bron: "Rijksoverheid",
      emoji: "🦽",
    },
    {
      id: "fi-9",
      titel: "Zorgtoeslag en huurtoeslag",
      beschrijving:
        "Als je een laag inkomen hebt, kun je zorgtoeslag en huurtoeslag aanvragen. Mantelzorgen kan invloed hebben op je inkomen en daarmee op je toeslagen.",
      url: "https://www.toeslagen.nl/",
      bron: "Belastingdienst",
      emoji: "💳",
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
  {
    id: "gn-zutphen-1",
    titel: "Lotgenotengroep mantelzorgers in Zutphen",
    beschrijving:
      "In buurtcentrum De Hanzehof start in april een lotgenotengroep voor mantelzorgers. Elke twee weken kun je ervaringen delen en tips uitwisselen. Deelname is gratis. Aanmelden via Perspectief Zutphen.",
    gemeente: "Zutphen",
    datum: "2026-02-06",
    url: "https://www.zutphen.nl",
    emoji: "🤝",
  },
  {
    id: "gn-zutphen-2",
    titel: "Mantelzorgcompliment Zutphen: vraag het aan!",
    beschrijving:
      "De gemeente Zutphen waardeert mantelzorgers met een jaarlijks compliment van 150 euro. Je kunt dit aanvragen via het Sociaal Wijkteam of online via de website van de gemeente.",
    gemeente: "Zutphen",
    datum: "2026-01-20",
    url: "https://www.zutphen.nl",
    emoji: "💐",
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
  "hulpmiddelen-producten": {
    titel: "Hulpmiddelen & producten",
    beschrijving: "Vind het juiste hulpmiddel en ontdek vergoedingsroutes.",
    emoji: "🛠️",
  },
}
