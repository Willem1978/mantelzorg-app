import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60

export async function POST(request: Request) {
  // Beveilig met AUTH_SECRET
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.AUTH_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: string[] = []

  try {
    // 1. Admin user
    const adminPassword = await bcrypt.hash("Wessel03!", 12)
    await prisma.user.upsert({
      where: { email: "w.veenendaal@livelife.nl" },
      create: { email: "w.veenendaal@livelife.nl", name: "Willem Veenendaal", password: adminPassword, role: "ADMIN" },
      update: { password: adminPassword, role: "ADMIN" },
    })
    results.push("Admin user created")

    // 2. Intake categories + questions
    const categories = [
      { name: "Zorgsituatie", description: "Vragen over je huidige zorgsituatie", order: 1, questions: [
        { id: "q1", question: "Ik heb een goed overzicht van alle zorgtaken die ik uitvoer", order: 1 },
        { id: "q2", question: "De hoeveelheid zorg die ik geef past bij wat ik aankan", order: 2 },
        { id: "q3", question: "Ik kan de zorg goed combineren met mijn andere verantwoordelijkheden", order: 3 },
      ]},
      { name: "Fysiek welzijn", description: "Hoe beinvloedt de zorg je lichamelijk?", order: 2, questions: [
        { id: "q4", question: "Ik voel me lichamelijk fit genoeg voor de zorgtaken", order: 1 },
        { id: "q5", question: "Ik krijg voldoende slaap en rust", order: 2 },
        { id: "q6", question: "Ik heb voldoende energie voor mezelf over na de zorgtaken", order: 3 },
      ]},
      { name: "Emotioneel welzijn", description: "Hoe voel je je emotioneel?", order: 3, questions: [
        { id: "q7", question: "Ik voel me emotioneel in balans", order: 1 },
        { id: "q8", question: "Ik heb voldoende mensen om mee te praten over mijn zorgsituatie", order: 2 },
        { id: "q9", question: "Ik maak me weinig zorgen over de toekomst van de zorgsituatie", order: 3 },
      ]},
      { name: "Sociale contacten", description: "Hoe is je sociale leven?", order: 4, questions: [
        { id: "q10", question: "Ik heb voldoende tijd voor sociale activiteiten", order: 1 },
        { id: "q11", question: "Mijn vrienden en familie begrijpen mijn situatie als mantelzorger", order: 2 },
        { id: "q12", question: "Ik voel me niet geisoleerd door mijn zorgtaken", order: 3 },
      ]},
      { name: "Ondersteuning", description: "Welke hulp heb je nodig?", order: 5, questions: [
        { id: "q13", question: "Ik weet waar ik terecht kan voor hulp en ondersteuning", order: 1 },
        { id: "q14", question: "Ik krijg voldoende praktische hulp bij de zorgtaken", order: 2 },
        { id: "q15", question: "Is er nog iets dat je wilt delen over je situatie?", order: 3, type: "TEXT" as const },
      ]},
    ]

    for (const cat of categories) {
      const category = await prisma.intakeCategory.upsert({
        where: { id: cat.name.toLowerCase().replace(/\s+/g, "-") },
        create: { id: cat.name.toLowerCase().replace(/\s+/g, "-"), name: cat.name, description: cat.description, order: cat.order },
        update: { description: cat.description, order: cat.order },
      })
      for (const q of cat.questions) {
        await prisma.intakeQuestion.upsert({
          where: { id: q.id },
          create: { id: q.id, categoryId: category.id, question: q.question, type: (q as any).type || "SCALE", order: q.order, isRequired: true },
          update: { question: q.question, type: (q as any).type || "SCALE", order: q.order },
        })
      }
    }
    results.push("5 intake categories + 15 questions")

    // 3. Artikelen
    const artikelenData = [
      { id: "pt-1", titel: "Dagstructuur en weekplanning", beschrijving: "Een vaste dagindeling geeft rust. Maak een weekplanning en bekijk wat je kunt uitbesteden. Zo houd je overzicht en bespaar je energie.", url: "https://www.mantelzorg.nl/onderwerpen/balans/", bron: "MantelzorgNL", emoji: "\u{1F4C5}", categorie: "praktische-tips", subHoofdstuk: "dagelijks-organiseren", bronLabel: "Landelijk", sorteerVolgorde: 1 },
      { id: "pt-2", titel: "Tips voor veilig medicijngebruik", beschrijving: "Als mantelzorger help je vaak met medicijnen. Neem altijd het medicijnoverzicht mee naar de dokter. Let op veranderingen zoals sufheid of verwardheid.", url: "https://www.zorgvoorbeter.nl/thema-s/medicatieveiligheid", bron: "Zorg voor Beter", emoji: "\u{1F48A}", categorie: "praktische-tips", subHoofdstuk: "dagelijks-organiseren", bronLabel: "Landelijk", sorteerVolgorde: 2 },
      { id: "pt-6", titel: "Zorgrooster maken met familie", beschrijving: "Verdeel de zorgtaken over meerdere mensen. Maak een rooster zodat iedereen weet wanneer hij of zij aan de beurt is. Gebruik een gedeelde agenda.", url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/", bron: "MantelzorgNL", emoji: "\u{1F4CB}", categorie: "praktische-tips", subHoofdstuk: "dagelijks-organiseren", bronLabel: "Landelijk", sorteerVolgorde: 3 },
      { id: "pt-3", titel: "Samenwerken met de thuiszorg", beschrijving: "Maak goede afspraken met de thuiszorg of het verpleeghuis. Bespreek het zorgplan en maak een zorgrooster. Zo weet iedereen wie wat doet.", url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/", bron: "MantelzorgNL", emoji: "\u{1F91D}", categorie: "praktische-tips", subHoofdstuk: "samen-organiseren", bronLabel: "Landelijk", sorteerVolgorde: 4 },
      { id: "pt-4", titel: "Communiceren met je naaste", beschrijving: "Praten wordt soms moeilijker. Gebruik korte zinnen, maak oogcontact en geef de tijd om te antwoorden. Geduld en begrip maken een groot verschil.", url: "https://www.dementie.nl/omgaan-met-dementie/communiceren-bij-dementie/tien-tips-voor-betere-communicatie", bron: "Dementie.nl", emoji: "\u{1F4AC}", categorie: "praktische-tips", subHoofdstuk: "samen-organiseren", bronLabel: "Landelijk", sorteerVolgorde: 5 },
      { id: "pt-7", titel: "Hulp vragen aan je omgeving", beschrijving: "Veel mensen willen wel helpen, maar weten niet hoe. Durf concreet te vragen: kun je maandag koken? Zo maak je het makkelijk om ja te zeggen.", url: "https://www.mantelzorg.nl/onderwerpen/balans/", bron: "MantelzorgNL", emoji: "\u{1F64B}", categorie: "praktische-tips", subHoofdstuk: "samen-organiseren", bronLabel: "Landelijk", sorteerVolgorde: 6 },
      { id: "pt-5", titel: "Veilig tillen en verplaatsen", beschrijving: "Leer hoe je iemand veilig helpt bij het opstaan of verplaatsen. Gebruik hulpmiddelen zoals een tillift of glijzeil. Zo voorkom je rugklachten.", url: "https://www.hulpmiddelenwijzer.nl/", bron: "Hulpmiddelenwijzer", emoji: "\u{1F3CB}\uFE0F", categorie: "praktische-tips", subHoofdstuk: "veiligheid-zware-taken", bronLabel: "Landelijk", sorteerVolgorde: 7 },
      { id: "pt-8", titel: "Valpreventie in huis", beschrijving: "Voorkom vallen door losse snoeren, kleedjes en drempels weg te halen. Zorg voor goede verlichting en steunpunten. Vraag de thuiszorg om advies.", url: "https://www.thuisarts.nl/vallen/ik-wil-vallen-voorkomen", bron: "Thuisarts.nl", emoji: "\u26A1", categorie: "praktische-tips", subHoofdstuk: "veiligheid-zware-taken", bronLabel: "Landelijk", sorteerVolgorde: 8 },
      { id: "pt-9", titel: "Dagstructuur bij dementie", beschrijving: "Een vaste dagindeling geeft rust voor iemand met dementie. Begin vroeg met dagbesteding. Het geeft structuur en jij hebt even tijd voor jezelf.", url: "https://www.dementie.nl/zorg-en-regelzaken/zorg-en-hulp-voor-thuis/dagbesteding-voor-je-naaste-met-dementie", bron: "Dementie.nl", emoji: "\u{1F9E0}", categorie: "praktische-tips", subHoofdstuk: "dagelijks-organiseren", bronLabel: "Landelijk", sorteerVolgorde: 9 },
      { id: "zz-1", titel: "Herken overbelasting op tijd", beschrijving: "Mantelzorg kan zwaar zijn. Let op signalen zoals slecht slapen, prikkelbaar zijn of je somber voelen. Neem het serieus en zoek hulp als het te veel wordt.", url: "https://www.mantelzorg.nl/onderwerpen/balans/overbelasting-en-mantelzorg/", bron: "MantelzorgNL", emoji: "\u26A0\uFE0F", categorie: "zelfzorg", subHoofdstuk: "overbelasting-herkennen", bronLabel: "Landelijk", sorteerVolgorde: 1 },
      { id: "zz-2", titel: "Grenzen stellen als mantelzorger", beschrijving: "Je wilt graag helpen, maar je kunt niet alles doen. Gezonde grenzen zijn nodig om het vol te houden. Leer hoe je nee zegt zonder je schuldig te voelen.", url: "https://www.mantelzorg.nl/onderwerpen/balans/mantelzorgen-met-gezonde-grenzen/", bron: "MantelzorgNL", emoji: "\u{1F6D1}", categorie: "zelfzorg", subHoofdstuk: "overbelasting-herkennen", bronLabel: "Landelijk", sorteerVolgorde: 2 },
      { id: "zz-6", titel: "De mantelzorgtest: hoe belast ben jij?", beschrijving: "Doe de online test en ontdek hoe het met je gaat. Je krijgt tips die passen bij jouw situatie. Het duurt maar een paar minuten.", url: "https://www.mantelzorg.nl/onderwerpen/balans/", bron: "MantelzorgNL", emoji: "\u{1F4CA}", categorie: "zelfzorg", subHoofdstuk: "overbelasting-herkennen", bronLabel: "Landelijk", sorteerVolgorde: 3 },
      { id: "zz-3", titel: "Respijtzorg: even vrij van zorgen", beschrijving: "Geef de zorg tijdelijk aan iemand anders. Dat heet respijtzorg. Denk aan dagopvang, een logeerhuis of een vrijwilliger aan huis. Zo heb jij even rust.", url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/", bron: "MantelzorgNL", emoji: "\u{1F33F}", categorie: "zelfzorg", subHoofdstuk: "pauze-en-respijt", bronLabel: "Gemeente (Wmo)", sorteerVolgorde: 4 },
      { id: "zz-7", titel: "Logeeropvang en vakantiemogelijkheden", beschrijving: "Je naaste kan tijdelijk logeren in een zorginstelling zodat jij op vakantie kunt. Vraag het aan via je gemeente of zorgkantoor. Plan het op tijd.", url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/", bron: "MantelzorgNL", emoji: "\u{1F3D6}\uFE0F", categorie: "zelfzorg", subHoofdstuk: "pauze-en-respijt", bronLabel: "Gemeente (Wmo)", sorteerVolgorde: 5 },
      { id: "zz-4", titel: "Werk en mantelzorg combineren", beschrijving: "Veel mantelzorgers werken ook. Praat erover met je werkgever. Vaak is er meer mogelijk dan je denkt, zoals thuiswerken of aangepaste werktijden.", url: "https://www.mantelzorg.nl/onderwerpen/werk/werkende-mantelzorgers-valkuilen-en-tips/", bron: "MantelzorgNL", emoji: "\u{1F4BC}", categorie: "zelfzorg", subHoofdstuk: "emotionele-steun", bronLabel: "Landelijk", sorteerVolgorde: 6 },
      { id: "zz-5", titel: "De Mantelzorglijn: praat met iemand", beschrijving: "Heb je vragen of wil je je verhaal kwijt? Bel de Mantelzorglijn op 030 760 60 55. Je kunt ook WhatsAppen of mailen. Ze staan voor je klaar.", url: "https://www.mantelzorg.nl/onderwerpen/ondersteuning/waar-kun-je-terecht/mantelzorglijn", bron: "MantelzorgNL", emoji: "\u{1F4DE}", categorie: "zelfzorg", subHoofdstuk: "emotionele-steun", bronLabel: "Landelijk", sorteerVolgorde: 7 },
      { id: "zz-8", titel: "Lotgenotencontact: praat met andere mantelzorgers", beschrijving: "Het helpt om te praten met mensen die hetzelfde meemaken. Via MantelzorgNL of je steunpunt vind je lotgenotengroepen bij jou in de buurt.", url: "https://www.mantelzorg.nl/onderwerpen/ondersteuning/", bron: "MantelzorgNL", emoji: "\u{1F465}", categorie: "zelfzorg", subHoofdstuk: "emotionele-steun", bronLabel: "Landelijk", sorteerVolgorde: 8 },
      { id: "re-1", titel: "De Wmo: hulp via je gemeente", beschrijving: "Via de Wet maatschappelijke ondersteuning (Wmo) kun je hulp krijgen van je gemeente. Denk aan huishoudelijke hulp, vervoer of aanpassingen in huis.", url: "https://www.mantelzorg.nl/onderwerpen/wetten/wmo-en-mantelzorg/", bron: "MantelzorgNL", emoji: "\u{1F3DB}\uFE0F", categorie: "rechten", subHoofdstuk: "routekaart-wmo-zvw-wlz", bronLabel: "Landelijk", sorteerVolgorde: 1 },
      { id: "re-2", titel: "Mantelzorg is altijd vrijwillig", beschrijving: "De gemeente mag je niet verplichten om mantelzorg te geven. Je mag altijd nee zeggen. Vraag de gemeente dan om een andere oplossing te zoeken.", url: "https://www.mantelzorg.nl/onderwerpen/wetten/rechten-en-plichten-van-de-mantelzorger/", bron: "MantelzorgNL", emoji: "\u270B", categorie: "rechten", subHoofdstuk: "routekaart-wmo-zvw-wlz", bronLabel: "Landelijk", sorteerVolgorde: 2 },
      { id: "re-4", titel: "Recht op zorgverlof van je werk", beschrijving: "Als werknemer heb je recht op kortdurend zorgverlof (70% loon) en langdurend zorgverlof (onbetaald). Je werkgever mag dit alleen weigeren bij ernstige bedrijfsproblemen.", url: "https://www.rijksoverheid.nl/onderwerpen/zorgverlof", bron: "Rijksoverheid", emoji: "\u{1F4CB}", categorie: "rechten", subHoofdstuk: "routekaart-wmo-zvw-wlz", bronLabel: "Landelijk", sorteerVolgorde: 3 },
      { id: "re-6", titel: "Recht op respijtzorg", beschrijving: "Je hebt recht op tijdelijke vervanging van de zorg. Dit kan via de Wmo, de Wlz of je zorgverzekeraar. De eigen bijdrage is maximaal 21 euro per maand.", url: "https://www.mantelzorg.nl/onderwerpen/vervangende-zorg/wie-betaalt-voor-respijtzorg/", bron: "MantelzorgNL", emoji: "\u{1F504}", categorie: "rechten", subHoofdstuk: "routekaart-wmo-zvw-wlz", bronLabel: "Landelijk", sorteerVolgorde: 4 },
      { id: "re-7", titel: "De Wlz: langdurige zorg", beschrijving: "Bij blijvende, intensieve zorg kan je naaste in aanmerking komen voor de Wet langdurige zorg (Wlz). Het CIZ beoordeelt of iemand hiervoor in aanmerking komt.", url: "https://www.rijksoverheid.nl/onderwerpen/verpleeghuizen-en-zorginstellingen/wet-langdurige-zorg-wlz", bron: "Rijksoverheid", emoji: "\u{1F3E5}", categorie: "rechten", subHoofdstuk: "routekaart-wmo-zvw-wlz", bronLabel: "Landelijk", sorteerVolgorde: 5 },
      { id: "re-3", titel: "Het keukentafelgesprek", beschrijving: "De gemeente nodigt je uit voor een gesprek over de zorg. Dit heet het keukentafelgesprek. Ga er altijd bij zitten, want het gaat ook over hulp aan jou.", url: "https://www.rijksoverheid.nl/onderwerpen/zorg-en-ondersteuning-thuis/vraag-en-antwoord/hoe-vraag-ik-een-wmo-voorziening-aan", bron: "Rijksoverheid", emoji: "\u2615", categorie: "rechten", subHoofdstuk: "gemeente-wmo-aanvragen", bronLabel: "Gemeente (Wmo)", sorteerVolgorde: 6 },
      { id: "re-8", titel: "Bezwaar maken tegen een beslissing", beschrijving: "Ben je het niet eens met de beslissing van je gemeente? Je kunt bezwaar maken. Dat moet binnen zes weken. Een clientondersteuner kan je hierbij helpen.", url: "https://www.rijksoverheid.nl/onderwerpen/zorg-en-ondersteuning-thuis/vraag-en-antwoord/niet-eens-besluit-wmo", bron: "Rijksoverheid", emoji: "\u{1F4E2}", categorie: "rechten", subHoofdstuk: "gemeente-wmo-aanvragen", bronLabel: "Gemeente (Wmo)", sorteerVolgorde: 7 },
      { id: "re-5", titel: "Gratis onafhankelijke clientondersteuning", beschrijving: "Kom je er niet uit? Een clientondersteuner helpt gratis bij het organiseren van zorg en ondersteuning. Onafhankelijk en via gemeente of Wlz-route beschikbaar.", url: "https://www.regelhulp.nl/onderwerpen/clientondersteuning", bron: "Rijksoverheid", emoji: "\u{1F91D}", categorie: "rechten", subHoofdstuk: "clientondersteuning", bronLabel: "Landelijk", sorteerVolgorde: 8 },
      { id: "re-9", titel: "Regelhulp: welke zorg past bij jou?", beschrijving: "Via Regelhulp.nl vind je snel welke hulp en ondersteuning er is voor jouw situatie. Beantwoord een paar vragen en krijg een persoonlijk advies.", url: "https://www.regelhulp.nl/", bron: "Rijksoverheid", emoji: "\u{1F9ED}", categorie: "rechten", subHoofdstuk: "clientondersteuning", bronLabel: "Landelijk", sorteerVolgorde: 9 },
      { id: "fi-1", titel: "Eigen bijdrage en kosten (CAK)", beschrijving: "Voor Wmo- en Wlz-zorg betaal je een eigen bijdrage. Het abonnementstarief voor Wmo is maximaal 21,80 euro per maand. Controleer je bijdrage via het CAK.", url: "https://www.hetcak.nl/", bron: "CAK", emoji: "\u{1F4B0}", categorie: "financieel", subHoofdstuk: "eigen-bijdrage-kosten", bronLabel: "Landelijk", sorteerVolgorde: 1 },
      { id: "fi-6", titel: "Zorgkosten aftrekken bij de belasting", beschrijving: "Hoge zorgkosten? Die kun je soms aftrekken bij je belastingaangifte. Denk aan medicijnen, hulpmiddelen of reiskosten naar het ziekenhuis.", url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/aftrek-en-kortingen/content/aftrek-specifieke-zorgkosten", bron: "Belastingdienst", emoji: "\u{1F9FE}", categorie: "financieel", subHoofdstuk: "eigen-bijdrage-kosten", bronLabel: "Landelijk", sorteerVolgorde: 2 },
      { id: "fi-2", titel: "Mantelzorgwaardering van je gemeente", beschrijving: "Veel gemeenten geven jaarlijks een blijk van waardering aan mantelzorgers. Dit kan geld zijn, een cadeaubon of een activiteit. Vraag het aan bij je gemeente.", url: "https://www.mantelzorg.nl/onderwerpen/geldzaken/mantelzorgwaardering", bron: "MantelzorgNL", emoji: "\u{1F381}", categorie: "financieel", subHoofdstuk: "mantelzorgwaardering", bronLabel: "Gemeente (Wmo)", sorteerVolgorde: 3 },
      { id: "fi-7", titel: "Mantelzorgcompliment aanvragen", beschrijving: "Het mantelzorgcompliment is een geldbedrag of cadeaubon van je gemeente. Je kunt het aanvragen via het Sociaal Wijkteam of de website van je gemeente.", url: "https://www.mantelzorg.nl/onderwerpen/geldzaken/mantelzorgwaardering", bron: "MantelzorgNL", emoji: "\u{1F49D}", categorie: "financieel", subHoofdstuk: "mantelzorgwaardering", bronLabel: "Gemeente (Wmo)", sorteerVolgorde: 4 },
      { id: "fi-3", titel: "Betaald worden via een PGB", beschrijving: "Je naaste kan een persoonsgebonden budget (PGB) aanvragen. Daaruit kun jij als mantelzorger betaald worden. Je mag maximaal 40 uur per week declareren.", url: "https://www.mantelzorg.nl/onderwerpen/persoonsgebonden-budget/", bron: "MantelzorgNL", emoji: "\u{1F4B6}", categorie: "financieel", subHoofdstuk: "pgb-aanvragen-beheer", bronLabel: "Landelijk", sorteerVolgorde: 5 },
      { id: "fi-4", titel: "Belasting en PGB-inkomen", beschrijving: "Krijg je geld uit een PGB? Dan moet je dit opgeven bij de belastingaangifte als inkomsten uit overig werk. Let op: dit kan gevolgen hebben voor je toeslagen.", url: "https://www.svb.nl/nl/pgb", bron: "SVB", emoji: "\u{1F4CA}", categorie: "financieel", subHoofdstuk: "pgb-aanvragen-beheer", bronLabel: "Landelijk", sorteerVolgorde: 6 },
      { id: "fi-8", titel: "PGB declareren via de SVB", beschrijving: "De Sociale Verzekeringsbank (SVB) beheert je PGB. Via het SVB-portaal declareer je uren en wordt je zorgverlener betaald. Houd je administratie bij.", url: "https://www.svb.nl/nl/pgb", bron: "SVB", emoji: "\u{1F3E6}", categorie: "financieel", subHoofdstuk: "pgb-aanvragen-beheer", bronLabel: "Landelijk", sorteerVolgorde: 7 },
      { id: "fi-5", titel: "Vergoedingen hulpmiddelen: eerst aanvragen, dan kopen", beschrijving: "Hulpmiddelen zoals een tillift, rolstoel of hoog-laag bed kunnen vergoed worden. Vraag altijd eerst vergoeding aan voordat je iets koopt.", url: "https://www.regelhulp.nl/onderwerpen/hulpmiddelen/hulpmiddelen-thuis-wonen", bron: "Rijksoverheid", emoji: "\u{1F9BD}", categorie: "financieel", subHoofdstuk: "vergoedingen-hulpmiddelen", bronLabel: "Landelijk", sorteerVolgorde: 8 },
      { id: "fi-9", titel: "Zorgtoeslag en huurtoeslag", beschrijving: "Als je een laag inkomen hebt, kun je zorgtoeslag en huurtoeslag aanvragen. Mantelzorgen kan invloed hebben op je inkomen en daarmee op je toeslagen.", url: "https://www.toeslagen.nl/", bron: "Belastingdienst", emoji: "\u{1F4B3}", categorie: "financieel", subHoofdstuk: "vergoedingen-hulpmiddelen", bronLabel: "Landelijk", sorteerVolgorde: 9 },
      { id: "hp-1", titel: "Hulpmiddelenwijzer", beschrijving: "Zoek het juiste hulpmiddel voor jouw situatie. Van tilliften tot rolstoelen, van aangepast bestek tot douchestoelen. Vergelijk en vind wat past.", url: "https://www.hulpmiddelenwijzer.nl/", bron: "Vilans", emoji: "\u{1F50D}", categorie: "hulpmiddelen-producten", subHoofdstuk: "hulpmiddelen-overzicht", bronLabel: "Landelijk", sorteerVolgorde: 1 },
      { id: "hp-2", titel: "Woningaanpassingen via de Wmo", beschrijving: "Aanpassingen in huis zoals een traplift, drempels verwijderen of een aangepaste badkamer. Vraag dit aan via je gemeente (Wmo).", url: "https://www.regelhulp.nl/onderwerpen/hulpmiddelen/hulpmiddelen-thuis-wonen", bron: "Rijksoverheid", emoji: "\u{1F3E0}", categorie: "hulpmiddelen-producten", subHoofdstuk: "hulpmiddelen-overzicht", bronLabel: "Gemeente (Wmo)", sorteerVolgorde: 2 },
      { id: "hp-4", titel: "Douchestoel, toiletverhoger en badlift", beschrijving: "Kleine aanpassingen in de badkamer maken een groot verschil. Een douchestoel, toiletverhoger of badlift helpt bij de persoonlijke verzorging.", url: "https://www.hulpmiddelenwijzer.nl/", bron: "Vilans", emoji: "\u{1F6BF}", categorie: "hulpmiddelen-producten", subHoofdstuk: "hulpmiddelen-overzicht", bronLabel: "Landelijk", sorteerVolgorde: 3 },
      { id: "hp-5", titel: "Rollator, rolstoel en scootmobiel", beschrijving: "Voor als lopen moeilijk wordt. Een rollator voor in huis, een rolstoel voor langere afstanden of een scootmobiel voor buiten. Vraag advies bij een ergotherapeut.", url: "https://www.hulpmiddelenwijzer.nl/", bron: "Vilans", emoji: "\u267F", categorie: "hulpmiddelen-producten", subHoofdstuk: "hulpmiddelen-overzicht", bronLabel: "Landelijk", sorteerVolgorde: 4 },
      { id: "hp-6", titel: "Personenalarmering en GPS-tracker", beschrijving: "Een alarmknop om de hals of pols geeft zekerheid. Bij een val of noodsituatie wordt direct hulp ingeschakeld. Er zijn ook GPS-trackers voor mensen met dementie.", url: "https://www.thuisarts.nl/personenalarmering", bron: "Thuisarts.nl", emoji: "\u{1F198}", categorie: "hulpmiddelen-producten", subHoofdstuk: "hulpmiddelen-overzicht", bronLabel: "Landelijk", sorteerVolgorde: 5 },
      { id: "hp-3", titel: "Welk hulpmiddel via welke wet?", beschrijving: "Vergoeding hangt af van je situatie. Wmo (gemeente), Zvw (zorgverzekeraar) of Wlz (zorgkantoor). Altijd eerst aanvragen, dan pas kopen.", url: "https://www.hulpmiddelenwijzer.nl/", bron: "Vilans", emoji: "\u{1F5FA}\uFE0F", categorie: "hulpmiddelen-producten", subHoofdstuk: "vergoedingsroutes", bronLabel: "Landelijk", sorteerVolgorde: 6 },
      { id: "hp-7", titel: "Hulpmiddelen via je zorgverzekeraar", beschrijving: "Sommige hulpmiddelen vallen onder je zorgverzekering (Zvw). Denk aan verbandmiddelen, stoma-materiaal of een CPAP-apparaat. Check je polis of bel je verzekeraar.", url: "https://www.zorgwijzer.nl/vergoeding/hulpmiddelen", bron: "Zorgwijzer", emoji: "\u{1F3F7}\uFE0F", categorie: "hulpmiddelen-producten", subHoofdstuk: "vergoedingsroutes", bronLabel: "Landelijk", sorteerVolgorde: 7 },
    ]

    for (const a of artikelenData) {
      await prisma.artikel.upsert({
        where: { id: a.id },
        create: { id: a.id, titel: a.titel, beschrijving: a.beschrijving, url: a.url, bron: a.bron, emoji: a.emoji, categorie: a.categorie, subHoofdstuk: a.subHoofdstuk, bronLabel: a.bronLabel, type: "ARTIKEL", status: "GEPUBLICEERD", belastingNiveau: "ALLE", sorteerVolgorde: a.sorteerVolgorde, isActief: true },
        update: { titel: a.titel, beschrijving: a.beschrijving, url: a.url, bron: a.bron, emoji: a.emoji, categorie: a.categorie, subHoofdstuk: a.subHoofdstuk, bronLabel: a.bronLabel, sorteerVolgorde: a.sorteerVolgorde },
      })
    }
    results.push(`${artikelenData.length} artikelen`)

    // 4. Gemeente nieuws
    const gemeenteNieuwsData = [
      { id: "gn-nijmegen-1", titel: "Gratis mantelzorgcursus in Nijmegen", beschrijving: "De gemeente Nijmegen biedt in maart een gratis cursus aan voor mantelzorgers. Je leert omgaan met stress en krijgt praktische tips. Aanmelden kan via de website van STIP Nijmegen.", gemeente: "Nijmegen", datum: "2026-02-07", url: "https://www.nijmegen.nl", emoji: "\u{1F393}" },
      { id: "gn-nijmegen-2", titel: "Mantelzorgwaardering Nijmegen 2026", beschrijving: "Mantelzorgers in Nijmegen kunnen dit jaar weer de jaarlijkse waardering aanvragen. Dit is een bedrag van 200 euro. Aanvragen kan tot 1 juni via het Sociaal Wijkteam.", gemeente: "Nijmegen", datum: "2026-02-01", url: "https://www.nijmegen.nl", emoji: "\u{1F381}" },
      { id: "gn-arnhem-1", titel: "Nieuw steunpunt mantelzorg in Arnhem", beschrijving: "In Arnhem-Zuid is een nieuw steunpunt geopend voor mantelzorgers. Je kunt er terecht voor advies, een kopje koffie en contact met andere mantelzorgers. Elke dinsdag en donderdag open.", gemeente: "Arnhem", datum: "2026-02-05", url: "https://www.arnhem.nl", emoji: "\u{1F3E0}" },
      { id: "gn-arnhem-2", titel: "Respijtzorg aanvragen in Arnhem vereenvoudigd", beschrijving: "De gemeente Arnhem heeft het aanvragen van respijtzorg makkelijker gemaakt. Via het online formulier kun je nu binnen 5 werkdagen een antwoord verwachten.", gemeente: "Arnhem", datum: "2026-01-28", url: "https://www.arnhem.nl", emoji: "\u{1F4DD}" },
      { id: "gn-zutphen-1", titel: "Lotgenotengroep mantelzorgers in Zutphen", beschrijving: "In buurtcentrum De Hanzehof start in april een lotgenotengroep voor mantelzorgers. Elke twee weken kun je ervaringen delen en tips uitwisselen. Deelname is gratis. Aanmelden via Perspectief Zutphen.", gemeente: "Zutphen", datum: "2026-02-06", url: "https://www.zutphen.nl", emoji: "\u{1F91D}" },
      { id: "gn-zutphen-2", titel: "Mantelzorgcompliment Zutphen: vraag het aan!", beschrijving: "De gemeente Zutphen waardeert mantelzorgers met een jaarlijks compliment van 150 euro. Je kunt dit aanvragen via het Sociaal Wijkteam of online via de website van de gemeente.", gemeente: "Zutphen", datum: "2026-01-20", url: "https://www.zutphen.nl", emoji: "\u{1F490}" },
    ]

    for (const gn of gemeenteNieuwsData) {
      await prisma.artikel.upsert({
        where: { id: gn.id },
        create: { id: gn.id, titel: gn.titel, beschrijving: gn.beschrijving, url: gn.url, emoji: gn.emoji, categorie: "gemeentenieuws", type: "GEMEENTE_NIEUWS", status: "GEPUBLICEERD", belastingNiveau: "ALLE", gemeente: gn.gemeente, publicatieDatum: new Date(gn.datum), isActief: true },
        update: { titel: gn.titel, beschrijving: gn.beschrijving, url: gn.url, emoji: gn.emoji, gemeente: gn.gemeente, publicatieDatum: new Date(gn.datum) },
      })
    }
    results.push(`${gemeenteNieuwsData.length} gemeente nieuws items`)

    // 5. Resources
    const resources = [
      { title: "Mantelzorglijn", description: "Gratis telefonische ondersteuning voor mantelzorgers", url: "https://www.mantelzorg.nl/onderwerpen/ondersteuning/waar-kun-je-terecht/mantelzorglijn", type: "NATIONAL_SERVICE" as const, category: "Ondersteuning", isNational: true },
      { title: "Respijtzorg", description: "Tijdelijke overname van zorgtaken zodat je even op adem kunt komen", content: "Respijtzorg is een vorm van zorg waarbij je zorgtaken tijdelijk worden overgenomen.", type: "ARTICLE" as const, category: "Respijtzorg", isNational: true },
      { title: "Financiele regelingen mantelzorgers", description: "Overzicht van financiele tegemoetkomingen voor mantelzorgers", url: "https://www.rijksoverheid.nl/onderwerpen/mantelzorg", type: "ARTICLE" as const, category: "Financieel", isNational: true },
    ]

    for (const resource of resources) {
      await prisma.resource.upsert({
        where: { id: resource.title.toLowerCase().replace(/\s+/g, "-") },
        create: { id: resource.title.toLowerCase().replace(/\s+/g, "-"), ...resource },
        update: resource,
      })
    }
    results.push(`${resources.length} resources`)

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Seed artikelen error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
