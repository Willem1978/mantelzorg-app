import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding content data...')

  // ============================================
  // 1. BALANSTEST VRAGEN
  // ============================================
  console.log('Seeding balanstest vragen...')

  const balanstestVragen = [
    {
      vraagId: "q1",
      type: "BALANSTEST" as const,
      sectie: "Jouw energie",
      beschrijving: "Eerst een paar vragen aan jou over hoe jij je lichamelijk voelt.",
      vraagTekst: "Slaap je minder goed door de zorg voor je naaste?",
      tip: "Veel mantelzorgers merken dat hun slaap onrustig wordt door piekeren of nachtelijke zorgtaken.",
      gewicht: 1.5,
      volgorde: 1,
    },
    {
      vraagId: "q2",
      type: "BALANSTEST" as const,
      sectie: "Jouw energie",
      vraagTekst: "Heb je last van je lichaam door het zorgen?",
      tip: "Fysieke klachten zoals rugpijn of vermoeidheid komen veel voor bij mantelzorgers.",
      gewicht: 1.0,
      volgorde: 2,
    },
    {
      vraagId: "q3",
      type: "BALANSTEST" as const,
      sectie: "Jouw energie",
      vraagTekst: "Kost het zorgen veel tijd en energie?",
      tip: "Het is normaal om dit te ervaren. Zorg goed voor jezelf.",
      gewicht: 1.0,
      volgorde: 3,
    },
    {
      vraagId: "q4",
      type: "BALANSTEST" as const,
      sectie: "Jouw gevoel",
      beschrijving: "Nu een paar vragen over hoe jij je emotioneel voelt.",
      vraagTekst: "Is de band met je naaste veranderd?",
      tip: "Relaties veranderen door ziekte. Dat is normaal en soms lastig.",
      gewicht: 1.5,
      volgorde: 4,
    },
    {
      vraagId: "q5",
      type: "BALANSTEST" as const,
      sectie: "Jouw gevoel",
      vraagTekst: "Maakt het gedrag van je naaste je verdrietig, bang of boos?",
      tip: "Deze gevoelens zijn heel begrijpelijk en komen veel voor.",
      gewicht: 1.5,
      volgorde: 5,
    },
    {
      vraagId: "q6",
      type: "BALANSTEST" as const,
      sectie: "Jouw gevoel",
      vraagTekst: "Heb je verdriet dat je naaste anders is dan vroeger?",
      tip: "Rouwen om wie iemand was is een normaal onderdeel van mantelzorg.",
      gewicht: 1.0,
      volgorde: 6,
    },
    {
      vraagId: "q7",
      type: "BALANSTEST" as const,
      sectie: "Jouw gevoel",
      vraagTekst: "Slokt de zorg al je energie op?",
      tip: "Als dit zo voelt, is het belangrijk om hulp te zoeken.",
      gewicht: 1.5,
      volgorde: 7,
    },
    {
      vraagId: "q8",
      type: "BALANSTEST" as const,
      sectie: "Jouw tijd",
      beschrijving: "Tot slot een paar vragen over je tijd en je eigen leven.",
      vraagTekst: "Pas je je dagelijks leven aan voor de zorg?",
      tip: "Aanpassingen zijn normaal, maar vergeet jezelf niet.",
      gewicht: 1.0,
      volgorde: 8,
    },
    {
      vraagId: "q9",
      type: "BALANSTEST" as const,
      sectie: "Jouw tijd",
      vraagTekst: "Pas je regelmatig je plannen aan om te helpen?",
      tip: "Flexibiliteit is mooi, maar je eigen plannen tellen ook.",
      gewicht: 1.0,
      volgorde: 9,
    },
    {
      vraagId: "q10",
      type: "BALANSTEST" as const,
      sectie: "Jouw tijd",
      vraagTekst: "Kom je niet meer toe aan dingen die je leuk vindt?",
      tip: "Tijd voor jezelf is geen luxe, maar noodzaak.",
      gewicht: 1.0,
      volgorde: 10,
    },
    {
      vraagId: "q11",
      type: "BALANSTEST" as const,
      sectie: "Jouw tijd",
      vraagTekst: "Kost het zorgen net zoveel tijd als je werk?",
      tip: "Mantelzorg is ook werk. Gun jezelf erkenning hiervoor.",
      gewicht: 1.5,
      volgorde: 11,
    },
  ]

  for (const vraag of balanstestVragen) {
    await prisma.balanstestVraag.upsert({
      where: { vraagId: vraag.vraagId },
      create: vraag,
      update: {
        vraagTekst: vraag.vraagTekst,
        tip: vraag.tip,
        sectie: vraag.sectie,
        beschrijving: vraag.beschrijving,
        gewicht: vraag.gewicht,
        volgorde: vraag.volgorde,
      },
    })
  }
  console.log(`  ${balanstestVragen.length} balanstest vragen seeded`)

  // ============================================
  // 2. CHECK-IN VRAGEN
  // ============================================
  console.log('Seeding check-in vragen...')

  const checkInVragen = [
    {
      vraagId: "c1",
      type: "CHECKIN" as const,
      vraagTekst: "Ben je vaak moe?",
      tip: "Als je veel moe bent, is dat een teken dat je rust nodig hebt.",
      reversed: false,
      volgorde: 1,
    },
    {
      vraagId: "c2",
      type: "CHECKIN" as const,
      vraagTekst: "Heb je tijd voor jezelf?",
      tip: "Tijd voor jezelf is belangrijk. Ook voor jou.",
      reversed: true,
      volgorde: 2,
    },
    {
      vraagId: "c3",
      type: "CHECKIN" as const,
      vraagTekst: "Maak je je vaak zorgen?",
      tip: "Zorgen maken hoort erbij. Maar het mag niet te veel worden.",
      reversed: false,
      volgorde: 3,
    },
    {
      vraagId: "c4",
      type: "CHECKIN" as const,
      vraagTekst: "Krijg je hulp van anderen?",
      tip: "Hulp van anderen is fijn. Je hoeft het niet alleen te doen.",
      reversed: true,
      volgorde: 4,
    },
    {
      vraagId: "c5",
      type: "CHECKIN" as const,
      vraagTekst: "Waar wil je hulp bij?",
      tip: "Kies wat voor jou belangrijk is. Je kunt meer dan één ding kiezen.",
      isMultiSelect: true,
      volgorde: 5,
    },
  ]

  for (const vraag of checkInVragen) {
    await prisma.balanstestVraag.upsert({
      where: { vraagId: vraag.vraagId },
      create: vraag,
      update: {
        vraagTekst: vraag.vraagTekst,
        tip: vraag.tip,
        reversed: vraag.reversed,
        isMultiSelect: vraag.isMultiSelect,
        volgorde: vraag.volgorde,
      },
    })
  }
  console.log(`  ${checkInVragen.length} check-in vragen seeded`)

  // ============================================
  // 3. ZORGTAKEN
  // ============================================
  console.log('Seeding zorgtaken...')

  const zorgtaken = [
    { taakId: "t1", naam: "Administratie en geldzaken", beschrijving: "Rekeningen, post, verzekeringen", volgorde: 1 },
    { taakId: "t2", naam: "Regelen en afspraken maken", beschrijving: "Arts, thuiszorg, dagbesteding", volgorde: 2 },
    { taakId: "t3", naam: "Boodschappen doen", beschrijving: "Supermarkt, apotheek", volgorde: 3 },
    { taakId: "t4", naam: "Bezoek en gezelschap", beschrijving: "Gesprekken, uitjes, wandelen", volgorde: 4 },
    { taakId: "t5", naam: "Vervoer naar afspraken", beschrijving: "Ziekenhuis, huisarts, familie", volgorde: 5 },
    { taakId: "t6", naam: "Persoonlijke verzorging", beschrijving: "Wassen, aankleden, medicijnen", volgorde: 6 },
    { taakId: "t7", naam: "Eten en drinken", beschrijving: "Koken, maaltijden, dieet", volgorde: 7 },
    { taakId: "t8", naam: "Huishouden", beschrijving: "Schoonmaken, was, opruimen", volgorde: 8 },
    { taakId: "t9", naam: "Klusjes in en om huis", beschrijving: "Reparaties, tuin, onderhoud", volgorde: 9 },
  ]

  for (const taak of zorgtaken) {
    await prisma.zorgtaak.upsert({
      where: { taakId: taak.taakId },
      create: taak,
      update: {
        naam: taak.naam,
        beschrijving: taak.beschrijving,
        volgorde: taak.volgorde,
      },
    })
  }
  console.log(`  ${zorgtaken.length} zorgtaken seeded`)

  // ============================================
  // 4. HULPVRAAG CATEGORIEËN (zorgvrager)
  // ============================================
  console.log('Seeding hulpvraag categorieën...')

  const categorieenZorgvrager = [
    // Dagelijks leven
    { slug: "persoonlijke-verzorging", naam: "Persoonlijke verzorging", icon: "🛁", kort: "Verzorging", groep: "Dagelijks leven", routeLabel: "Wmo/Zvw/Wlz", volgorde: 1 },
    { slug: "maaltijden", naam: "Bereiden en/of nuttigen van maaltijden", icon: "🍽️", kort: "Maaltijden", groep: "Dagelijks leven", routeLabel: "Gemeente", volgorde: 2 },
    { slug: "boodschappen", naam: "Boodschappen", icon: "🛒", kort: "Boodschappen", groep: "Dagelijks leven", routeLabel: "Gemeente", volgorde: 3 },
    // In en om het huis
    { slug: "huishoudelijke-taken", naam: "Huishoudelijke taken", icon: "🧹", kort: "Huishouden", groep: "In en om het huis", routeLabel: "Wmo", volgorde: 4 },
    { slug: "klusjes", naam: "Klusjes in en om het huis", icon: "🔧", kort: "Klusjes", groep: "In en om het huis", routeLabel: "Gemeente", volgorde: 5 },
    // Organisatie & regelwerk
    { slug: "administratie", naam: "Administratie en aanvragen", icon: "📋", kort: "Administratie", groep: "Organisatie & regelwerk", routeLabel: "Landelijk", volgorde: 6 },
    { slug: "plannen", naam: "Plannen en organiseren", icon: "📅", kort: "Plannen", groep: "Organisatie & regelwerk", routeLabel: null, volgorde: 7 },
    // Welzijn & mobiliteit
    { slug: "sociaal-contact", naam: "Sociaal contact en activiteiten", icon: "👥", kort: "Sociaal", groep: "Welzijn & mobiliteit", routeLabel: "Wmo", volgorde: 8 },
    { slug: "vervoer", naam: "Vervoer", icon: "🚗", kort: "Vervoer", groep: "Welzijn & mobiliteit", routeLabel: "Landelijk", volgorde: 9 },
    // Overig
    { slug: "huisdieren", naam: "Huisdieren", icon: "🐕", kort: "Huisdieren", groep: "Overig", routeLabel: null, volgorde: 10 },
  ]

  for (const cat of categorieenZorgvrager) {
    await prisma.contentCategorie.upsert({
      where: { type_slug: { type: "HULP_ZORGVRAGER", slug: cat.slug } },
      create: {
        type: "HULP_ZORGVRAGER",
        slug: cat.slug,
        naam: cat.naam,
        icon: cat.icon,
        hint: cat.kort,
        metadata: { groep: cat.groep, routeLabel: cat.routeLabel },
        volgorde: cat.volgorde,
      },
      update: {
        naam: cat.naam,
        icon: cat.icon,
        hint: cat.kort,
        metadata: { groep: cat.groep, routeLabel: cat.routeLabel },
        volgorde: cat.volgorde,
      },
    })
  }
  console.log(`  ${categorieenZorgvrager.length} zorgvrager categorieën seeded`)

  // Categorieën mantelzorger
  const categorieenMantelzorger = [
    { slug: "mantelzorgondersteuning", naam: "Mantelzorgondersteuning", icon: "💜", kort: "Ondersteuning", volgorde: 1 },
    { slug: "respijtzorg", naam: "Respijtzorg", icon: "🏠", kort: "Respijtzorg", volgorde: 2 },
    { slug: "emotionele-steun", naam: "Emotionele steun", icon: "💚", kort: "Praten & steun", volgorde: 3 },
    { slug: "lotgenotencontact", naam: "Lotgenotencontact", icon: "👥", kort: "Lotgenoten", volgorde: 4 },
    { slug: "leren-en-training", naam: "Leren en training", icon: "🎓", kort: "Leren & training", volgorde: 5 },
  ]

  for (const cat of categorieenMantelzorger) {
    await prisma.contentCategorie.upsert({
      where: { type_slug: { type: "HULP_MANTELZORGER", slug: cat.slug } },
      create: {
        type: "HULP_MANTELZORGER",
        slug: cat.slug,
        naam: cat.naam,
        icon: cat.icon,
        hint: cat.kort,
        volgorde: cat.volgorde,
      },
      update: {
        naam: cat.naam,
        icon: cat.icon,
        hint: cat.kort,
        volgorde: cat.volgorde,
      },
    })
  }
  console.log(`  ${categorieenMantelzorger.length} mantelzorger categorieën seeded`)

  // Hulpvraag categorieën
  const hulpvraagCategorieen = [
    { slug: "respite-care", naam: "Even vrij", icon: "🏠", hint: "Iemand neemt de zorg over", volgorde: 1 },
    { slug: "emotional-support", naam: "Praten", icon: "💚", hint: "Over je gevoel praten", volgorde: 2 },
    { slug: "practical-help", naam: "Hulp thuis", icon: "🔧", hint: "Klussen of taken", volgorde: 3 },
    { slug: "financial-advice", naam: "Geld", icon: "💰", hint: "Hulp met geld of aanvragen", volgorde: 4 },
    { slug: "information", naam: "Info", icon: "ℹ️", hint: "Informatie zoeken", volgorde: 5 },
    { slug: "other", naam: "Anders", icon: "📝", hint: "Iets anders", volgorde: 6 },
  ]

  for (const cat of hulpvraagCategorieen) {
    await prisma.contentCategorie.upsert({
      where: { type_slug: { type: "HULPVRAAG", slug: cat.slug } },
      create: {
        type: "HULPVRAAG",
        slug: cat.slug,
        naam: cat.naam,
        icon: cat.icon,
        hint: cat.hint,
        volgorde: cat.volgorde,
      },
      update: {
        naam: cat.naam,
        icon: cat.icon,
        hint: cat.hint,
        volgorde: cat.volgorde,
      },
    })
  }
  console.log(`  ${hulpvraagCategorieen.length} hulpvraag categorieën seeded`)

  // ============================================
  // 5. LEREN CATEGORIEËN + SUB-HOOFDSTUKKEN
  // ============================================
  console.log('Seeding leren categorieën...')

  const lerenCategorieen = [
    { slug: "praktische-tips", naam: "Praktische tips", beschrijving: "Voor het dagelijks leven", emoji: "💡", volgorde: 1 },
    { slug: "zelfzorg", naam: "Zelfzorg", beschrijving: "Zorg ook voor jezelf", emoji: "🧘", volgorde: 2 },
    { slug: "rechten", naam: "Je rechten", beschrijving: "Wmo, Zvw, Wlz en meer", emoji: "⚖️", volgorde: 3 },
    { slug: "financieel", naam: "Financieel", beschrijving: "Kosten, vergoedingen & pgb", emoji: "💰", volgorde: 4 },
    { slug: "hulpmiddelen-producten", naam: "Hulpmiddelen & producten", beschrijving: "Fysiek, digitaal & aanpassingen", emoji: "🛠️", volgorde: 5 },
  ]

  for (const cat of lerenCategorieen) {
    await prisma.contentCategorie.upsert({
      where: { type_slug: { type: "LEREN", slug: cat.slug } },
      create: {
        type: "LEREN",
        slug: cat.slug,
        naam: cat.naam,
        beschrijving: cat.beschrijving,
        emoji: cat.emoji,
        volgorde: cat.volgorde,
      },
      update: {
        naam: cat.naam,
        beschrijving: cat.beschrijving,
        emoji: cat.emoji,
        volgorde: cat.volgorde,
      },
    })
  }
  console.log(`  ${lerenCategorieen.length} leren categorieën seeded`)

  // Sub-hoofdstukken
  const subHoofdstukken: Record<string, { slug: string; titel: string; beschrijving: string }[]> = {
    "praktische-tips": [
      { slug: "dagelijks-organiseren", titel: "Dagelijks organiseren", beschrijving: "Dagstructuur, weekplanning en taken uitbesteden" },
      { slug: "samen-organiseren", titel: "Samen organiseren met familie/netwerk", beschrijving: "Afspraken, back-up en samenwerking" },
      { slug: "veiligheid-zware-taken", titel: "Veiligheid bij zware taken", beschrijving: "Tillen, verplaatsen en medicatie" },
    ],
    "zelfzorg": [
      { slug: "overbelasting-herkennen", titel: "Overbelasting herkennen", beschrijving: "Signalen herkennen en wat je kunt doen" },
      { slug: "pauze-en-respijt", titel: "Pauze en respijt organiseren", beschrijving: "Tijdelijke overname van zorg regelen" },
      { slug: "emotionele-steun", titel: "Emotionele steun en praten", beschrijving: "Steun zoeken en stress verwerken" },
    ],
    "rechten": [
      { slug: "routekaart-wmo-zvw-wlz", titel: "Routekaart Wmo / Zvw / Wlz", beschrijving: "Wat hoort waar? Interactief overzicht" },
      { slug: "gemeente-wmo-aanvragen", titel: "Gemeente (Wmo) aanvragen", beschrijving: "Wat je kunt krijgen en hoe je het aanvraagt" },
      { slug: "clientondersteuning", titel: "Gratis clientondersteuning", beschrijving: "Onafhankelijke hulp bij het organiseren van zorg" },
    ],
    "financieel": [
      { slug: "eigen-bijdrage-kosten", titel: "Eigen bijdrage en kosten", beschrijving: "CAK, abonnementstarief en rekentools" },
      { slug: "mantelzorgwaardering", titel: "Mantelzorgwaardering", beschrijving: "Jaarlijkse waardering van je gemeente" },
      { slug: "pgb-aanvragen-beheer", titel: "Pgb: aanvragen en beheer", beschrijving: "Route, vaardigheden en SVB" },
      { slug: "vergoedingen-hulpmiddelen", titel: "Vergoedingen hulpmiddelen", beschrijving: "Eerst aanvragen, dan kopen" },
    ],
    "hulpmiddelen-producten": [
      { slug: "hulpmiddelen-overzicht", titel: "Hulpmiddelen overzicht", beschrijving: "Fysieke en digitale hulpmiddelen vinden" },
      { slug: "vergoedingsroutes", titel: "Vergoedingsroutes", beschrijving: "Welk hulpmiddel via welke wet?" },
    ],
  }

  // Haal parent ID's op
  const lerenParents = await prisma.contentCategorie.findMany({
    where: { type: "LEREN" },
    select: { id: true, slug: true },
  })
  const parentMap = Object.fromEntries(lerenParents.map(p => [p.slug, p.id]))

  let subCount = 0
  for (const [categorieSlug, subs] of Object.entries(subHoofdstukken)) {
    const parentId = parentMap[categorieSlug]
    if (!parentId) continue

    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i]
      await prisma.contentCategorie.upsert({
        where: { type_slug: { type: "SUB_HOOFDSTUK", slug: sub.slug } },
        create: {
          type: "SUB_HOOFDSTUK",
          slug: sub.slug,
          naam: sub.titel,
          beschrijving: sub.beschrijving,
          parentId,
          volgorde: i + 1,
        },
        update: {
          naam: sub.titel,
          beschrijving: sub.beschrijving,
          parentId,
          volgorde: i + 1,
        },
      })
      subCount++
    }
  }
  console.log(`  ${subCount} sub-hoofdstukken seeded`)

  // ============================================
  // 6. TAAK-CATEGORIE MAPPINGS
  // ============================================
  console.log('Seeding taak-categorie mappings...')

  // Haal zorgtaak IDs op
  const alleTaken = await prisma.zorgtaak.findMany({ select: { id: true, naam: true } })
  const taakMap = Object.fromEntries(alleTaken.map(t => [t.naam, t.id]))

  // Haal categorie IDs op
  const alleCategorieen = await prisma.contentCategorie.findMany({
    where: { type: "HULP_ZORGVRAGER" },
    select: { id: true, naam: true },
  })
  const catMap = Object.fromEntries(alleCategorieen.map(c => [c.naam, c.id]))

  // We linken zorgtaken aan de hulp_zorgvrager categorieën waar ze bij horen
  const taakMappings: { bronNaam: string; doelCategorie: string }[] = [
    // Persoonlijke verzorging
    { bronNaam: "Wassen/aankleden", doelCategorie: "Persoonlijke verzorging" },
    { bronNaam: "Wassen en aankleden", doelCategorie: "Persoonlijke verzorging" },
    { bronNaam: "Persoonlijke verzorging", doelCategorie: "Persoonlijke verzorging" },
    { bronNaam: "Toiletgang", doelCategorie: "Persoonlijke verzorging" },
    { bronNaam: "Medicijnen", doelCategorie: "Persoonlijke verzorging" },
    { bronNaam: "Toezicht", doelCategorie: "Persoonlijke verzorging" },
    { bronNaam: "Medische zorg", doelCategorie: "Persoonlijke verzorging" },
    // Huishoudelijke taken
    { bronNaam: "Huishouden", doelCategorie: "Huishoudelijke taken" },
    { bronNaam: "Huishoudelijke taken", doelCategorie: "Huishoudelijke taken" },
    // Vervoer
    { bronNaam: "Vervoer", doelCategorie: "Vervoer" },
    { bronNaam: "Vervoer/begeleiding", doelCategorie: "Vervoer" },
    { bronNaam: "Vervoer naar afspraken", doelCategorie: "Vervoer" },
    // Administratie
    { bronNaam: "Administratie", doelCategorie: "Administratie en aanvragen" },
    { bronNaam: "Administratie en aanvragen", doelCategorie: "Administratie en aanvragen" },
    { bronNaam: "Administratie en geldzaken", doelCategorie: "Administratie en aanvragen" },
    // Plannen en organiseren
    { bronNaam: "Plannen en organiseren", doelCategorie: "Plannen en organiseren" },
    { bronNaam: "Regelen en afspraken maken", doelCategorie: "Plannen en organiseren" },
    { bronNaam: "Plannen", doelCategorie: "Plannen en organiseren" },
    { bronNaam: "Organiseren", doelCategorie: "Plannen en organiseren" },
    // Sociaal contact
    { bronNaam: "Sociaal contact", doelCategorie: "Sociaal contact en activiteiten" },
    { bronNaam: "Sociaal contact en activiteiten", doelCategorie: "Sociaal contact en activiteiten" },
    { bronNaam: "Activiteiten", doelCategorie: "Sociaal contact en activiteiten" },
    { bronNaam: "Bezoek en gezelschap", doelCategorie: "Sociaal contact en activiteiten" },
    { bronNaam: "Bezoek en uitjes", doelCategorie: "Sociaal contact en activiteiten" },
    // Maaltijden
    { bronNaam: "Maaltijden", doelCategorie: "Bereiden en/of nuttigen van maaltijden" },
    { bronNaam: "Eten maken", doelCategorie: "Bereiden en/of nuttigen van maaltijden" },
    { bronNaam: "Eten en drinken", doelCategorie: "Bereiden en/of nuttigen van maaltijden" },
    // Boodschappen
    { bronNaam: "Boodschappen", doelCategorie: "Boodschappen" },
    { bronNaam: "Boodschappen doen", doelCategorie: "Boodschappen" },
    // Klusjes
    { bronNaam: "Klusjes", doelCategorie: "Klusjes in en om het huis" },
    { bronNaam: "Klusjes in huis", doelCategorie: "Klusjes in en om het huis" },
    { bronNaam: "Klusjes in en om huis", doelCategorie: "Klusjes in en om het huis" },
    { bronNaam: "Klusjes in/om huis", doelCategorie: "Klusjes in en om het huis" },
    { bronNaam: "Klusjes in en om het huis", doelCategorie: "Klusjes in en om het huis" },
    // Huisdieren
    { bronNaam: "Huisdieren", doelCategorie: "Huisdieren" },
    { bronNaam: "Huisdieren verzorgen", doelCategorie: "Huisdieren" },
    { bronNaam: "Dieren", doelCategorie: "Huisdieren" },
  ]

  // Gebruik de eerste zorgtaak die match als zorgtaakId (via de naam van de doelCategorie)
  // We moeten eerst een zorgtaak per categorie hebben
  const categorieNaarZorgtaak: Record<string, string> = {
    "Persoonlijke verzorging": "t6",
    "Huishoudelijke taken": "t8",
    "Vervoer": "t5",
    "Administratie en aanvragen": "t1",
    "Plannen en organiseren": "t2",
    "Sociaal contact en activiteiten": "t4",
    "Bereiden en/of nuttigen van maaltijden": "t7",
    "Boodschappen": "t3",
    "Klusjes in en om het huis": "t9",
    "Huisdieren": "t4", // Fallback naar bezoek
  }

  const zorgtakenById = await prisma.zorgtaak.findMany({ select: { id: true, taakId: true } })
  const zorgtaakIdMap = Object.fromEntries(zorgtakenById.map(t => [t.taakId, t.id]))

  let mappingCount = 0
  for (const mapping of taakMappings) {
    const taakCode = categorieNaarZorgtaak[mapping.doelCategorie]
    const zorgtaakId = taakCode ? zorgtaakIdMap[taakCode] : null
    if (!zorgtaakId) continue

    await prisma.taakCategorieMapping.upsert({
      where: { bronNaam: mapping.bronNaam },
      create: {
        bronNaam: mapping.bronNaam,
        zorgtaakId,
      },
      update: {
        zorgtaakId,
      },
    })
    mappingCount++
  }
  console.log(`  ${mappingCount} taak-categorie mappings seeded`)

  // ============================================
  // 7. FORMULIER OPTIES
  // ============================================
  console.log('Seeding formulier opties...')

  // Relatie opties (onboarding)
  const relatieOpties = [
    { waarde: "partner", label: "Mijn partner", emoji: "💑", volgorde: 1 },
    { waarde: "ouder", label: "Mijn ouder", emoji: "👵", volgorde: 2 },
    { waarde: "kind", label: "Mijn kind", emoji: "👧", volgorde: 3 },
    { waarde: "ander-familielid", label: "Ander familielid", emoji: "👨‍👩‍👧", volgorde: 4 },
    { waarde: "kennis", label: "Kennis of vriend(in)", emoji: "🤝", volgorde: 5 },
  ]
  for (const opt of relatieOpties) {
    await prisma.formulierOptie.upsert({
      where: { groep_waarde: { groep: "RELATIE", waarde: opt.waarde } },
      create: { groep: "RELATIE", ...opt },
      update: { label: opt.label, emoji: opt.emoji, volgorde: opt.volgorde },
    })
  }

  // Uren per week (onboarding)
  const urenOpties = [
    { waarde: "0-5", label: "0 - 5 uur", beschrijving: "Af en toe bijspringen", volgorde: 1 },
    { waarde: "5-10", label: "5 - 10 uur", beschrijving: "Regelmatig helpen", volgorde: 2 },
    { waarde: "10-20", label: "10 - 20 uur", beschrijving: "Flink bezig", volgorde: 3 },
    { waarde: "20-40", label: "20 - 40 uur", beschrijving: "Bijna een baan", volgorde: 4 },
    { waarde: "40+", label: "Meer dan 40 uur", beschrijving: "Fulltime zorg", volgorde: 5 },
  ]
  for (const opt of urenOpties) {
    await prisma.formulierOptie.upsert({
      where: { groep_waarde: { groep: "UREN_PER_WEEK", waarde: opt.waarde } },
      create: { groep: "UREN_PER_WEEK", ...opt },
      update: { label: opt.label, beschrijving: opt.beschrijving, volgorde: opt.volgorde },
    })
  }

  // Zorgduur (onboarding)
  const duurOpties = [
    { waarde: "<1", label: "Minder dan 1 jaar", emoji: "🌱", volgorde: 1 },
    { waarde: "1-3", label: "1 - 3 jaar", emoji: "🌿", volgorde: 2 },
    { waarde: "3-5", label: "3 - 5 jaar", emoji: "🌳", volgorde: 3 },
    { waarde: "5+", label: "Meer dan 5 jaar", emoji: "🏔️", volgorde: 4 },
  ]
  for (const opt of duurOpties) {
    await prisma.formulierOptie.upsert({
      where: { groep_waarde: { groep: "ZORGDUUR", waarde: opt.waarde } },
      create: { groep: "ZORGDUUR", ...opt },
      update: { label: opt.label, emoji: opt.emoji, volgorde: opt.volgorde },
    })
  }

  // Uren balanstest
  const urenBalanstest = [
    { waarde: "0-2", label: "Tot 2 uur per week", beschrijving: "1", volgorde: 1 },
    { waarde: "2-4", label: "2 tot 4 uur per week", beschrijving: "3", volgorde: 2 },
    { waarde: "4-8", label: "4 tot 8 uur per week", beschrijving: "6", volgorde: 3 },
    { waarde: "8-12", label: "8 tot 12 uur per week", beschrijving: "10", volgorde: 4 },
    { waarde: "12-24", label: "12 tot 24 uur per week", beschrijving: "18", volgorde: 5 },
    { waarde: "24+", label: "Meer dan 24 uur per week", beschrijving: "30", volgorde: 6 },
  ]
  for (const opt of urenBalanstest) {
    await prisma.formulierOptie.upsert({
      where: { groep_waarde: { groep: "UREN_BALANSTEST", waarde: opt.waarde } },
      create: { groep: "UREN_BALANSTEST", ...opt },
      update: { label: opt.label, beschrijving: opt.beschrijving, volgorde: opt.volgorde },
    })
  }

  // Check-in hulp opties
  const checkInHulpOpties = [
    { waarde: "geen", label: "Het gaat goed zo", emoji: "✅", volgorde: 1 },
    { waarde: "huishouden", label: "Huishouden", emoji: "🧹", volgorde: 2 },
    { waarde: "zorgtaken", label: "Zorgtaken", emoji: "🩺", volgorde: 3 },
    { waarde: "tijd_voor_mezelf", label: "Tijd voor mezelf", emoji: "🧘", volgorde: 4 },
    { waarde: "administratie", label: "Papierwerk", emoji: "📋", volgorde: 5 },
    { waarde: "emotioneel", label: "Praten met iemand", emoji: "💬", volgorde: 6 },
  ]
  for (const opt of checkInHulpOpties) {
    await prisma.formulierOptie.upsert({
      where: { groep_waarde: { groep: "CHECKIN_HULP", waarde: opt.waarde } },
      create: { groep: "CHECKIN_HULP", ...opt },
      update: { label: opt.label, emoji: opt.emoji, volgorde: opt.volgorde },
    })
  }

  // Buddy hulpvormen
  const buddyHulpvormen = [
    { waarde: "gesprek", label: "Gesprek / praatje", emoji: "☕", volgorde: 1 },
    { waarde: "boodschappen", label: "Boodschappen", emoji: "🛒", volgorde: 2 },
    { waarde: "vervoer", label: "Vervoer", emoji: "🚗", volgorde: 3 },
    { waarde: "klusjes", label: "Klusjes", emoji: "🔧", volgorde: 4 },
    { waarde: "oppas", label: "Oppas / toezicht", emoji: "🏠", volgorde: 5 },
    { waarde: "administratie", label: "Administratie", emoji: "📋", volgorde: 6 },
  ]
  for (const opt of buddyHulpvormen) {
    await prisma.formulierOptie.upsert({
      where: { groep_waarde: { groep: "BUDDY_HULPVORM", waarde: opt.waarde } },
      create: { groep: "BUDDY_HULPVORM", ...opt },
      update: { label: opt.label, emoji: opt.emoji, volgorde: opt.volgorde },
    })
  }

  console.log('  Alle formulier opties seeded')

  // ============================================
  // 8. TUTORIAL STAPPEN
  // ============================================
  console.log('Seeding tutorial stappen...')

  const tutorialStappen = [
    {
      sleutel: "welkom",
      titel: "Welkom bij MantelBuddy",
      inhoud: "Ik ben **Ger**, en ik ga je stap voor stap uitleggen hoe MantelBuddy jou kan helpen.",
      subtekst: "Het duurt maar 2 minuutjes. ⏱️",
      emoji: "👋",
      volgorde: 0,
    },
    {
      sleutel: "balanstest",
      titel: "De Balanstest",
      inhoud: "Met een **korte test** van 2 minuten kijken we hoe het met je gaat. Je krijgt een score die laat zien of je het goed volhoudt.",
      subtekst: "Doe de test regelmatig. Dan kun je zien hoe het gaat over tijd.",
      emoji: "📊",
      volgorde: 1,
      metadata: { demoScore: 13, maxScore: 24 },
    },
    {
      sleutel: "hulp-mantelzorger",
      titel: "Hulp voor jou",
      inhoud: "Je hoeft het niet alleen te doen. MantelBuddy zoekt hulp **bij jou in de buurt**.",
      subtekst: "Daarom vragen we je adres. Zo vinden we hulp bij jou in de buurt.",
      emoji: "💜",
      volgorde: 2,
      metadata: {
        items: [
          { emoji: "💜", label: "Ondersteuning" },
          { emoji: "🏠", label: "Respijtzorg" },
          { emoji: "💚", label: "Praten" },
          { emoji: "👥", label: "Lotgenoten" },
        ],
      },
    },
    {
      sleutel: "hulp-naaste",
      titel: "Hulp voor je naaste",
      inhoud: "Er is ook hulp voor de persoon waar je voor zorgt. De kleuren laten zien wat het zwaarst is.",
      subtekst: "We vragen twee adressen. Eén voor jou en één voor je naaste. Zo vinden we voor allebei de juiste hulp.",
      emoji: "💝",
      volgorde: 3,
      metadata: {
        items: [
          { emoji: "🛁", label: "Verzorging", status: "zwaar" },
          { emoji: "🧹", label: "Huishouden", status: "gemiddeld" },
          { emoji: "🍽️", label: "Maaltijden", status: "gemiddeld" },
          { emoji: "🚗", label: "Vervoer", status: "licht" },
        ],
      },
    },
    {
      sleutel: "mantelbuddies",
      titel: "MantelBuddies",
      inhoud: "Een **MantelBuddy** is een vrijwilliger bij jou in de buurt. Die helpt je graag met kleine taken.",
      subtekst: "Eenmalig of vaker — jij kiest. Je vindt ze bij **Hulp**.",
      emoji: "🤝",
      volgorde: 4,
      metadata: {
        items: [
          { emoji: "🛒", text: "Boodschappen doen" },
          { emoji: "☕", text: "Even een praatje maken" },
          { emoji: "🚗", text: "Mee naar de dokter" },
          { emoji: "🔧", text: "Klusjes in huis" },
        ],
      },
    },
    {
      sleutel: "informatie",
      titel: "Informatie en tips",
      inhoud: "Bij **Informatie** vind je handige artikelen en nieuws uit jouw gemeente.",
      emoji: "📚",
      volgorde: 5,
      metadata: {
        categories: [
          { emoji: "💡", title: "Praktische tips" },
          { emoji: "🧘", title: "Zelfzorg" },
          { emoji: "⚖️", title: "Je rechten" },
          { emoji: "💰", title: "Financieel" },
        ],
        gemeenteNieuws: { emoji: "🏘️", title: "Nieuws van de gemeente", subtitle: "Updates bij jou in de buurt" },
      },
    },
    {
      sleutel: "favorieten",
      titel: "Bewaar je favorieten",
      inhoud: "Kom je iets tegen dat je wilt onthouden? Tik op het **hartje ❤️** om het te bewaren.",
      subtekst: "Je favorieten vind je terug op een eigen pagina. Daar kun je ze ook **afvinken** als je ze hebt gedaan. ✅",
      emoji: "❤️",
      volgorde: 6,
    },
    {
      sleutel: "klaar",
      titel: "Je bent er klaar voor!",
      inhoud: "Ik ben trots op je dat je deze stap zet. Mantelzorg is niet makkelijk, maar je staat er niet alleen voor.",
      subtekst: "Je kunt deze uitleg altijd teruglezen via je **Profiel**. 👤",
      emoji: "🎉",
      volgorde: 7,
    },
  ]

  for (const stap of tutorialStappen) {
    await prisma.appContent.upsert({
      where: { type_sleutel: { type: "TUTORIAL", sleutel: stap.sleutel } },
      create: { type: "TUTORIAL", ...stap },
      update: {
        titel: stap.titel,
        inhoud: stap.inhoud,
        subtekst: stap.subtekst,
        emoji: stap.emoji,
        volgorde: stap.volgorde,
        metadata: stap.metadata,
      },
    })
  }
  console.log(`  ${tutorialStappen.length} tutorial stappen seeded`)

  // ============================================
  // 9. ONBOARDING STAPPEN
  // ============================================
  console.log('Seeding onboarding stappen...')

  const onboardingStappen = [
    {
      sleutel: "welkom",
      titel: "Hoi! Welkom bij MantelBuddy",
      inhoud: "Fijn dat je er bent. In een paar stappen maken we de app klaar voor jou.",
      subtekst: "Het duurt maar 2 minuutjes.",
      emoji: "👋",
      volgorde: 0,
    },
    {
      sleutel: "wie-ben-jij",
      titel: "Wie ben jij?",
      inhoud: "Zodat we hulp bij jou in de buurt kunnen vinden.",
      emoji: "👤",
      volgorde: 1,
    },
    {
      sleutel: "zorgsituatie",
      titel: "Jouw zorgsituatie",
      inhoud: "Zo kunnen we beter inschatten wat je nodig hebt.",
      emoji: "💪",
      volgorde: 2,
    },
    {
      sleutel: "app-uitleg",
      titel: "Wat kan MantelBuddy?",
      inhoud: "Dit zijn de belangrijkste onderdelen van de app.",
      emoji: "📱",
      volgorde: 3,
      metadata: {
        features: [
          { emoji: "📊", title: "Balanstest", description: "Korte test die meet hoe het met je gaat" },
          { emoji: "🔍", title: "Hulp zoeken", description: "Vind hulp bij jou in de buurt" },
          { emoji: "📚", title: "Tips & informatie", description: "Handige artikelen en nieuws" },
          { emoji: "❤️", title: "Favorieten", description: "Bewaar wat je wilt onthouden" },
        ],
      },
    },
    {
      sleutel: "klaar",
      titel: "Alles staat klaar!",
      inhoud: "Je kunt nu beginnen. Veel succes!",
      emoji: "🎉",
      volgorde: 4,
    },
  ]

  for (const stap of onboardingStappen) {
    await prisma.appContent.upsert({
      where: { type_sleutel: { type: "ONBOARDING", sleutel: stap.sleutel } },
      create: { type: "ONBOARDING", ...stap },
      update: {
        titel: stap.titel,
        inhoud: stap.inhoud,
        subtekst: stap.subtekst,
        emoji: stap.emoji,
        volgorde: stap.volgorde,
        metadata: stap.metadata,
      },
    })
  }
  console.log(`  ${onboardingStappen.length} onboarding stappen seeded`)

  // ============================================
  // 10. PAGINA INTRO'S
  // ============================================
  console.log('Seeding pagina intro\'s...')

  const paginaIntros = [
    {
      sleutel: "leren",
      titel: "Informatie & tips",
      inhoud: "Handige informatie speciaal voor mantelzorgers. Geschreven in eenvoudige taal.",
      emoji: "📚",
      volgorde: 1,
    },
    {
      sleutel: "hulpvragen",
      titel: "Hulp zoeken",
      inhoud: "Vind hulp bij jou in de buurt, afgestemd op jouw situatie.",
      emoji: "🔍",
      volgorde: 2,
    },
    {
      sleutel: "balanstest",
      titel: "Balanstest",
      inhoud: "Doe de korte test en ontdek hoe het met je gaat.",
      emoji: "📊",
      volgorde: 3,
    },
    {
      sleutel: "check-in",
      titel: "Maandelijkse check-in",
      inhoud: "Even kijken hoe het gaat. 5 korte vragen.",
      emoji: "💬",
      volgorde: 4,
    },
    {
      sleutel: "gemeente-nieuws",
      titel: "Nieuws uit jouw gemeente",
      inhoud: "Actuele berichten en evenementen voor mantelzorgers bij jou in de buurt.",
      emoji: "🏘️",
      volgorde: 5,
    },
  ]

  for (const intro of paginaIntros) {
    await prisma.appContent.upsert({
      where: { type_sleutel: { type: "PAGINA_INTRO", sleutel: intro.sleutel } },
      create: { type: "PAGINA_INTRO", ...intro },
      update: {
        titel: intro.titel,
        inhoud: intro.inhoud,
        emoji: intro.emoji,
        volgorde: intro.volgorde,
      },
    })
  }
  console.log(`  ${paginaIntros.length} pagina intro's seeded`)

  console.log('\nContent seeding complete!')
}

main()
  .catch((e) => {
    console.error('Error seeding content:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
