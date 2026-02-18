import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Wessel03!', 12)
  await prisma.user.upsert({
    where: { email: 'w.veenendaal@livelife.nl' },
    create: {
      email: 'w.veenendaal@livelife.nl',
      name: 'Willem Veenendaal',
      password: adminPassword,
      role: 'ADMIN',
    },
    update: {
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('Admin user created: w.veenendaal@livelife.nl')

  // Create intake categories with questions
  const categories = [
    {
      name: 'Zorgsituatie',
      description: 'Vragen over je huidige zorgsituatie',
      order: 1,
      questions: [
        { id: 'q1', question: 'Ik heb een goed overzicht van alle zorgtaken die ik uitvoer', order: 1 },
        { id: 'q2', question: 'De hoeveelheid zorg die ik geef past bij wat ik aankan', order: 2 },
        { id: 'q3', question: 'Ik kan de zorg goed combineren met mijn andere verantwoordelijkheden', order: 3 },
      ],
    },
    {
      name: 'Fysiek welzijn',
      description: 'Hoe beïnvloedt de zorg je lichamelijk?',
      order: 2,
      questions: [
        { id: 'q4', question: 'Ik voel me lichamelijk fit genoeg voor de zorgtaken', order: 1 },
        { id: 'q5', question: 'Ik krijg voldoende slaap en rust', order: 2 },
        { id: 'q6', question: 'Ik heb voldoende energie voor mezelf over na de zorgtaken', order: 3 },
      ],
    },
    {
      name: 'Emotioneel welzijn',
      description: 'Hoe voel je je emotioneel?',
      order: 3,
      questions: [
        { id: 'q7', question: 'Ik voel me emotioneel in balans', order: 1 },
        { id: 'q8', question: 'Ik heb voldoende mensen om mee te praten over mijn zorgsituatie', order: 2 },
        { id: 'q9', question: 'Ik maak me weinig zorgen over de toekomst van de zorgsituatie', order: 3 },
      ],
    },
    {
      name: 'Sociale contacten',
      description: 'Hoe is je sociale leven?',
      order: 4,
      questions: [
        { id: 'q10', question: 'Ik heb voldoende tijd voor sociale activiteiten', order: 1 },
        { id: 'q11', question: 'Mijn vrienden en familie begrijpen mijn situatie als mantelzorger', order: 2 },
        { id: 'q12', question: 'Ik voel me niet geïsoleerd door mijn zorgtaken', order: 3 },
      ],
    },
    {
      name: 'Ondersteuning',
      description: 'Welke hulp heb je nodig?',
      order: 5,
      questions: [
        { id: 'q13', question: 'Ik weet waar ik terecht kan voor hulp en ondersteuning', order: 1 },
        { id: 'q14', question: 'Ik krijg voldoende praktische hulp bij de zorgtaken', order: 2 },
        { id: 'q15', question: 'Is er nog iets dat je wilt delen over je situatie?', order: 3, type: 'TEXT' as const },
      ],
    },
  ]

  for (const cat of categories) {
    const category = await prisma.intakeCategory.upsert({
      where: { id: cat.name.toLowerCase().replace(/\s+/g, '-') },
      create: {
        id: cat.name.toLowerCase().replace(/\s+/g, '-'),
        name: cat.name,
        description: cat.description,
        order: cat.order,
      },
      update: {
        description: cat.description,
        order: cat.order,
      },
    })

    for (const q of cat.questions) {
      await prisma.intakeQuestion.upsert({
        where: { id: q.id },
        create: {
          id: q.id,
          categoryId: category.id,
          question: q.question,
          type: (q as any).type || 'SCALE',
          order: q.order,
          isRequired: true,
        },
        update: {
          question: q.question,
          type: (q as any).type || 'SCALE',
          order: q.order,
        },
      })
    }
  }

  // Seed artikelen vanuit voormalige artikelen.ts
  const artikelenData = [
    // === PRAKTISCHE TIPS ===
    // Sub: Dagelijks organiseren
    { id: 'pt-1', titel: 'Dagstructuur en weekplanning', beschrijving: 'Een vaste dagindeling geeft rust. Maak een weekplanning en bekijk wat je kunt uitbesteden. Zo houd je overzicht en bespaar je energie.', url: 'https://www.mantelzorg.nl/onderwerpen/balans/', bron: 'MantelzorgNL', emoji: '📅', categorie: 'praktische-tips', subHoofdstuk: 'dagelijks-organiseren', bronLabel: 'Landelijk', sorteerVolgorde: 1 },
    { id: 'pt-2', titel: 'Tips voor veilig medicijngebruik', beschrijving: 'Als mantelzorger help je vaak met medicijnen. Neem altijd het medicijnoverzicht mee naar de dokter. Let op veranderingen zoals sufheid of verwardheid.', url: 'https://www.zorgvoorbeter.nl/tips-tools/tips/6-tips-voor-mantelzorgers-voor-veilig-medicijngebruik', bron: 'Zorg voor Beter', emoji: '💊', categorie: 'praktische-tips', subHoofdstuk: 'dagelijks-organiseren', bronLabel: 'Landelijk', sorteerVolgorde: 2 },
    // Sub: Samen organiseren met familie/netwerk
    { id: 'pt-3', titel: 'Samenwerken met de thuiszorg', beschrijving: 'Maak goede afspraken met de thuiszorg of het verpleeghuis. Bespreek het zorgplan en maak een zorgrooster. Zo weet iedereen wie wat doet.', url: 'https://www.mantelzorg.nl/onderwerpen/zorg/je-naaste-in-een-zorgorganisatie-8-tips/', bron: 'MantelzorgNL', emoji: '🤝', categorie: 'praktische-tips', subHoofdstuk: 'samen-organiseren', bronLabel: 'Landelijk', sorteerVolgorde: 3 },
    { id: 'pt-4', titel: 'Communiceren met je naaste', beschrijving: 'Praten wordt soms moeilijker. Gebruik korte zinnen, maak oogcontact en geef de tijd om te antwoorden. Geduld en begrip maken een groot verschil.', url: 'https://www.dementie.nl/lichamelijke-veranderingen/praten-en-horen/tien-tips-voor-betere-communicatie-bij-dementie', bron: 'Dementie.nl', emoji: '💬', categorie: 'praktische-tips', subHoofdstuk: 'samen-organiseren', bronLabel: 'Landelijk', sorteerVolgorde: 4 },
    // Sub: Veiligheid bij zware taken
    { id: 'pt-5', titel: 'Veilig tillen en verplaatsen', beschrijving: 'Leer hoe je iemand veilig helpt bij het opstaan of verplaatsen. Gebruik hulpmiddelen zoals een tillift of glijzeil. Zo voorkom je rugklachten.', url: 'https://www.hulpmiddelenwijzer.nl/activiteit/verzorgen/helpen-bij-verplaatsen', bron: 'Hulpmiddelenwijzer', emoji: '🏋️', categorie: 'praktische-tips', subHoofdstuk: 'veiligheid-zware-taken', bronLabel: 'Landelijk', sorteerVolgorde: 5 },
    // === ZELFZORG ===
    // Sub: Overbelasting herkennen
    { id: 'zz-1', titel: 'Herken overbelasting op tijd', beschrijving: 'Mantelzorg kan zwaar zijn. Let op signalen zoals slecht slapen, prikkelbaar zijn of je somber voelen. Neem het serieus en zoek hulp als het te veel wordt.', url: 'https://www.mantelzorg.nl/onderwerpen/balans/overbelasting-en-mantelzorg/', bron: 'MantelzorgNL', emoji: '⚠️', categorie: 'zelfzorg', subHoofdstuk: 'overbelasting-herkennen', bronLabel: 'Landelijk', sorteerVolgorde: 1 },
    { id: 'zz-2', titel: 'Grenzen stellen als mantelzorger', beschrijving: 'Je wilt graag helpen, maar je kunt niet alles doen. Gezonde grenzen zijn nodig om het vol te houden. Leer hoe je nee zegt zonder je schuldig te voelen.', url: 'https://www.mantelzorg.nl/onderwerpen/balans/mantelzorgen-met-gezonde-grenzen/', bron: 'MantelzorgNL', emoji: '🛑', categorie: 'zelfzorg', subHoofdstuk: 'overbelasting-herkennen', bronLabel: 'Landelijk', sorteerVolgorde: 2 },
    // Sub: Pauze en respijt organiseren
    { id: 'zz-3', titel: 'Respijtzorg: even vrij van zorgen', beschrijving: 'Geef de zorg tijdelijk aan iemand anders. Dat heet respijtzorg. Denk aan dagopvang, een logeerhuis of een vrijwilliger aan huis. Zo heb jij even rust.', url: 'https://www.mantelzorg.nl/pro/onderwerpen/mantelzorgondersteuning/vervangende-zorg-of-respijtzorg/', bron: 'MantelzorgNL', emoji: '🌿', categorie: 'zelfzorg', subHoofdstuk: 'pauze-en-respijt', bronLabel: 'Gemeente (Wmo)', sorteerVolgorde: 3 },
    // Sub: Emotionele steun en praten
    { id: 'zz-4', titel: 'Werk en mantelzorg combineren', beschrijving: 'Veel mantelzorgers werken ook. Praat erover met je werkgever. Vaak is er meer mogelijk dan je denkt, zoals thuiswerken of aangepaste werktijden.', url: 'https://www.mantelzorg.nl/onderwerpen/werk/werkende-mantelzorgers-valkuilen-en-tips/', bron: 'MantelzorgNL', emoji: '💼', categorie: 'zelfzorg', subHoofdstuk: 'emotionele-steun', bronLabel: 'Landelijk', sorteerVolgorde: 4 },
    { id: 'zz-5', titel: 'De Mantelzorglijn: praat met iemand', beschrijving: 'Heb je vragen of wil je je verhaal kwijt? Bel de Mantelzorglijn op 030 760 60 55. Je kunt ook WhatsAppen of mailen. Ze staan voor je klaar.', url: 'https://www.mantelzorg.nl/onderwerpen/ondersteuning/mantelzorglijn-voor-al-je-vragen-over-mantelzorg/', bron: 'MantelzorgNL', emoji: '📞', categorie: 'zelfzorg', subHoofdstuk: 'emotionele-steun', bronLabel: 'Landelijk', sorteerVolgorde: 5 },
    // === JE RECHTEN ===
    // Sub: Routekaart Wmo/Zvw/Wlz
    { id: 're-1', titel: 'De Wmo: hulp via je gemeente', beschrijving: 'Via de Wet maatschappelijke ondersteuning (Wmo) kun je hulp krijgen van je gemeente. Denk aan huishoudelijke hulp, vervoer of aanpassingen in huis.', url: 'https://www.mantelzorg.nl/onderwerpen/wetten/wmo-en-mantelzorg/', bron: 'MantelzorgNL', emoji: '🏛️', categorie: 'rechten', subHoofdstuk: 'routekaart-wmo-zvw-wlz', bronLabel: 'Landelijk', sorteerVolgorde: 1 },
    { id: 're-2', titel: 'Mantelzorg is altijd vrijwillig', beschrijving: 'De gemeente mag je niet verplichten om mantelzorg te geven. Je mag altijd nee zeggen. Vraag de gemeente dan om een andere oplossing te zoeken.', url: 'https://www.mantelzorg.nl/onderwerpen/wetten/rechten-en-plichten-van-de-mantelzorger/', bron: 'MantelzorgNL', emoji: '✋', categorie: 'rechten', subHoofdstuk: 'routekaart-wmo-zvw-wlz', bronLabel: 'Landelijk', sorteerVolgorde: 2 },
    // Sub: Gemeente (Wmo) aanvragen
    { id: 're-3', titel: 'Het keukentafelgesprek', beschrijving: 'De gemeente nodigt je uit voor een gesprek over de zorg. Dit heet het keukentafelgesprek. Ga er altijd bij zitten, want het gaat ook over hulp aan jou.', url: 'https://www.rijksoverheid.nl/onderwerpen/mantelzorg/vraag-en-antwoord/hoe-kan-ik-als-mantelzorger-hulp-bij-de-zorg-krijgen', bron: 'Rijksoverheid', emoji: '☕', categorie: 'rechten', subHoofdstuk: 'gemeente-wmo-aanvragen', bronLabel: 'Gemeente (Wmo)', sorteerVolgorde: 3 },
    { id: 're-4', titel: 'Recht op zorgverlof van je werk', beschrijving: 'Als werknemer heb je recht op kortdurend zorgverlof (70% loon) en langdurend zorgverlof (onbetaald). Je werkgever mag dit alleen weigeren bij ernstige bedrijfsproblemen.', url: 'https://www.rijksoverheid.nl/onderwerpen/zorgverlof', bron: 'Rijksoverheid', emoji: '📋', categorie: 'rechten', subHoofdstuk: 'routekaart-wmo-zvw-wlz', bronLabel: 'Landelijk', sorteerVolgorde: 4 },
    // Sub: Gratis clientondersteuning
    { id: 're-5', titel: 'Gratis onafhankelijke clientondersteuning', beschrijving: 'Kom je er niet uit? Een clientondersteuner helpt gratis bij het organiseren van zorg en ondersteuning. Onafhankelijk en via gemeente of Wlz-route beschikbaar.', url: 'https://www.rijksoverheid.nl/onderwerpen/zorg-en-ondersteuning-thuis/clientondersteuning', bron: 'Rijksoverheid', emoji: '🤝', categorie: 'rechten', subHoofdstuk: 'clientondersteuning', bronLabel: 'Landelijk', sorteerVolgorde: 5 },
    { id: 're-6', titel: 'Recht op respijtzorg', beschrijving: 'Je hebt recht op tijdelijke vervanging van de zorg. Dit kan via de Wmo, de Wlz of je zorgverzekeraar. De eigen bijdrage is maximaal 21 euro per maand.', url: 'https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/wie-betaalt-voor-respijtzorg/', bron: 'MantelzorgNL', emoji: '🔄', categorie: 'rechten', subHoofdstuk: 'routekaart-wmo-zvw-wlz', bronLabel: 'Landelijk', sorteerVolgorde: 6 },
    // === FINANCIEEL ===
    // Sub: Eigen bijdrage en kosten
    { id: 'fi-1', titel: 'Eigen bijdrage en kosten (CAK)', beschrijving: 'Voor Wmo- en Wlz-zorg betaal je een eigen bijdrage. Het abonnementstarief voor Wmo is maximaal 21,80 euro per maand. Controleer je bijdrage via het CAK.', url: 'https://www.hetcak.nl/', bron: 'CAK', emoji: '💰', categorie: 'financieel', subHoofdstuk: 'eigen-bijdrage-kosten', bronLabel: 'Landelijk', sorteerVolgorde: 1 },
    // Sub: Mantelzorgwaardering
    { id: 'fi-2', titel: 'Mantelzorgwaardering van je gemeente', beschrijving: 'Veel gemeenten geven jaarlijks een blijk van waardering aan mantelzorgers. Dit kan geld zijn, een cadeaubon of een activiteit. Vraag het aan bij je gemeente.', url: 'https://www.mantelzorg.nl/pro/onderwerpen/mantelzorgondersteuning/mantelzorgwaardering-door-gemeente/', bron: 'MantelzorgNL', emoji: '🎁', categorie: 'financieel', subHoofdstuk: 'mantelzorgwaardering', bronLabel: 'Gemeente (Wmo)', sorteerVolgorde: 2 },
    // Sub: Pgb aanvragen en beheer
    { id: 'fi-3', titel: 'Betaald worden via een PGB', beschrijving: 'Je naaste kan een persoonsgebonden budget (PGB) aanvragen. Daaruit kun jij als mantelzorger betaald worden. Je mag maximaal 40 uur per week declareren.', url: 'https://www.mantelzorg.nl/onderwerpen/persoonsgebonden-budget/wat-is-het-persoonsgebonden-budget/', bron: 'MantelzorgNL', emoji: '💶', categorie: 'financieel', subHoofdstuk: 'pgb-aanvragen-beheer', bronLabel: 'Landelijk', sorteerVolgorde: 3 },
    { id: 'fi-4', titel: 'Belasting en PGB-inkomen', beschrijving: 'Krijg je geld uit een PGB? Dan moet je dit opgeven bij de belastingaangifte als inkomsten uit overig werk. Let op: dit kan gevolgen hebben voor je toeslagen.', url: 'https://www.mantelzorg.nl/veelgestelde-vragen-belastingaangifte/', bron: 'MantelzorgNL', emoji: '📊', categorie: 'financieel', subHoofdstuk: 'pgb-aanvragen-beheer', bronLabel: 'Landelijk', sorteerVolgorde: 4 },
    // Sub: Vergoedingen hulpmiddelen
    { id: 'fi-5', titel: 'Vergoedingen hulpmiddelen: eerst aanvragen, dan kopen', beschrijving: 'Hulpmiddelen zoals een tillift, rolstoel of hoog-laag bed kunnen vergoed worden. Vraag altijd eerst vergoeding aan voordat je iets koopt.', url: 'https://www.rijksoverheid.nl/onderwerpen/mantelzorg/vraag-en-antwoord/hoe-kan-ik-als-mantelzorger-hulp-bij-de-zorg-krijgen', bron: 'Rijksoverheid', emoji: '🦽', categorie: 'financieel', subHoofdstuk: 'vergoedingen-hulpmiddelen', bronLabel: 'Landelijk', sorteerVolgorde: 5 },
    // === HULPMIDDELEN & PRODUCTEN (nieuw hoofdstuk) ===
    { id: 'hp-1', titel: 'Hulpmiddelenwijzer', beschrijving: 'Zoek het juiste hulpmiddel voor jouw situatie. Van tilliften tot rolstoelen, van aangepast bestek tot douchestoelen. Vergelijk en vind wat past.', url: 'https://www.hulpmiddelenwijzer.nl/', bron: 'Vilans', emoji: '🔍', categorie: 'hulpmiddelen-producten', subHoofdstuk: 'hulpmiddelen-overzicht', bronLabel: 'Landelijk', sorteerVolgorde: 1 },
    { id: 'hp-2', titel: 'Woningaanpassingen via de Wmo', beschrijving: 'Aanpassingen in huis zoals een traplift, drempels verwijderen of een aangepaste badkamer. Vraag dit aan via je gemeente (Wmo).', url: 'https://www.rijksoverheid.nl/onderwerpen/zorg-en-ondersteuning-thuis/wmo-2015', bron: 'Rijksoverheid', emoji: '🏠', categorie: 'hulpmiddelen-producten', subHoofdstuk: 'hulpmiddelen-overzicht', bronLabel: 'Gemeente (Wmo)', sorteerVolgorde: 2 },
    { id: 'hp-3', titel: 'Welk hulpmiddel via welke wet?', beschrijving: 'Vergoeding hangt af van je situatie. Wmo (gemeente), Zvw (zorgverzekeraar) of Wlz (zorgkantoor). Altijd eerst aanvragen, dan pas kopen.', url: 'https://www.hulpmiddelenwijzer.nl/', bron: 'Vilans', emoji: '🗺️', categorie: 'hulpmiddelen-producten', subHoofdstuk: 'vergoedingsroutes', bronLabel: 'Landelijk', sorteerVolgorde: 3 },
  ]

  for (const a of artikelenData) {
    await prisma.artikel.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        titel: a.titel,
        beschrijving: a.beschrijving,
        url: a.url,
        bron: a.bron,
        emoji: a.emoji,
        categorie: a.categorie,
        subHoofdstuk: (a as any).subHoofdstuk || null,
        bronLabel: (a as any).bronLabel || null,
        type: 'ARTIKEL',
        status: 'GEPUBLICEERD',
        belastingNiveau: 'ALLE',
        sorteerVolgorde: a.sorteerVolgorde,
        isActief: true,
      },
      update: {
        titel: a.titel,
        beschrijving: a.beschrijving,
        url: a.url,
        bron: a.bron,
        emoji: a.emoji,
        categorie: a.categorie,
        subHoofdstuk: (a as any).subHoofdstuk || null,
        bronLabel: (a as any).bronLabel || null,
        sorteerVolgorde: a.sorteerVolgorde,
      },
    })
  }
  console.log(`${artikelenData.length} artikelen seeded`)

  // Seed gemeentenieuws
  const gemeenteNieuwsData = [
    { id: 'gn-nijmegen-1', titel: 'Gratis mantelzorgcursus in Nijmegen', beschrijving: 'De gemeente Nijmegen biedt in maart een gratis cursus aan voor mantelzorgers. Je leert omgaan met stress en krijgt praktische tips. Aanmelden kan via de website van STIP Nijmegen.', gemeente: 'Nijmegen', datum: '2026-02-07', url: 'https://www.nijmegen.nl', emoji: '🎓' },
    { id: 'gn-nijmegen-2', titel: 'Mantelzorgwaardering Nijmegen 2026', beschrijving: 'Mantelzorgers in Nijmegen kunnen dit jaar weer de jaarlijkse waardering aanvragen. Dit is een bedrag van 200 euro. Aanvragen kan tot 1 juni via het Sociaal Wijkteam.', gemeente: 'Nijmegen', datum: '2026-02-01', url: 'https://www.nijmegen.nl', emoji: '🎁' },
    { id: 'gn-arnhem-1', titel: 'Nieuw steunpunt mantelzorg in Arnhem', beschrijving: 'In Arnhem-Zuid is een nieuw steunpunt geopend voor mantelzorgers. Je kunt er terecht voor advies, een kopje koffie en contact met andere mantelzorgers. Elke dinsdag en donderdag open.', gemeente: 'Arnhem', datum: '2026-02-05', url: 'https://www.arnhem.nl', emoji: '🏠' },
    { id: 'gn-arnhem-2', titel: 'Respijtzorg aanvragen in Arnhem vereenvoudigd', beschrijving: 'De gemeente Arnhem heeft het aanvragen van respijtzorg makkelijker gemaakt. Via het online formulier kun je nu binnen 5 werkdagen een antwoord verwachten.', gemeente: 'Arnhem', datum: '2026-01-28', url: 'https://www.arnhem.nl', emoji: '📝' },
    { id: 'gn-zutphen-1', titel: 'Lotgenotengroep mantelzorgers in Zutphen', beschrijving: 'In buurtcentrum De Hanzehof start in april een lotgenotengroep voor mantelzorgers. Elke twee weken kun je ervaringen delen en tips uitwisselen. Deelname is gratis. Aanmelden via Perspectief Zutphen.', gemeente: 'Zutphen', datum: '2026-02-06', url: 'https://www.zutphen.nl', emoji: '🤝' },
    { id: 'gn-zutphen-2', titel: 'Mantelzorgcompliment Zutphen: vraag het aan!', beschrijving: 'De gemeente Zutphen waardeert mantelzorgers met een jaarlijks compliment van 150 euro. Je kunt dit aanvragen via het Sociaal Wijkteam of online via de website van de gemeente.', gemeente: 'Zutphen', datum: '2026-01-20', url: 'https://www.zutphen.nl', emoji: '💐' },
  ]

  for (const gn of gemeenteNieuwsData) {
    await prisma.artikel.upsert({
      where: { id: gn.id },
      create: {
        id: gn.id,
        titel: gn.titel,
        beschrijving: gn.beschrijving,
        url: gn.url,
        emoji: gn.emoji,
        categorie: 'gemeentenieuws',
        type: 'GEMEENTE_NIEUWS',
        status: 'GEPUBLICEERD',
        belastingNiveau: 'ALLE',
        gemeente: gn.gemeente,
        publicatieDatum: new Date(gn.datum),
        isActief: true,
      },
      update: {
        titel: gn.titel,
        beschrijving: gn.beschrijving,
        url: gn.url,
        emoji: gn.emoji,
        gemeente: gn.gemeente,
        publicatieDatum: new Date(gn.datum),
      },
    })
  }
  console.log(`${gemeenteNieuwsData.length} gemeente nieuws items seeded`)

  // Create some sample resources
  const resources = [
    {
      title: 'Mantelzorglijn',
      description: 'Gratis telefonische ondersteuning voor mantelzorgers',
      url: 'https://mantelzorg.nl/mantelzorglijn',
      type: 'NATIONAL_SERVICE' as const,
      category: 'Ondersteuning',
      isNational: true,
    },
    {
      title: 'Respijtzorg',
      description: 'Tijdelijke overname van zorgtaken zodat je even op adem kunt komen',
      content: 'Respijtzorg is een vorm van zorg waarbij je zorgtaken tijdelijk worden overgenomen. Dit geeft je de kans om even bij te komen, een dagje weg te gaan, of gewoon rust te nemen.',
      type: 'ARTICLE' as const,
      category: 'Respijtzorg',
      isNational: true,
    },
    {
      title: 'Financiële regelingen mantelzorgers',
      description: 'Overzicht van financiële tegemoetkomingen voor mantelzorgers',
      url: 'https://www.rijksoverheid.nl/onderwerpen/mantelzorg',
      type: 'ARTICLE' as const,
      category: 'Financieel',
      isNational: true,
    },
  ]

  for (const resource of resources) {
    await prisma.resource.upsert({
      where: { id: resource.title.toLowerCase().replace(/\s+/g, '-') },
      create: {
        id: resource.title.toLowerCase().replace(/\s+/g, '-'),
        ...resource,
      },
      update: resource,
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
