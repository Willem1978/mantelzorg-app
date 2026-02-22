import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ZorgorganisatieType } from "@prisma/client"

export const maxDuration = 120

// Zutphen hulpbronnen data - bron: Sociale Kaart Zutphen 2026 (Excel)
// Dit is de ENIGE bron voor Zutphen data. Niet dupliceren in andere seed routes.

interface OrgData {
  naam: string
  beschrijving: string
  type: ZorgorganisatieType
  telefoon?: string
  website?: string
  gemeente: string
  onderdeelTest: string
  soortHulp: string
  doelgroep?: string
  kosten?: string
  zichtbaarBijLaag: boolean
  zichtbaarBijGemiddeld: boolean
  zichtbaarBijHoog: boolean
}

// ===== HULP VOOR DE MANTELZORGER (Tabblad 1) =====
const mantelzorgerHulp: OrgData[] = [
  {
    naam: 'Perspectief Zutphen - Mantelzorgcoördinator',
    beschrijving: 'De mantelzorgcoördinator helpt en begeleidt mensen die voor een naaste zorgen. Een mantelzorgcoördinator geeft advies, informatie en een luisterend oor. Ook denkt deze mee over welke extra hulp mogelijk is. Naast deze algemene hulp weet deze persoon veel over de hulpkansen in de wijk en over het aanbod van hulp in Zutphen.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur',
    type: 'MANTELZORGSTEUNPUNT',
    telefoon: '0575 - 519613',
    gemeente: 'Zutphen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'MantelzorgNL - Mantelzorglijn',
    beschrijving: 'Zorg je voor een naaste en heb je vragen of zorgen? Wil je graag een advies over jouw mantelzorgsituatie? Of wil je gewoon je verhaal kwijt? De medewerkers van de Mantelzorglijn staan voor je klaar.',
    type: 'OVERIG',
    telefoon: '030 - 7606055',
    website: 'https://www.mantelzorg.nl/onderwerpen/ondersteuning/waar-kun-je-terecht/mantelzorglijn',
    gemeente: 'Zutphen',
    onderdeelTest: 'Emotionele steun',
    soortHulp: 'Emotionele steun',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Kruiswerk - Mantelzorghulplijn',
    beschrijving: 'Via de mantelzorghulplijn van Kruiswerk krijg je direct hulp in de vorm van praktische informatie, diensten aan huis of een verwijzing naar precies die organisatie waar jij wat aan hebt.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur',
    type: 'OVERIG',
    telefoon: '0314 - 357070',
    website: 'https://www.kruiswerk.nl/mantelzorghulplijn',
    gemeente: 'Zutphen',
    onderdeelTest: 'Emotionele steun',
    soortHulp: 'Emotionele steun',
    doelgroep: 'Alle mantelzorgers',
    kosten: 'Gratis bij lidmaatschap à € 26,50 per jaar',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
  {
    naam: 'Mantelzorgmakelaar',
    beschrijving: 'Bij sommige aanvullende zorgverzekeringen krijgt u een vergoeding voor een mantelzorgmakelaar. Een mantelzorgmakelaar biedt professionele ondersteuning bij de regeltaken, helpt u op weg met het ingewikkelde zorgstelsel en kent de belangrijkste wetten en regels voor mantelzorgers.',
    type: 'OVERIG',
    gemeente: 'Zutphen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Mantelzorgers met aanvullende zorgverzekering',
    kosten: 'Via sommige aanvullende zorgverzekeringen',
    zichtbaarBijLaag: true,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: false,
  },
  {
    naam: 'MEE Samen - Onafhankelijke cliëntondersteuning',
    beschrijving: 'Een onafhankelijke cliëntondersteuner helpt en begeleidt mensen die voor een naaste zorgen. Een onafhankelijke cliëntondersteuner geeft advies, informatie en een luisterend oor. Ook denkt deze mee over welke extra hulp mogelijk is. Naast deze algemene hulp weet deze persoon veel over het aanvragen van de Wlz en het uitleggen van de wet.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur',
    type: 'OVERIG',
    telefoon: '088 - 633 0633',
    website: 'https://www.meesamen.nl',
    gemeente: 'Zutphen',
    onderdeelTest: 'Mantelzorgondersteuning',
    soortHulp: 'Informatie en advies',
    doelgroep: 'Mantelzorgers en zorgvragers',
    kosten: 'Gratis',
    zichtbaarBijLaag: false,
    zichtbaarBijGemiddeld: true,
    zichtbaarBijHoog: true,
  },
]

// ===== HULP VOOR DE NAASTE - Financiële administratie (Tabblad 2) =====
const financieleAdministratie: OrgData[] = [
  { naam: 'BudgetBuddy Zutphen - Budgetondersteuning en administratie', beschrijving: 'BudgetBuddy Zutphen helpt bij het ordenen van administratie, aanvragen van toeslagen en financieel overzicht.', type: 'VRIJWILLIGERS', website: 'https://www.budgetbuddyzutphen.nl', gemeente: 'Zutphen', onderdeelTest: 'Administratie en aanvragen', soortHulp: 'Financiele regelingen', doelgroep: 'Inwoners met financiële vragen', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Kruiswerk - Online cursus vergoedingen', beschrijving: 'Met de e-learning \'zorg voor wie je lief is | vergoedingen\' leer je meer over financiering van zorg en vergoeding van hulpmiddelen.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/e-learning-vergoedingen', gemeente: 'Zutphen', onderdeelTest: 'Administratie en aanvragen', soortHulp: 'Educatie', doelgroep: 'Mantelzorgers en zorgvragers', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Perspectief Zutphen - Hulp bij leefgebieden', beschrijving: 'Perspectief Zutphen ondersteunt je bij vragen over je relatie/scheiding, werk, inkomen, financiën/schulden, eenzaamheidsgevoelens en alles wat je bezig houdt.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'SOCIAAL_WIJKTEAM', telefoon: '0575 - 519613', website: 'https://www.perspectiefzutphen.nl', gemeente: 'Zutphen', onderdeelTest: 'Administratie en aanvragen', soortHulp: 'Financiele regelingen', doelgroep: 'Alle inwoners', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Perspectief Zutphen - Mantelzorgcoördinator (Administratie)', beschrijving: 'Een mantelzorgcoördinator helpt en begeleidt mensen die voor een naaste zorgen. Geeft advies, informatie en een luisterend oor. Denkt mee over welke extra hulp mogelijk is, waaronder hulp bij financiële administratie.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'MANTELZORGSTEUNPUNT', telefoon: '0575 - 519613', gemeente: 'Zutphen', onderdeelTest: 'Administratie en aanvragen', soortHulp: 'Financiele regelingen', doelgroep: 'Alle mantelzorgers', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'MEE Samen - Onafhankelijke cliëntondersteuning (Administratie)', beschrijving: 'Een onafhankelijke cliëntondersteuner helpt en begeleidt mensen die voor een naaste zorgen. Weet veel over het aanvragen van de Wlz en het uitleggen van de wet.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'OVERIG', telefoon: '088 - 633 0633', website: 'https://www.meesamen.nl', gemeente: 'Zutphen', onderdeelTest: 'Administratie en aanvragen', soortHulp: 'Financiele regelingen', doelgroep: 'Mantelzorgers en zorgvragers', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
]

// ===== HULP VOOR DE NAASTE - Regelen en afspraken (Tabblad 3) =====
const regelenAfspraken: OrgData[] = [
  { naam: 'Perspectief Zutphen - Mantelzorgcoördinator (Plannen)', beschrijving: 'Een mantelzorgcoördinator helpt en begeleidt mensen die voor een naaste zorgen. Geeft advies en denkt mee over welke extra hulp mogelijk is, ook bij het regelen en maken van afspraken.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'MANTELZORGSTEUNPUNT', telefoon: '0575 - 519613', gemeente: 'Zutphen', onderdeelTest: 'Plannen en organiseren', soortHulp: 'Praktische hulp', doelgroep: 'Alle mantelzorgers', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'MEE Samen - Onafhankelijke cliëntondersteuning (Plannen)', beschrijving: 'Een onafhankelijke cliëntondersteuner helpt bij het regelen en organiseren van afspraken. Weet veel over het aanvragen van de Wlz en het uitleggen van de wet.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'OVERIG', telefoon: '088 - 633 0633', website: 'https://www.meesamen.nl', gemeente: 'Zutphen', onderdeelTest: 'Plannen en organiseren', soortHulp: 'Praktische hulp', doelgroep: 'Mantelzorgers en zorgvragers', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
]

// ===== Boodschappen (Tabblad 4) =====
const boodschappen: OrgData[] = [
  { naam: 'Boodschappen bezorgen Zutphen', beschrijving: 'Binnen de gemeente Zutphen zijn meerdere supermarkten die de boodschappen bezorgen. Bekijk het overzicht van supermarkten die de boodschappen bezorgen in Zutphen.', type: 'OVERIG', website: 'https://www.boodschappenbezorgen.net/gelderland/boodschappen-bezorgen-zutphen/', gemeente: 'Zutphen', onderdeelTest: 'Boodschappen', soortHulp: 'Praktische hulp', doelgroep: 'Inwoners die boodschappen laten bezorgen', kosten: 'Afhankelijk van organisatie', zichtbaarBijLaag: true, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
]

// ===== Bezoek en uitjes (Tabblad 5) =====
const bezoekUitjes: OrgData[] = [
  { naam: 'Perspectief Zutphen - Activiteiten in buurthuizen', beschrijving: 'Buurthuizen in Zutphen bieden allerlei inloopmomenten en activiteiten.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'SOCIAAL_WIJKTEAM', telefoon: '0575 - 519613', website: 'https://www.perspectiefzutphen.nl/buurthuizen', gemeente: 'Zutphen', onderdeelTest: 'Sociaal contact en activiteiten', soortHulp: 'Praktische hulp', doelgroep: 'Alle inwoners', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Kruiswerk - Dagtochten', beschrijving: 'Kruiswerk neemt je mee naar de mooiste plekjes en leukste evenementen.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/dagtochten', gemeente: 'Zutphen', onderdeelTest: 'Sociaal contact en activiteiten', soortHulp: 'Praktische hulp', doelgroep: 'Ouderen en mantelzorgers', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
]

// ===== Vervoer (Tabblad 6) =====
const vervoer: OrgData[] = [
  { naam: 'Valys - Lange afstand vervoer', beschrijving: 'Met een Valyspas reis je als je meer dan 25 km of 5 ov-zones wilt afleggen.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'OVERIG', telefoon: '0900 - 9630', website: 'https://www.valys.nl', gemeente: 'Zutphen', onderdeelTest: 'Vervoer', soortHulp: 'Praktische hulp', doelgroep: 'Mensen met een mobiliteitsbeperking', kosten: 'Afhankelijk van afstand', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Plus OV - Reizen op afroep', beschrijving: 'Met een Wmo-pas van PlusOV reis je op afroep van deur tot deur binnen 20 km of 5 ov-zones.', type: 'GEMEENTE', website: 'https://www.plusov.nl/reizen-op-afroep', gemeente: 'Zutphen', onderdeelTest: 'Vervoer', soortHulp: 'Praktische hulp', doelgroep: 'Mensen met een Wmo-indicatie', kosten: 'Afhankelijk van afstand', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'OV-ambassadeurs Gelderland - Hulp bij openbaar vervoer', beschrijving: 'Ervaren ov-ambassadeurs geven je advies en tips over reizen met de trein of de bus.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'OVERIG', telefoon: '038 - 3037010', website: 'https://hulpwijzerzutphen.nl/hulp-bij-reizen-met-het-openbaar-vervoer-in-zutphen', gemeente: 'Zutphen', onderdeelTest: 'Vervoer', soortHulp: 'Praktische hulp', doelgroep: 'Mensen die hulp nodig hebben bij ov-reizen', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Automaatje Zutphen - Vervoer door vrijwilliger', beschrijving: 'Tegen een geringe vergoeding rijdt een vrijwilliger je naar plekken waar je anders maar moeilijk komt. Binnen en buiten Zutphen en ook in het weekend.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'VRIJWILLIGERS', telefoon: '0575 - 234020', website: 'https://www.stadsondernemingzutphen.nl/initiatieven/20/automaatje-zutphenwarnsveldeen', gemeente: 'Zutphen', onderdeelTest: 'Vervoer', soortHulp: 'Praktische hulp', doelgroep: 'Ouderen die niet zelf kunnen rijden', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
]

// ===== Persoonlijke verzorging (Tabblad 7) =====
const persoonlijkeVerzorging: OrgData[] = [
  { naam: 'Huisarts', beschrijving: 'De huisarts kan fungeren als eerste aanspreekpunt wanneer er een hulpvraag ontstaat rondom persoonlijke verzorging en zorgondersteuning.', type: 'HUISARTS', gemeente: 'Zutphen', onderdeelTest: 'Persoonlijke verzorging', soortHulp: 'Professionele zorg', doelgroep: 'Alle inwoners', kosten: 'Vergoeding via zorgverzekering', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Schakelverpleegkundige', beschrijving: 'De schakelverpleegkundige maakt kennis, bespreekt de hulpvraag en kijkt wat er nodig is aan zorg en ondersteuning. Geeft advies en helpt zo nodig bij het regelen van passende hulp.', type: 'THUISZORG', gemeente: 'Zutphen', onderdeelTest: 'Persoonlijke verzorging', soortHulp: 'Professionele zorg', doelgroep: 'Mensen met een zorgvraag', kosten: 'Vergoeding via zorgverzekering', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Kruiswerk - Audicien aan huis', beschrijving: 'Via Kruiswerk schakel je eenvoudig een audicien aan huis in.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/audicien', gemeente: 'Zutphen', onderdeelTest: 'Persoonlijke verzorging', soortHulp: 'Praktische hulp', doelgroep: 'Mensen met gehoorproblemen', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Kruiswerk - Online cursussen verzorging', beschrijving: 'Kruiswerk biedt meerdere online cursussen aan. Deze cursussen bieden jou training op het gebied van: Medicijngebruik, Mobiliteit, Voeding & Vocht en Zorg voor wie je lief is.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/e-learning-medicijngebruik', gemeente: 'Zutphen', onderdeelTest: 'Persoonlijke verzorging', soortHulp: 'Educatie', doelgroep: 'Mantelzorgers en zorgvragers', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Kruiswerk - Kapper aan huis', beschrijving: 'Via Kruiswerk schakel je eenvoudig een kapper aan huis in.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/kapper', gemeente: 'Zutphen', onderdeelTest: 'Persoonlijke verzorging', soortHulp: 'Praktische hulp', doelgroep: 'Mensen die niet naar de kapper kunnen', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Kruiswerk - Opticien aan huis', beschrijving: 'Via Kruiswerk schakel je eenvoudig een opticien aan huis in.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/opticien', gemeente: 'Zutphen', onderdeelTest: 'Persoonlijke verzorging', soortHulp: 'Praktische hulp', doelgroep: 'Mensen met oogproblemen', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Kruiswerk - Pedicure aan huis', beschrijving: 'Via Kruiswerk schakel je eenvoudig een pedicure aan huis in.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/pedicure', gemeente: 'Zutphen', onderdeelTest: 'Persoonlijke verzorging', soortHulp: 'Praktische hulp', doelgroep: 'Mensen die niet naar de pedicure kunnen', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Gemeente Zutphen - WMO-zorgloket persoonlijke verzorging', beschrijving: 'Via het Wmo-loket vraag je hulp aan bij persoonlijke verzorging wanneer er geen andere oplossing is.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'GEMEENTE', telefoon: '0575 - 595760', website: 'https://www.zutphen.nl/zorg', gemeente: 'Zutphen', onderdeelTest: 'Persoonlijke verzorging', soortHulp: 'Praktische hulp', doelgroep: 'Inwoners met een zorgvraag', kosten: 'Vergoeding via zorgverzekering', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
]

// ===== Eten maken (Tabblad 8) =====
const etenMaken: OrgData[] = [
  { naam: 'Perspectief Zutphen - Kookhulp via vrijwilligers', beschrijving: 'Perspectief Zutphen beantwoordt je vragen over mogelijke maaltijdhulpkansen. Ze kennen lokale maaltijdprojecten en kunnen meedenken.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'SOCIAAL_WIJKTEAM', telefoon: '0575 - 519613', website: 'https://www.perspectiefzutphen.nl/sociale-wijkteams/', gemeente: 'Zutphen', onderdeelTest: 'Bereiden en/of nuttigen van maaltijden', soortHulp: 'Praktische hulp', doelgroep: 'Inwoners die hulp nodig hebben bij maaltijden', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Kruiswerk - Maaltijdservice', beschrijving: 'Via Kruiswerk schakel je eenvoudig een maaltijdservice in.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/maaltijdservice', gemeente: 'Zutphen', onderdeelTest: 'Bereiden en/of nuttigen van maaltijden', soortHulp: 'Praktische hulp', doelgroep: 'Mensen die hulp nodig hebben bij maaltijden', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Overzicht eten in Zutphen', beschrijving: 'Op de website vind je meerdere lokale mogelijkheden rondom eten. Zo vind je plekken waar je warme maaltijden mee kan eten die tevens een sociaal component hebben.', type: 'OVERIG', website: 'https://hulpwijzerzutphen.nl/artikel/20591/wonen-en-vervoer/in-en-om-het-huis/huishouden/ik-kan-niet-meer-zelf-koken', gemeente: 'Zutphen', onderdeelTest: 'Bereiden en/of nuttigen van maaltijden', soortHulp: 'Praktische hulp', doelgroep: 'Inwoners die hulp nodig hebben bij maaltijden', kosten: 'Afhankelijk van organisatie', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
]

// ===== Huishouden (Tabblad 9) =====
const huishouden: OrgData[] = [
  { naam: 'Kruiswerk - Huishoudelijke hulp', beschrijving: 'Via Kruiswerk vraag je eenvoudig een huishoudelijke hulp aan.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/huishoudelijke-hulp', gemeente: 'Zutphen', onderdeelTest: 'Huishoudelijke taken', soortHulp: 'Praktische hulp', doelgroep: 'Mensen die hulp nodig hebben bij huishouden', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Gemeente Zutphen - Huishoudelijke hulp via de WMO', beschrijving: 'Huishoudelijke hulp vraag je aan bij het gemeentelijk Wmo-loket. Je krijgt hulp als uit het keukentafelgesprek blijkt dat dit echt nodig is.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'GEMEENTE', telefoon: '0575 - 595760', website: 'https://www.zutphen.nl', gemeente: 'Zutphen', onderdeelTest: 'Huishoudelijke taken', soortHulp: 'Praktische hulp', doelgroep: 'Inwoners die zelf niet kunnen schoonmaken', kosten: 'Particulier tarief, mogelijk vergoeding via PGB', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
]

// ===== Klusjes (Tabblad 10) =====
const klusjes: OrgData[] = [
  { naam: 'Kruiswerk - Klusser aan huis', beschrijving: 'Via Kruiswerk schakel je eenvoudig een klusser aan huis in voor alle kleine klussen in en om het huis.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/klusser-aan-huis', gemeente: 'Zutphen', onderdeelTest: 'Klusjes in en om het huis', soortHulp: 'Praktische hulp', doelgroep: 'Mensen die hulp nodig hebben bij klusjes', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Kruiswerk - Tuinman aan huis', beschrijving: 'Via Kruiswerk schakel je eenvoudig een tuinman aan huis in.\n\n📞 Bereikbaar: maandag t/m vrijdag van 09:00 tot 13:00 uur', type: 'OVERIG', telefoon: '0314 - 357070', website: 'https://www.kruiswerk.nl/tuinman', gemeente: 'Zutphen', onderdeelTest: 'Klusjes in en om het huis', soortHulp: 'Praktische hulp', doelgroep: 'Mensen die hulp nodig hebben bij tuinonderhoud', kosten: 'Korting bij lidmaatschap à € 26,50 per jaar', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
  { naam: 'Perspectief Zutphen - Vrijwillige hulp bij klusjes', beschrijving: 'Via buurtservice voeren vrijwilligers en mensen in een traject naar werk klussen uit in huis of tuin.\n\n📞 Bereikbaar: maandag t/m vrijdag van 08:30 tot 17:00 uur', type: 'VRIJWILLIGERS', telefoon: '0575 - 570454', website: 'https://www.perspectiefzutphen.nl/buurtservice', gemeente: 'Zutphen', onderdeelTest: 'Klusjes in en om het huis', soortHulp: 'Praktische hulp', doelgroep: 'Inwoners die hulp nodig hebben bij klusjes', kosten: 'Gratis', zichtbaarBijLaag: false, zichtbaarBijGemiddeld: true, zichtbaarBijHoog: true },
]

const alleZutphenOrganisaties: OrgData[] = [
  ...mantelzorgerHulp,
  ...financieleAdministratie,
  ...regelenAfspraken,
  ...boodschappen,
  ...bezoekUitjes,
  ...vervoer,
  ...persoonlijkeVerzorging,
  ...etenMaken,
  ...huishouden,
  ...klusjes,
]

export async function POST() {
  let created = 0, errors = 0

  try {
    // Stap 1: Verwijder bestaande Zutphen hulpbronnen (en hun favorieten)
    const gemeenteOrgs = await prisma.zorgorganisatie.findMany({
      where: { gemeente: 'Zutphen' },
      select: { id: true },
    })
    const orgIds = gemeenteOrgs.map(org => org.id)

    if (orgIds.length > 0) {
      await prisma.favoriet.deleteMany({
        where: { itemId: { in: orgIds }, type: 'HULP' },
      })
    }

    const deleted = await prisma.zorgorganisatie.deleteMany({
      where: { gemeente: 'Zutphen' },
    })

    // Stap 2: Voeg nieuwe Zutphen hulpbronnen toe
    for (const org of alleZutphenOrganisaties) {
      try {
        await prisma.zorgorganisatie.create({
          data: {
            naam: org.naam,
            beschrijving: org.beschrijving,
            type: org.type,
            telefoon: org.telefoon,
            website: org.website,
            gemeente: org.gemeente,
            onderdeelTest: org.onderdeelTest,
            soortHulp: org.soortHulp,
            doelgroep: org.doelgroep,
            kosten: org.kosten,
            zichtbaarBijLaag: org.zichtbaarBijLaag,
            zichtbaarBijGemiddeld: org.zichtbaarBijGemiddeld,
            zichtbaarBijHoog: org.zichtbaarBijHoog,
            isActief: true,
          },
        })
        created++
      } catch {
        errors++
      }
    }

    // Stap 3: Update landelijke hulpbronnen met onderdeelTest
    const landelijkUpdates: { naam: string; onderdeelTest: string }[] = [
      { naam: 'Mantelzorglijn', onderdeelTest: 'Mantelzorgondersteuning' },
      { naam: 'Luisterlijn', onderdeelTest: 'Emotionele steun' },
      { naam: 'Alzheimer Telefoon', onderdeelTest: 'Mantelzorgondersteuning' },
      { naam: 'Zilverlijn', onderdeelTest: 'Sociaal contact en activiteiten' },
      { naam: 'Sensoor - Telefonische hulpdienst', onderdeelTest: 'Emotionele steun' },
      { naam: 'Regelhulp.nl', onderdeelTest: 'Administratie en aanvragen' },
      { naam: 'Het CAK', onderdeelTest: 'Administratie en aanvragen' },
      { naam: 'SVB (Sociale Verzekeringsbank)', onderdeelTest: 'Administratie en aanvragen' },
      { naam: 'Zorginstituut Nederland', onderdeelTest: 'Administratie en aanvragen' },
      { naam: 'MantelzorgNL', onderdeelTest: 'Mantelzorgondersteuning' },
      { naam: 'Mezzo - Landelijke vereniging mantelzorgers', onderdeelTest: 'Mantelzorgondersteuning' },
      { naam: 'Per Saldo - PGB-belangenvereniging', onderdeelTest: 'Administratie en aanvragen' },
    ]

    let landelijkUpdated = 0
    for (const upd of landelijkUpdates) {
      const result = await prisma.zorgorganisatie.updateMany({
        where: { naam: upd.naam, gemeente: null },
        data: { onderdeelTest: upd.onderdeelTest },
      })
      landelijkUpdated += result.count
    }

    return NextResponse.json({
      success: true,
      verwijderd: deleted.count,
      toegevoegd: created,
      fouten: errors,
      landelijkBijgewerkt: landelijkUpdated,
    })
  } catch (e) {
    console.error("Zutphen seed error:", e)
    return NextResponse.json({ error: "Seed gefaald", details: String(e) }, { status: 500 })
  }
}
