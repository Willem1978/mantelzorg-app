/**
 * Profiel pagina teksten.
 */

export const profielContent = {
  // Header
  header: {
    greeting: (naam: string) => `Hoi ${naam || "daar"}!`,
    subtitle: "Hier kun je je gegevens bekijken en aanpassen.",
    intro: "Hier kun je je gegevens bekijken en aanpassen. Met je adresgegevens zoeken we hulp dichtbij. Tik op 'Aanpassen' om iets te wijzigen.",
  },

  // Adres zoeken component
  adresZoeken: {
    wijk: "Wijk",
    gemeente: "Gemeente",
    placeholder: "Zoek op postcode of straatnaam",
  },

  // Labels (gedeeld tussen weergave en bewerken)
  labels: {
    naam: "Naam",
    email: "E-mail",
    telefoon: "Telefoon",
    straat: "Straat",
    woonplaats: "Woonplaats",
    gemeente: "Gemeente",
    wijk: "Wijk",
    relatie: "Relatie",
  },

  // Relatie opties voor select dropdown
  relatieOpties: [
    { value: "", label: "Selecteer..." },
    { value: "partner", label: "Partner" },
    { value: "ouder", label: "Ouder" },
    { value: "kind", label: "Kind" },
    { value: "broer_zus", label: "Broer of zus" },
    { value: "vriend", label: "Vriend(in)" },
    { value: "buur", label: "Buurman/buurvrouw" },
    { value: "anders", label: "Anders" },
  ],

  // Relatie labels voor weergave (korte versie)
  relatieLabels: {
    partner: "Partner",
    ouder: "Ouder",
    kind: "Kind",
    broer_zus: "Broer/zus",
    vriend: "Vriend(in)",
    buur: "Buurman/buurvrouw",
    anders: "Anders",
  } as Record<string, string>,

  // Mijn gegevens sectie
  mijnGegevens: {
    title: "Mijn gegevens",
    emoji: "\uD83D\uDC64",
    naamPlaceholder: "Je volledige naam",
    emailPlaceholder: "je@email.nl",
    adresLabel: "Waar woon je?",
    adresPlaceholder: "Begin met typen, bijv. Kerkstraat",
  },

  // Naaste sectie
  naaste: {
    title: "Voor wie zorg ik",
    emoji: "\u2764\uFE0F",
    naamLabel: "Naam van je naaste",
    naamPlaceholder: "Naam van degene voor wie je zorgt",
    adresLabel: "Waar woont je naaste?",
    adresPlaceholder: "Begin met typen, bijv. Kerkstraat",
  },

  // Bewerken scherm
  bewerken: {
    title: "Gegevens aanpassen",
    opslaan: "Opslaan",
    opslaanBezig: "Even geduld...",
    opgeslagen: "Gegevens opgeslagen!",
    fout: "Oeps, dat lukte niet. Probeer het opnieuw.",
    bewerken: "Aanpassen",
  },

  // Telefoonnummer wijzigen
  telefoon: {
    title: "Telefoonnummer wijzigen",
    huidigNummer: "Huidig nummer",
    nieuwLabel: "Nieuw telefoonnummer",
    placeholder: "06 12345678",
    whatsappKoppeling: "Dit nummer wordt gekoppeld aan je WhatsApp account",
    opslaanBezig: "Opslaan...",
    nummerOpslaan: "Nummer opslaan",
    nummerOntkoppelen: "Nummer ontkoppelen",
    ontkoppeld: "Telefoonnummer ontkoppeld!",
    opgeslagen: "Telefoonnummer opgeslagen!",
    fout: "Oeps, dat lukte niet. Probeer het opnieuw.",
    validatieFout: "Voer een geldig 06-nummer in (bijv. 06 12345678)",
    letOp: "Let op:",
    waarschuwing: "Als je een nieuw nummer koppelt, wordt het oude nummer ontkoppeld. Berichten via WhatsApp worden dan aan het nieuwe nummer gekoppeld.",
  },

  // Wachtwoord wijzigen
  wachtwoord: {
    title: "Wachtwoord wijzigen",
    huidigLabel: "Huidig wachtwoord",
    huidigPlaceholder: "Je huidige wachtwoord",
    nieuwLabel: "Nieuw wachtwoord",
    nieuwPlaceholder: "Minimaal 8 tekens",
    bevestigLabel: "Bevestig nieuw wachtwoord",
    bevestigPlaceholder: "Herhaal nieuw wachtwoord",
    opslaanBezig: "Opslaan...",
    wijzigen: "Wachtwoord wijzigen",
    gewijzigd: "Wachtwoord gewijzigd!",
    fout: "Oeps, dat lukte niet. Probeer het opnieuw.",
    teKort: "Wachtwoord moet minimaal 8 tekens zijn",
    nietOvereen: "Wachtwoorden komen niet overeen",
  },

  // Test resultaat
  testResultaat: {
    title: "Laatste Balanscheck",
    emoji: "\uD83D\uDCCA",
    niveaus: {
      laag: "Goed vol te houden",
      gemiddeld: "Het wordt zwaar",
      hoog: "Te veel op je bordje",
    } as Record<string, string>,
  },

  // Jouw reis (mijlpalen)
  reis: {
    title: "Jouw reis",
    emoji: "\uD83D\uDDFA\uFE0F",
  },

  // WhatsApp sectie
  whatsapp: {
    title: "WhatsApp",
    subtitle: "Je kunt MantelBuddy ook via WhatsApp gebruiken. Handig voor op je telefoon!",
    scanQr: "Scan de QR code om direct te chatten",
    qrAlt: "Scan QR code om WhatsApp te starten",
    gekoppeldNummer: "Gekoppeld nummer",
    gekoppeldBericht: "Je kunt MantelBuddy gebruiken via WhatsApp!",
    openWhatsApp: "Open WhatsApp",
    nietGekoppeld: "Nog niet gekoppeld",
    nietGekoppeldUitleg: "Start een WhatsApp chat om je nummer automatisch te koppelen.",
    startChat: "Start WhatsApp Chat",
  },

  // Account sectie
  account: {
    title: "Account",
    emoji: "\u2699\uFE0F",
    tutorial: {
      label: "Bekijk uitleg opnieuw",
      beschrijving: "Uitleg over hoe MantelBuddy werkt",
      emoji: "\uD83D\uDCD6",
    },
    wachtwoord: "Wachtwoord wijzigen",
    privacy: {
      label: "Privacy & AVG",
      beschrijving: "Bekijk welke gegevens we bewaren",
    },
    verwijderen: {
      label: "Account verwijderen",
      beschrijving: "Verwijder je account en alle gegevens permanent",
    },
  },

  // Account verwijderen bevestiging
  verwijderBevestiging: {
    title: "Account permanent verwijderen",
    emoji: "\u26A0\uFE0F",
    letOp: "Let op:",
    waarschuwing: "dit kan niet ongedaan gemaakt worden. Alle gegevens worden permanent verwijderd:",
    items: [
      "Je profiel en accountgegevens",
      "Alle Balanscheck resultaten en rapporten",
      "Je agenda, taken en hulpvragen",
      "Opgeslagen favorieten",
      "WhatsApp koppeling",
    ],
    typInstructie: "om te bevestigen:",
    typWoord: "VERWIJDEREN",
    annuleren: "Niet nu",
    verwijderenBezig: "Verwijderen...",
    definitief: "Definitief verwijderen",
    fout: "Oeps, dat lukte niet. Probeer het opnieuw.",
    verwijderFout: "Oeps, dat lukte niet. Probeer het opnieuw.",
  },

  // Hulp sectie
  hulp: {
    title: "Wil je met iemand praten?",
    emoji: "\uD83C\uDD98",
    tekst: "Bel de Mantelzorglijn. Ze luisteren en geven advies. Gratis en anoniem.",
    telefoon: "030 - 205 90 59",
  },

  // Uitloggen
  uitloggen: {
    label: "Uitloggen",
    bezig: "Uitloggen...",
  },

  // Versie
  versie: "MantelBuddy v1.4.0",
} as const
