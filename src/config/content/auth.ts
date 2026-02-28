/**
 * Authenticatie pagina teksten (login, register, wachtwoord vergeten).
 */

export const authContent = {
  login: {
    title: "Welkom terug!",
    subtitle: "Vul je gegevens in om in te loggen. Na het inloggen ga je naar je dashboard.",
    sessionInvalidated: {
      title: "Je bent uitgelogd",
      tekst: "Je bent op een ander apparaat ingelogd. Log opnieuw in om door te gaan.",
    },
    fromTest: {
      title: "Je hebt de test afgerond!",
      tekst: "Log in om je resultaten op te slaan.",
    },
    error: {
      title: "Dat lukte niet",
      tekst: "Je e-mail of wachtwoord is niet goed. Kijk het na en probeer opnieuw.",
      generic: "Oeps, dat lukte niet",
      invalidCredentials: "Ongeldige inloggegevens",
    },
    form: {
      emailLabel: "Je e-mailadres",
      emailPlaceholder: "naam@voorbeeld.nl",
      emailHelp: "Het adres waarmee je bent aangemeld",
      passwordLabel: "Je wachtwoord",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Wachtwoord vergeten?",
      submitButton: "Inloggen",
      submitting: "Inloggen...",
    },
    footer: {
      noAccount: "Nog geen account? Maak er gratis een aan.",
      createAccount: "Account aanmaken",
      backToHome: "← Terug naar home",
      doTestFirst: "Doe eerst de Balanstest",
    },
    success: "Je bent ingelogd!",
  },

  register: {
    steps: {
      account: {
        title: "Maak een account",
        subtitle: "Vul je e-mail en wachtwoord in. Zo kun je later weer inloggen.",
      },
      overJou: {
        title: "Over jou",
        subtitle: "Vul je naam en adres in. Met je adres zoeken we hulp bij jou in de buurt.",
      },
      overNaaste: {
        title: "Over je naaste",
        subtitle: "Bijna klaar! Vul de gegevens van je naaste in.",
      },
    },
    progress: (stap: number) => `stap ${stap} van 3`,
    relatieOpties: [
      "Partner",
      "Ouder",
      "Kind",
      "Broer/zus",
      "Schoonouder",
      "Vriend(in)",
      "Buurman/vrouw",
      "Anders",
    ] as readonly string[],
    form: {
      emailLabel: "Je e-mailadres",
      emailPlaceholder: "naam@voorbeeld.nl",
      emailHelp: "Hier sturen we belangrijke berichten naartoe",
      passwordLabel: "Kies een wachtwoord",
      passwordHelp: "Kies iets dat je makkelijk onthoudt",
      passwordMin: "Minimaal 8 tekens",
      passwordConfirmLabel: "Typ je wachtwoord nog een keer",
      passwordConfirmHelp: "Hetzelfde als hierboven",
      phoneLabel: "Je mobiele nummer",
      phoneLabelOptional: "(niet verplicht)",
      phonePlaceholder: "06 12345678",
      phoneHelp: "Dan kun je MantelBuddy ook via WhatsApp gebruiken",
      nameLabel: "Hoe mogen we je noemen?",
      namePlaceholder: "Je voornaam",
      addressLabel: "Waar woon je?",
      addressPlaceholder: "Begin met typen, bijv. Kerkstraat of 1234AB",
      addressHelp: "Dit hebben we nodig om hulp bij jou in de buurt te vinden",
      careNameLabel: "Hoe heet degene voor wie je zorgt?",
      careNamePlaceholder: "Voornaam",
      careRelationLabel: "Wie is dat voor jou?",
      careRelationHelp: "Tik op wat van toepassing is",
      careAddressLabel: "Waar woont je naaste?",
      careAddressPlaceholder: "Begin met typen, bijv. Kerkstraat of 1234AB",
      careAddressHelp: "Zo vinden we hulp bij je naaste in de buurt",
    },
    privacy: {
      akkoordPrefix: "Ik ga akkoord met de",
      privacyregels: "privacyregels",
      akkoordSuffix: "(we delen je gegevens nooit met anderen)",
      gegevensGebruik: "Jullie mogen mijn gegevens gebruiken om mij te helpen",
    },
    errors: {
      generic: "Oeps, dat lukte niet",
      emailVerplicht: "Vul je e-mailadres in",
      wachtwoordMin: "Je wachtwoord moet minimaal 8 tekens zijn",
      wachtwoordOngelijk: "De wachtwoorden zijn niet hetzelfde",
      telefoonOngeldig: "Je telefoonnummer klopt niet. Gebruik het formaat: 06 12345678",
      naamVerplicht: "Vul je naam in",
      adresVerplicht: "Kies je adres",
      naasteNaamVerplicht: "Vul de naam van je naaste in",
      relatieVerplicht: "Kies je relatie tot je naaste",
      naasteAdresVerplicht: "Kies het adres van je naaste",
      voorwaardenVerplicht: "Je moet akkoord gaan met de voorwaarden",
      registratieFout: "Je account kon niet worden aangemaakt. Probeer het later opnieuw.",
    },
    buttons: {
      verder: "Ga verder",
      terug: "← Terug",
      klaar: "Klaar!",
      bezig: "Even geduld...",
    },
    footer: {
      heeftAccount: "Heb je al een account?",
      login: "Log in",
    },
    success: {
      accountAangemaakt: "Account aangemaakt! Log nu in.",
      welkom: "Welkom! Je account is klaar.",
    },
  },

  wachtwoordVergeten: {
    success: {
      title: "Kijk in je e-mail",
      tekst: "We hebben je een link gestuurd. Klik erop om een nieuw wachtwoord te kiezen.",
      spamHint: "Geen mail? Kijk bij ongewenste e-mail (spam).",
    },
    buttons: {
      nogEenKeer: "Nog een keer proberen",
      naarInloggen: "Naar inloggen",
    },
  },
} as const
