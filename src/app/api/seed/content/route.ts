import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60

export async function POST(request: Request) {
  const results: string[] = []

  try {
    // 1. BALANSTEST VRAGEN
    const balanstestVragen = [
      { vraagId: "q1", type: "BALANSTEST" as const, sectie: "Jouw energie", beschrijving: "Eerst een paar vragen aan jou over hoe jij je lichamelijk voelt.", vraagTekst: "Slaap je minder goed door de zorg voor je naaste?", tip: "Veel mantelzorgers merken dat hun slaap onrustig wordt door piekeren of nachtelijke zorgtaken.", gewicht: 1.5, volgorde: 1 },
      { vraagId: "q2", type: "BALANSTEST" as const, sectie: "Jouw energie", vraagTekst: "Heb je last van je lichaam door het zorgen?", tip: "Fysieke klachten zoals rugpijn of vermoeidheid komen veel voor bij mantelzorgers.", gewicht: 1.0, volgorde: 2 },
      { vraagId: "q3", type: "BALANSTEST" as const, sectie: "Jouw energie", vraagTekst: "Kost het zorgen veel tijd en energie?", tip: "Het is normaal om dit te ervaren. Zorg goed voor jezelf.", gewicht: 1.0, volgorde: 3 },
      { vraagId: "q4", type: "BALANSTEST" as const, sectie: "Jouw gevoel", beschrijving: "Nu een paar vragen over hoe jij je emotioneel voelt.", vraagTekst: "Is de band met je naaste veranderd?", tip: "Relaties veranderen door ziekte. Dat is normaal en soms lastig.", gewicht: 1.5, volgorde: 4 },
      { vraagId: "q5", type: "BALANSTEST" as const, sectie: "Jouw gevoel", vraagTekst: "Maakt het gedrag van je naaste je verdrietig, bang of boos?", tip: "Deze gevoelens zijn heel begrijpelijk en komen veel voor.", gewicht: 1.5, volgorde: 5 },
      { vraagId: "q6", type: "BALANSTEST" as const, sectie: "Jouw gevoel", vraagTekst: "Heb je verdriet dat je naaste anders is dan vroeger?", tip: "Rouwen om wie iemand was is een normaal onderdeel van mantelzorg.", gewicht: 1.0, volgorde: 6 },
      { vraagId: "q7", type: "BALANSTEST" as const, sectie: "Jouw gevoel", vraagTekst: "Slokt de zorg al je energie op?", tip: "Als dit zo voelt, is het belangrijk om hulp te zoeken.", gewicht: 1.5, volgorde: 7 },
      { vraagId: "q8", type: "BALANSTEST" as const, sectie: "Jouw tijd", beschrijving: "Tot slot een paar vragen over je tijd en je eigen leven.", vraagTekst: "Pas je je dagelijks leven aan voor de zorg?", tip: "Aanpassingen zijn normaal, maar vergeet jezelf niet.", gewicht: 1.0, volgorde: 8 },
      { vraagId: "q9", type: "BALANSTEST" as const, sectie: "Jouw tijd", vraagTekst: "Pas je regelmatig je plannen aan om te helpen?", tip: "Flexibiliteit is mooi, maar je eigen plannen tellen ook.", gewicht: 1.0, volgorde: 9 },
      { vraagId: "q10", type: "BALANSTEST" as const, sectie: "Jouw tijd", vraagTekst: "Kom je niet meer toe aan dingen die je leuk vindt?", tip: "Tijd voor jezelf is geen luxe, maar noodzaak.", gewicht: 1.0, volgorde: 10 },
      { vraagId: "q11", type: "BALANSTEST" as const, sectie: "Jouw tijd", vraagTekst: "Kost het zorgen net zoveel tijd als je werk?", tip: "Mantelzorg is ook werk. Gun jezelf erkenning hiervoor.", gewicht: 1.5, volgorde: 11 },
    ]
    for (const v of balanstestVragen) {
      await prisma.balanstestVraag.upsert({ where: { vraagId: v.vraagId }, create: v, update: { vraagTekst: v.vraagTekst, tip: v.tip, sectie: v.sectie, beschrijving: v.beschrijving, gewicht: v.gewicht, volgorde: v.volgorde } })
    }
    results.push(`${balanstestVragen.length} balanstest vragen`)

    // 2. CHECK-IN VRAGEN
    const checkInVragen = [
      { vraagId: "c1", type: "CHECKIN" as const, vraagTekst: "Ben je vaak moe?", tip: "Als je veel moe bent, is dat een teken dat je rust nodig hebt.", reversed: false, volgorde: 1 },
      { vraagId: "c2", type: "CHECKIN" as const, vraagTekst: "Heb je tijd voor jezelf?", tip: "Tijd voor jezelf is belangrijk. Ook voor jou.", reversed: true, volgorde: 2 },
      { vraagId: "c3", type: "CHECKIN" as const, vraagTekst: "Maak je je vaak zorgen?", tip: "Zorgen maken hoort erbij. Maar het mag niet te veel worden.", reversed: false, volgorde: 3 },
      { vraagId: "c4", type: "CHECKIN" as const, vraagTekst: "Krijg je hulp van anderen?", tip: "Hulp van anderen is fijn. Je hoeft het niet alleen te doen.", reversed: true, volgorde: 4 },
      { vraagId: "c5", type: "CHECKIN" as const, vraagTekst: "Waar wil je hulp bij?", tip: "Kies wat voor jou belangrijk is. Je kunt meer dan een ding kiezen.", isMultiSelect: true, volgorde: 5 },
    ]
    for (const v of checkInVragen) {
      await prisma.balanstestVraag.upsert({ where: { vraagId: v.vraagId }, create: v, update: { vraagTekst: v.vraagTekst, tip: v.tip, reversed: v.reversed, isMultiSelect: v.isMultiSelect, volgorde: v.volgorde } })
    }
    results.push(`${checkInVragen.length} check-in vragen`)

    // 3. ZORGTAKEN
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
    for (const t of zorgtaken) {
      await prisma.zorgtaak.upsert({ where: { taakId: t.taakId }, create: t, update: { naam: t.naam, beschrijving: t.beschrijving, volgorde: t.volgorde } })
    }
    results.push(`${zorgtaken.length} zorgtaken`)

    // 4. CONTENT CATEGORIEEN
    // Zorgvrager
    const catZorgvrager = [
      { slug: "persoonlijke-verzorging", naam: "Persoonlijke verzorging", icon: "\u{1F6C1}", hint: "Verzorging", metadata: { groep: "Dagelijks leven", routeLabel: "Wmo/Zvw/Wlz" }, volgorde: 1 },
      { slug: "maaltijden", naam: "Bereiden en/of nuttigen van maaltijden", icon: "\u{1F37D}\uFE0F", hint: "Maaltijden", metadata: { groep: "Dagelijks leven", routeLabel: "Gemeente" }, volgorde: 2 },
      { slug: "boodschappen", naam: "Boodschappen", icon: "\u{1F6D2}", hint: "Boodschappen", metadata: { groep: "Dagelijks leven", routeLabel: "Gemeente" }, volgorde: 3 },
      { slug: "huishoudelijke-taken", naam: "Huishoudelijke taken", icon: "\u{1F9F9}", hint: "Huishouden", metadata: { groep: "In en om het huis", routeLabel: "Wmo" }, volgorde: 4 },
      { slug: "klusjes", naam: "Klusjes in en om het huis", icon: "\u{1F527}", hint: "Klusjes", metadata: { groep: "In en om het huis", routeLabel: "Gemeente" }, volgorde: 5 },
      { slug: "administratie", naam: "Administratie en aanvragen", icon: "\u{1F4CB}", hint: "Administratie", metadata: { groep: "Organisatie & regelwerk", routeLabel: "Landelijk" }, volgorde: 6 },
      { slug: "plannen", naam: "Plannen en organiseren", icon: "\u{1F4C5}", hint: "Plannen", metadata: { groep: "Organisatie & regelwerk", routeLabel: null }, volgorde: 7 },
      { slug: "sociaal-contact", naam: "Sociaal contact en activiteiten", icon: "\u{1F465}", hint: "Sociaal", metadata: { groep: "Welzijn & mobiliteit", routeLabel: "Wmo" }, volgorde: 8 },
      { slug: "vervoer", naam: "Vervoer", icon: "\u{1F697}", hint: "Vervoer", metadata: { groep: "Welzijn & mobiliteit", routeLabel: "Landelijk" }, volgorde: 9 },
      { slug: "huisdieren", naam: "Huisdieren", icon: "\u{1F415}", hint: "Huisdieren", metadata: { groep: "Overig", routeLabel: null }, volgorde: 10 },
    ]
    for (const c of catZorgvrager) {
      await prisma.contentCategorie.upsert({ where: { type_slug: { type: "HULP_ZORGVRAGER", slug: c.slug } }, create: { type: "HULP_ZORGVRAGER", ...c }, update: { naam: c.naam, icon: c.icon, hint: c.hint, metadata: c.metadata, volgorde: c.volgorde } })
    }

    // Mantelzorger
    const catMantelzorger = [
      { slug: "mantelzorgondersteuning", naam: "Mantelzorgondersteuning", icon: "\u{1F49C}", hint: "Ondersteuning", volgorde: 1 },
      { slug: "vervangende-mantelzorg", naam: "Vervangende mantelzorg", icon: "\u{1F3E0}", hint: "Vervangende mantelzorg", volgorde: 2 },
      { slug: "emotionele-steun", naam: "Emotionele steun", icon: "\u{1F49A}", hint: "Praten & steun", volgorde: 3 },
      { slug: "lotgenotencontact", naam: "Lotgenotencontact", icon: "\u{1F465}", hint: "Lotgenoten", volgorde: 4 },
      { slug: "leren-en-training", naam: "Leren en training", icon: "\u{1F393}", hint: "Leren & training", volgorde: 5 },
    ]
    for (const c of catMantelzorger) {
      await prisma.contentCategorie.upsert({ where: { type_slug: { type: "HULP_MANTELZORGER", slug: c.slug } }, create: { type: "HULP_MANTELZORGER", ...c }, update: { naam: c.naam, icon: c.icon, hint: c.hint, volgorde: c.volgorde } })
    }
    // Verwijder oude/hernoemde categorieën (bijv. Respijtzorg → Vervangende mantelzorg)
    const geldigeSlugs = catMantelzorger.map(c => c.slug)
    await prisma.contentCategorie.deleteMany({
      where: { type: "HULP_MANTELZORGER", slug: { notIn: geldigeSlugs } },
    })

    // Hulpvraag
    const catHulpvraag = [
      { slug: "respite-care", naam: "Even vrij", icon: "\u{1F3E0}", hint: "Iemand neemt de zorg over", volgorde: 1 },
      { slug: "emotional-support", naam: "Praten", icon: "\u{1F49A}", hint: "Over je gevoel praten", volgorde: 2 },
      { slug: "practical-help", naam: "Hulp thuis", icon: "\u{1F527}", hint: "Klussen of taken", volgorde: 3 },
      { slug: "financial-advice", naam: "Geld", icon: "\u{1F4B0}", hint: "Hulp met geld of aanvragen", volgorde: 4 },
      { slug: "information", naam: "Info", icon: "\u2139\uFE0F", hint: "Informatie zoeken", volgorde: 5 },
      { slug: "other", naam: "Anders", icon: "\u{1F4DD}", hint: "Iets anders", volgorde: 6 },
    ]
    for (const c of catHulpvraag) {
      await prisma.contentCategorie.upsert({ where: { type_slug: { type: "HULPVRAAG", slug: c.slug } }, create: { type: "HULPVRAAG", ...c }, update: { naam: c.naam, icon: c.icon, hint: c.hint, volgorde: c.volgorde } })
    }

    // Leren + sub-hoofdstukken
    const lerenCats = [
      { slug: "praktische-tips", naam: "Praktische tips", beschrijving: "Voor het dagelijks leven", emoji: "\u{1F4A1}", volgorde: 1 },
      { slug: "zelfzorg", naam: "Zelfzorg", beschrijving: "Zorg ook voor jezelf", emoji: "\u{1F9D8}", volgorde: 2 },
      { slug: "rechten", naam: "Je rechten", beschrijving: "Wmo, Zvw, Wlz en meer", emoji: "\u2696\uFE0F", volgorde: 3 },
      { slug: "financieel", naam: "Financieel", beschrijving: "Kosten, vergoedingen & pgb", emoji: "\u{1F4B0}", volgorde: 4 },
      { slug: "hulpmiddelen-producten", naam: "Hulpmiddelen & producten", beschrijving: "Fysiek, digitaal & aanpassingen", emoji: "\u{1F6E0}\uFE0F", volgorde: 5 },
    ]
    for (const c of lerenCats) {
      await prisma.contentCategorie.upsert({ where: { type_slug: { type: "LEREN", slug: c.slug } }, create: { type: "LEREN", ...c }, update: { naam: c.naam, beschrijving: c.beschrijving, emoji: c.emoji, volgorde: c.volgorde } })
    }

    const subHoofdstukken: Record<string, { slug: string; naam: string; beschrijving: string }[]> = {
      "praktische-tips": [
        { slug: "dagelijks-organiseren", naam: "Dagelijks organiseren", beschrijving: "Dagstructuur, weekplanning en taken uitbesteden" },
        { slug: "samen-organiseren", naam: "Samen organiseren met familie/netwerk", beschrijving: "Afspraken, back-up en samenwerking" },
        { slug: "veiligheid-zware-taken", naam: "Veiligheid bij zware taken", beschrijving: "Tillen, verplaatsen en medicatie" },
      ],
      "zelfzorg": [
        { slug: "overbelasting-herkennen", naam: "Overbelasting herkennen", beschrijving: "Signalen herkennen en wat je kunt doen" },
        { slug: "pauze-en-respijt", naam: "Pauze en respijt organiseren", beschrijving: "Tijdelijke overname van zorg regelen" },
        { slug: "emotionele-steun", naam: "Emotionele steun en praten", beschrijving: "Steun zoeken en stress verwerken" },
      ],
      "rechten": [
        { slug: "routekaart-wmo-zvw-wlz", naam: "Routekaart Wmo / Zvw / Wlz", beschrijving: "Wat hoort waar? Interactief overzicht" },
        { slug: "gemeente-wmo-aanvragen", naam: "Gemeente (Wmo) aanvragen", beschrijving: "Wat je kunt krijgen en hoe je het aanvraagt" },
        { slug: "clientondersteuning", naam: "Gratis clientondersteuning", beschrijving: "Onafhankelijke hulp bij het organiseren van zorg" },
      ],
      "financieel": [
        { slug: "eigen-bijdrage-kosten", naam: "Eigen bijdrage en kosten", beschrijving: "CAK, abonnementstarief en rekentools" },
        { slug: "mantelzorgwaardering", naam: "Mantelzorgwaardering", beschrijving: "Jaarlijkse waardering van je gemeente" },
        { slug: "pgb-aanvragen-beheer", naam: "Pgb: aanvragen en beheer", beschrijving: "Route, vaardigheden en SVB" },
        { slug: "vergoedingen-hulpmiddelen", naam: "Vergoedingen hulpmiddelen", beschrijving: "Eerst aanvragen, dan kopen" },
      ],
      "hulpmiddelen-producten": [
        { slug: "hulpmiddelen-overzicht", naam: "Hulpmiddelen overzicht", beschrijving: "Fysieke en digitale hulpmiddelen vinden" },
        { slug: "vergoedingsroutes", naam: "Vergoedingsroutes", beschrijving: "Welk hulpmiddel via welke wet?" },
      ],
    }

    const lerenParents = await prisma.contentCategorie.findMany({ where: { type: "LEREN" }, select: { id: true, slug: true } })
    const parentMap = Object.fromEntries(lerenParents.map(p => [p.slug, p.id]))
    let subCount = 0
    for (const [categorieSlug, subs] of Object.entries(subHoofdstukken)) {
      const parentId = parentMap[categorieSlug]
      if (!parentId) continue
      for (let i = 0; i < subs.length; i++) {
        const sub = subs[i]
        await prisma.contentCategorie.upsert({ where: { type_slug: { type: "SUB_HOOFDSTUK", slug: sub.slug } }, create: { type: "SUB_HOOFDSTUK", slug: sub.slug, naam: sub.naam, beschrijving: sub.beschrijving, parentId, volgorde: i + 1 }, update: { naam: sub.naam, beschrijving: sub.beschrijving, parentId, volgorde: i + 1 } })
        subCount++
      }
    }
    results.push(`${catZorgvrager.length + catMantelzorger.length + catHulpvraag.length + lerenCats.length} categorieen + ${subCount} sub-hoofdstukken`)

    // 5. TAAK-CATEGORIE MAPPINGS
    const categorieNaarZorgtaak: Record<string, string> = {
      "Persoonlijke verzorging": "t6", "Huishoudelijke taken": "t8", "Vervoer": "t5",
      "Administratie en aanvragen": "t1", "Plannen en organiseren": "t2",
      "Sociaal contact en activiteiten": "t4", "Bereiden en/of nuttigen van maaltijden": "t7",
      "Boodschappen": "t3", "Klusjes in en om het huis": "t9", "Huisdieren": "t4",
    }
    const taakMappings = [
      { bronNaam: "Persoonlijke verzorging", doelCategorie: "Persoonlijke verzorging" },
      { bronNaam: "Huishouden", doelCategorie: "Huishoudelijke taken" },
      { bronNaam: "Huishoudelijke taken", doelCategorie: "Huishoudelijke taken" },
      { bronNaam: "Vervoer", doelCategorie: "Vervoer" },
      { bronNaam: "Vervoer naar afspraken", doelCategorie: "Vervoer" },
      { bronNaam: "Administratie", doelCategorie: "Administratie en aanvragen" },
      { bronNaam: "Administratie en geldzaken", doelCategorie: "Administratie en aanvragen" },
      { bronNaam: "Regelen en afspraken maken", doelCategorie: "Plannen en organiseren" },
      { bronNaam: "Bezoek en gezelschap", doelCategorie: "Sociaal contact en activiteiten" },
      { bronNaam: "Eten en drinken", doelCategorie: "Bereiden en/of nuttigen van maaltijden" },
      { bronNaam: "Boodschappen", doelCategorie: "Boodschappen" },
      { bronNaam: "Boodschappen doen", doelCategorie: "Boodschappen" },
      { bronNaam: "Klusjes in en om huis", doelCategorie: "Klusjes in en om het huis" },
      { bronNaam: "Klusjes in en om het huis", doelCategorie: "Klusjes in en om het huis" },
      { bronNaam: "Huisdieren", doelCategorie: "Huisdieren" },
    ]
    const zorgtakenById = await prisma.zorgtaak.findMany({ select: { id: true, taakId: true } })
    const zorgtaakIdMap = Object.fromEntries(zorgtakenById.map(t => [t.taakId, t.id]))
    let mappingCount = 0
    for (const m of taakMappings) {
      const taakCode = categorieNaarZorgtaak[m.doelCategorie]
      const zorgtaakId = taakCode ? zorgtaakIdMap[taakCode] : null
      if (!zorgtaakId) continue
      await prisma.taakCategorieMapping.upsert({ where: { bronNaam: m.bronNaam }, create: { bronNaam: m.bronNaam, zorgtaakId }, update: { zorgtaakId } })
      mappingCount++
    }
    results.push(`${mappingCount} taak-categorie mappings`)

    // 6. FORMULIER OPTIES
    const allOpties = [
      ...[ { waarde: "partner", label: "Mijn partner", emoji: "\u{1F491}", volgorde: 1 }, { waarde: "ouder", label: "Mijn ouder", emoji: "\u{1F475}", volgorde: 2 }, { waarde: "kind", label: "Mijn kind", emoji: "\u{1F467}", volgorde: 3 }, { waarde: "ander-familielid", label: "Ander familielid", emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}", volgorde: 4 }, { waarde: "kennis", label: "Kennis of vriend(in)", emoji: "\u{1F91D}", volgorde: 5 } ].map(o => ({ groep: "RELATIE" as const, ...o })),
      ...[ { waarde: "0-5", label: "0 - 5 uur", beschrijving: "Af en toe bijspringen", volgorde: 1 }, { waarde: "5-10", label: "5 - 10 uur", beschrijving: "Regelmatig helpen", volgorde: 2 }, { waarde: "10-20", label: "10 - 20 uur", beschrijving: "Flink bezig", volgorde: 3 }, { waarde: "20-40", label: "20 - 40 uur", beschrijving: "Bijna een baan", volgorde: 4 }, { waarde: "40+", label: "Meer dan 40 uur", beschrijving: "Fulltime zorg", volgorde: 5 } ].map(o => ({ groep: "UREN_PER_WEEK" as const, ...o })),
      ...[ { waarde: "<1", label: "Minder dan 1 jaar", emoji: "\u{1F331}", volgorde: 1 }, { waarde: "1-3", label: "1 - 3 jaar", emoji: "\u{1F33F}", volgorde: 2 }, { waarde: "3-5", label: "3 - 5 jaar", emoji: "\u{1F333}", volgorde: 3 }, { waarde: "5+", label: "Meer dan 5 jaar", emoji: "\u{1F3D4}\uFE0F", volgorde: 4 } ].map(o => ({ groep: "ZORGDUUR" as const, ...o })),
      ...[ { waarde: "0-2", label: "Tot 2 uur per week", beschrijving: "1", volgorde: 1 }, { waarde: "2-4", label: "2 tot 4 uur per week", beschrijving: "3", volgorde: 2 }, { waarde: "4-8", label: "4 tot 8 uur per week", beschrijving: "6", volgorde: 3 }, { waarde: "8-12", label: "8 tot 12 uur per week", beschrijving: "10", volgorde: 4 }, { waarde: "12-24", label: "12 tot 24 uur per week", beschrijving: "18", volgorde: 5 }, { waarde: "24+", label: "Meer dan 24 uur per week", beschrijving: "30", volgorde: 6 } ].map(o => ({ groep: "UREN_BALANSTEST" as const, ...o })),
      ...[ { waarde: "geen", label: "Het gaat goed zo", emoji: "\u2705", volgorde: 1 }, { waarde: "huishouden", label: "Huishouden", emoji: "\u{1F9F9}", volgorde: 2 }, { waarde: "zorgtaken", label: "Zorgtaken", emoji: "\u{1FA7A}", volgorde: 3 }, { waarde: "tijd_voor_mezelf", label: "Tijd voor mezelf", emoji: "\u{1F9D8}", volgorde: 4 }, { waarde: "administratie", label: "Papierwerk", emoji: "\u{1F4CB}", volgorde: 5 }, { waarde: "emotioneel", label: "Praten met iemand", emoji: "\u{1F4AC}", volgorde: 6 } ].map(o => ({ groep: "CHECKIN_HULP" as const, ...o })),
      ...[ { waarde: "gesprek", label: "Gesprek / praatje", emoji: "\u2615", volgorde: 1 }, { waarde: "boodschappen", label: "Boodschappen", emoji: "\u{1F6D2}", volgorde: 2 }, { waarde: "vervoer", label: "Vervoer", emoji: "\u{1F697}", volgorde: 3 }, { waarde: "klusjes", label: "Klusjes", emoji: "\u{1F527}", volgorde: 4 }, { waarde: "oppas", label: "Oppas / toezicht", emoji: "\u{1F3E0}", volgorde: 5 }, { waarde: "administratie", label: "Administratie", emoji: "\u{1F4CB}", volgorde: 6 } ].map(o => ({ groep: "BUDDY_HULPVORM" as const, ...o })),
    ]
    for (const o of allOpties) {
      await prisma.formulierOptie.upsert({ where: { groep_waarde: { groep: o.groep, waarde: o.waarde } }, create: o, update: { label: o.label, emoji: (o as any).emoji, beschrijving: (o as any).beschrijving, volgorde: o.volgorde } })
    }
    results.push(`${allOpties.length} formulier opties`)

    // 7. APP CONTENT (tutorial, onboarding, pagina intro's)
    const appContent = [
      // Tutorial
      { type: "TUTORIAL" as const, sleutel: "welkom", titel: "Welkom bij MantelBuddy", inhoud: "Ik ben **Ger**, en ik ga je stap voor stap uitleggen hoe MantelBuddy jou kan helpen.", subtekst: "Het duurt maar 2 minuutjes.", emoji: "\u{1F44B}", volgorde: 0 },
      { type: "TUTORIAL" as const, sleutel: "balanstest", titel: "De Balanstest", inhoud: "Met een **korte test** van 2 minuten kijken we hoe het met je gaat.", emoji: "\u{1F4CA}", volgorde: 1, metadata: { demoScore: 13, maxScore: 24 } },
      { type: "TUTORIAL" as const, sleutel: "hulp-mantelzorger", titel: "Hulp voor jou", inhoud: "Je hoeft het niet alleen te doen. MantelBuddy zoekt hulp **bij jou in de buurt**.", subtekst: "Daarom vragen we je adres.", emoji: "\u{1F49C}", volgorde: 2, metadata: { items: [{ emoji: "\u{1F49C}", label: "Ondersteuning" }, { emoji: "\u{1F3E0}", label: "Vervangende mantelzorg" }, { emoji: "\u{1F49A}", label: "Praten" }, { emoji: "\u{1F465}", label: "Lotgenoten" }] } },
      { type: "TUTORIAL" as const, sleutel: "hulp-naaste", titel: "Hulp voor je naaste", inhoud: "Er is ook hulp voor de persoon waar je voor zorgt.", emoji: "\u{1F49D}", volgorde: 3, metadata: { items: [{ emoji: "\u{1F6C1}", label: "Verzorging", status: "zwaar" }, { emoji: "\u{1F9F9}", label: "Huishouden", status: "gemiddeld" }, { emoji: "\u{1F37D}\uFE0F", label: "Maaltijden", status: "gemiddeld" }, { emoji: "\u{1F697}", label: "Vervoer", status: "licht" }] } },
      { type: "TUTORIAL" as const, sleutel: "mantelbuddies", titel: "MantelBuddies", inhoud: "Een **MantelBuddy** is een vrijwilliger bij jou in de buurt.", emoji: "\u{1F91D}", volgorde: 4, metadata: { items: [{ emoji: "\u{1F6D2}", text: "Boodschappen doen" }, { emoji: "\u2615", text: "Even een praatje maken" }, { emoji: "\u{1F697}", text: "Mee naar de dokter" }, { emoji: "\u{1F527}", text: "Klusjes in huis" }] } },
      { type: "TUTORIAL" as const, sleutel: "informatie", titel: "Informatie en tips", inhoud: "Bij **Informatie** vind je handige artikelen en nieuws uit jouw gemeente.", emoji: "\u{1F4DA}", volgorde: 5 },
      { type: "TUTORIAL" as const, sleutel: "favorieten", titel: "Bewaar je favorieten", inhoud: "Kom je iets tegen dat je wilt onthouden? Tik op het **hartje** om het te bewaren.", emoji: "\u2764\uFE0F", volgorde: 6 },
      { type: "TUTORIAL" as const, sleutel: "klaar", titel: "Je bent er klaar voor!", inhoud: "Ik ben trots op je dat je deze stap zet. Mantelzorg is niet makkelijk, maar je staat er niet alleen voor.", emoji: "\u{1F389}", volgorde: 7 },
      // Onboarding
      { type: "ONBOARDING" as const, sleutel: "welkom", titel: "Hoi! Welkom bij MantelBuddy", inhoud: "Fijn dat je er bent. In een paar stappen maken we de app klaar voor jou.", subtekst: "Het duurt maar 2 minuutjes.", emoji: "\u{1F44B}", volgorde: 0 },
      { type: "ONBOARDING" as const, sleutel: "wie-ben-jij", titel: "Wie ben jij?", inhoud: "Zodat we hulp bij jou in de buurt kunnen vinden.", emoji: "\u{1F464}", volgorde: 1 },
      { type: "ONBOARDING" as const, sleutel: "zorgsituatie", titel: "Jouw zorgsituatie", inhoud: "Zo kunnen we beter inschatten wat je nodig hebt.", emoji: "\u{1F4AA}", volgorde: 2 },
      { type: "ONBOARDING" as const, sleutel: "app-uitleg", titel: "Wat kan MantelBuddy?", inhoud: "Dit zijn de belangrijkste onderdelen van de app.", emoji: "\u{1F4F1}", volgorde: 3, metadata: { features: [{ emoji: "\u{1F4CA}", title: "Balanstest", description: "Korte test die meet hoe het met je gaat" }, { emoji: "\u{1F50D}", title: "Hulp zoeken", description: "Vind hulp bij jou in de buurt" }, { emoji: "\u{1F4DA}", title: "Tips & informatie", description: "Handige artikelen en nieuws" }, { emoji: "\u2764\uFE0F", title: "Favorieten", description: "Bewaar wat je wilt onthouden" }] } },
      { type: "ONBOARDING" as const, sleutel: "klaar", titel: "Alles staat klaar!", inhoud: "Je kunt nu beginnen. Veel succes!", emoji: "\u{1F389}", volgorde: 4 },
      // Pagina intro's
      { type: "PAGINA_INTRO" as const, sleutel: "leren", titel: "Informatie & tips", inhoud: "Handige informatie speciaal voor mantelzorgers. Geschreven in eenvoudige taal.", emoji: "\u{1F4DA}", volgorde: 1 },
      { type: "PAGINA_INTRO" as const, sleutel: "hulpvragen", titel: "Hulp zoeken", inhoud: "Vind hulp bij jou in de buurt, afgestemd op jouw situatie.", emoji: "\u{1F50D}", volgorde: 2 },
      { type: "PAGINA_INTRO" as const, sleutel: "balanstest", titel: "Balanstest", inhoud: "Doe de korte test en ontdek hoe het met je gaat.", emoji: "\u{1F4CA}", volgorde: 3 },
      { type: "PAGINA_INTRO" as const, sleutel: "check-in", titel: "Maandelijkse check-in", inhoud: "Even kijken hoe het gaat. 5 korte vragen.", emoji: "\u{1F4AC}", volgorde: 4 },
      { type: "PAGINA_INTRO" as const, sleutel: "gemeente-nieuws", titel: "Nieuws uit jouw gemeente", inhoud: "Actuele berichten en evenementen voor mantelzorgers bij jou in de buurt.", emoji: "\u{1F3D8}\uFE0F", volgorde: 5 },
    ]
    for (const c of appContent) {
      await prisma.appContent.upsert({ where: { type_sleutel: { type: c.type, sleutel: c.sleutel } }, create: c, update: { titel: c.titel, inhoud: c.inhoud, subtekst: (c as any).subtekst, emoji: c.emoji, volgorde: c.volgorde, metadata: (c as any).metadata } })
    }
    results.push(`${appContent.length} app content items`)

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Seed content error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
