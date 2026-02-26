/**
 * Centrale definitie van alle keuzelijsten, enums en opties.
 * Dit is de single source of truth voor zorgtaken, relaties,
 * statussen, rollen en andere herbruikbare lijsten.
 */

// ============================================
// ZORGTAKEN
// ============================================

export interface ZorgtaakDef {
  id: string
  naam: string
  beschrijving: string
  dbValue: string  // Waarde zoals opgeslagen in de database
  emoji?: string
}

export const ZORGTAKEN: ZorgtaakDef[] = [
  { id: "t1", naam: "Persoonlijke verzorging", beschrijving: "Wassen, aankleden, naar toilet", dbValue: "Persoonlijke verzorging", emoji: "🛁" },
  { id: "t2", naam: "Huishoudelijke taken", beschrijving: "Schoonmaken, opruimen", dbValue: "Huishoudelijke taken", emoji: "🏠" },
  { id: "t3", naam: "Maaltijden", beschrijving: "Koken, eten bereiden", dbValue: "Bereiden en/of nuttigen van maaltijden", emoji: "🍽️" },
  { id: "t4", naam: "Boodschappen", beschrijving: "Boodschappen doen", dbValue: "Boodschappen", emoji: "🛒" },
  { id: "t5", naam: "Administratie", beschrijving: "Post, rekeningen, formulieren", dbValue: "Administratie en aanvragen", emoji: "📋" },
  { id: "t6", naam: "Vervoer", beschrijving: "Brengen, halen, begeleiden", dbValue: "Vervoer", emoji: "🚗" },
  { id: "t7", naam: "Sociaal contact", beschrijving: "Gezelschap, uitjes, activiteiten", dbValue: "Sociaal contact en activiteiten", emoji: "👥" },
  { id: "t8", naam: "Klusjes", beschrijving: "Klusjes in en om het huis", dbValue: "Klusjes in en om het huis", emoji: "🔨" },
  { id: "t9", naam: "Plannen & organiseren", beschrijving: "Afspraken, planning", dbValue: "Plannen en organiseren", emoji: "📅" },
  { id: "t10", naam: "Huisdieren", beschrijving: "Verzorging huisdieren", dbValue: "Huisdieren", emoji: "🐕" },
]

// Lookup helpers
export function zorgtaakById(id: string): ZorgtaakDef | undefined {
  return ZORGTAKEN.find((t) => t.id === id)
}

export function zorgtaakByDbValue(dbValue: string): ZorgtaakDef | undefined {
  return ZORGTAKEN.find((t) => t.dbValue === dbValue)
}

// Mapping van taak-ID naar database "Onderdeel mantelzorgtest" waarde
export const TAAK_NAAR_ONDERDEEL: Record<string, string> = Object.fromEntries(
  ZORGTAKEN.map((t) => [t.id, t.dbValue])
)

// Mapping van diverse taak-benamingen naar dbValue (voor imports, legacy data, etc.)
export const TAAK_NAAM_VARIANTEN: Record<string, string[]> = {
  "Persoonlijke verzorging": ["Wassen/aankleden", "Toiletgang", "Medicijnen", "Toezicht", "Medische zorg", "Verzorging"],
  "Huishoudelijke taken": ["Huishouden"],
  "Bereiden en/of nuttigen van maaltijden": ["Maaltijden", "Eten maken", "Eten en drinken"],
  "Boodschappen": [],
  "Administratie en aanvragen": ["Administratie"],
  "Vervoer": ["Vervoer/begeleiding"],
  "Sociaal contact en activiteiten": ["Sociaal contact", "Activiteiten", "Sociaal & activiteiten"],
  "Klusjes in en om het huis": ["Klusjes"],
  "Plannen en organiseren": ["Plannen"],
  "Huisdieren": [],
}

// Functie om diverse taak-namen te normaliseren naar een dbValue
export function normaliseerTaakNaam(naam: string): string {
  // Directe match op dbValue
  const directMatch = ZORGTAKEN.find((t) => t.dbValue === naam)
  if (directMatch) return directMatch.dbValue

  // Match op varianten
  for (const [dbValue, varianten] of Object.entries(TAAK_NAAM_VARIANTEN)) {
    if (varianten.includes(naam)) return dbValue
  }

  // Match op naam
  const naamMatch = ZORGTAKEN.find((t) => t.naam === naam)
  if (naamMatch) return naamMatch.dbValue

  return naam
}

// ============================================
// HULP CATEGORIEEEN
// ============================================

export interface HulpCategorieDef {
  id: string
  naam: string
  emoji: string
  dbValue: string
}

// Hulp voor de mantelzorger zelf
export const HULP_VOOR_MANTELZORGER: HulpCategorieDef[] = [
  { id: "informatie", naam: "Informatie en advies", emoji: "ℹ️", dbValue: "Informatie en advies" },
  { id: "educatie", naam: "Educatie & cursussen", emoji: "📚", dbValue: "Educatie" },
  { id: "emotioneel", naam: "Emotionele steun", emoji: "💚", dbValue: "Emotionele steun" },
  { id: "begeleiding", naam: "Persoonlijke begeleiding", emoji: "🤝", dbValue: "Persoonlijke begeleiding" },
  { id: "praktisch", naam: "Praktische hulp", emoji: "🔧", dbValue: "Praktische hulp" },
  { id: "respijt", naam: "Vervangende zorg (respijt)", emoji: "🛏️", dbValue: "Vervangende mantelzorg" },
]

// Hulp bij taken (voor de zorgvrager)
export const HULP_BIJ_TAAK: HulpCategorieDef[] = ZORGTAKEN.map((t) => ({
  id: t.id.replace("t", ""),
  naam: t.naam === "Klusjes" ? "Klusjes in/om huis" : t.naam === "Sociaal contact" ? "Sociaal & activiteiten" : t.naam,
  emoji: t.emoji || "📌",
  dbValue: t.dbValue,
}))

// Legacy alias
export const HULP_CATEGORIEEN = HULP_BIJ_TAAK

// ============================================
// BALANSTEST VRAGEN
// ============================================

export interface BalanstestVraag {
  id: string
  vraag: string
  weegfactor: number
}

export const BALANSTEST_VRAGEN: BalanstestVraag[] = [
  { id: "q1", vraag: "Slaap je minder goed door de zorg?", weegfactor: 1.5 },
  { id: "q2", vraag: "Heb je last van je lichaam door het zorgen?", weegfactor: 1.0 },
  { id: "q3", vraag: "Kost het zorgen veel tijd en energie?", weegfactor: 1.0 },
  { id: "q4", vraag: "Is de band met je naaste veranderd?", weegfactor: 1.5 },
  { id: "q5", vraag: "Maakt het gedrag van je naaste je verdrietig, bang of boos?", weegfactor: 1.5 },
  { id: "q6", vraag: "Heb je verdriet dat je naaste anders is dan vroeger?", weegfactor: 1.0 },
  { id: "q7", vraag: "Slokt de zorg al je energie op?", weegfactor: 1.5 },
  { id: "q8", vraag: "Pas je je dagelijks leven aan voor de zorg?", weegfactor: 1.0 },
  { id: "q9", vraag: "Pas je regelmatig je plannen aan om te helpen?", weegfactor: 1.0 },
  { id: "q10", vraag: "Kom je niet meer toe aan dingen die je leuk vindt?", weegfactor: 1.0 },
  { id: "q11", vraag: "Kost het zorgen net zoveel tijd als je werk?", weegfactor: 1.5 },
  { id: "q12", vraag: "Geeft de zorg je ook geldproblemen?", weegfactor: 1.0 },
]

// ============================================
// ANTWOORD OPTIES
// ============================================

export const MOEILIJKHEID_OPTIES = [
  { id: "m1", label: "Nee", emoji: "🟢", waarde: "NEE" },
  { id: "m2", label: "Soms", emoji: "🟡", waarde: "SOMS" },
  { id: "m3", label: "Ja", emoji: "🔴", waarde: "JA" },
] as const

export const ANTWOORD_SCORES: Record<string, number> = {
  ja: 1,
  soms: 2,
  nee: 3,
}

// ============================================
// UREN PER WEEK
// ============================================

export const UREN_OPTIES = [
  { id: "u1", label: "Tot 2 uur per week", waarde: 1 },
  { id: "u2", label: "2 tot 4 uur per week", waarde: 3 },
  { id: "u3", label: "4 tot 8 uur per week", waarde: 6 },
  { id: "u4", label: "8 tot 12 uur per week", waarde: 10 },
  { id: "u5", label: "12 tot 24 uur per week", waarde: 18 },
  { id: "u6", label: "Meer dan 24 uur per week", waarde: 30 },
] as const

// Mapping voor korte uren-ranges naar waarden
export const UREN_MAP: Record<string, number> = {
  "0-2": 1,
  "2-4": 3,
  "4-8": 6,
  "8-12": 10,
  "12-24": 18,
  "24+": 30,
}

// ============================================
// RELATIES
// ============================================

export const RELATIE_OPTIES = [
  "Partner",
  "Ouder",
  "Schoonouder",
  "Kind",
  "Broer/zus",
  "Vriend(in)",
  "Buur",
  "Anders",
] as const

// ============================================
// ROLLEN
// ============================================

export const ROLLEN = {
  CAREGIVER: "Mantelzorger",
  BUDDY: "MantelBuddy",
  ORG_MEMBER: "Organisatie",
  ORG_ADMIN: "Org. Admin",
  GEMEENTE_ADMIN: "Gemeente Admin",
  ADMIN: "Beheerder",
} as const

export type UserRole = keyof typeof ROLLEN

export const VALID_ROLES = Object.keys(ROLLEN) as UserRole[]

// ============================================
// BELASTING NIVEAUS
// ============================================

export type BelastingNiveau = "LAAG" | "GEMIDDELD" | "HOOG"

export function getScoreLevel(score: number): BelastingNiveau {
  if (score < 7) return "LAAG"
  if (score <= 12) return "GEMIDDELD"
  return "HOOG"
}

// ============================================
// ARTIKEL STATUSSEN & TYPES
// ============================================

export const ARTIKEL_STATUSSEN = [
  { value: "CONCEPT", label: "Concept" },
  { value: "GEPUBLICEERD", label: "Gepubliceerd" },
  { value: "GEARCHIVEERD", label: "Gearchiveerd" },
] as const

export const ARTIKEL_TYPES = [
  { value: "ARTIKEL", label: "Artikel" },
  { value: "GEMEENTE_NIEUWS", label: "Gemeentenieuws" },
  { value: "TIP", label: "Tip" },
] as const

export const ARTIKEL_CATEGORIEEN = [
  { value: "praktische-tips", label: "Praktische tips" },
  { value: "zelfzorg", label: "Zelfzorg" },
  { value: "rechten", label: "Rechten" },
  { value: "financieel", label: "Financieel" },
  { value: "hulpmiddelen-producten", label: "Hulpmiddelen & producten" },
  { value: "gemeentenieuws", label: "Gemeentenieuws" },
] as const

export const ARTIKEL_SUB_HOOFDSTUKKEN: Record<string, { value: string; label: string }[]> = {
  "praktische-tips": [
    { value: "", label: "Geen sub-hoofdstuk" },
    { value: "dagelijks-organiseren", label: "Dagelijks organiseren" },
    { value: "samen-organiseren", label: "Samen organiseren met familie/netwerk" },
    { value: "veiligheid-zware-taken", label: "Veiligheid bij zware taken" },
  ],
  "zelfzorg": [
    { value: "", label: "Geen sub-hoofdstuk" },
    { value: "overbelasting-herkennen", label: "Overbelasting herkennen" },
    { value: "pauze-en-respijt", label: "Pauze en respijt organiseren" },
    { value: "emotionele-steun", label: "Emotionele steun en praten" },
  ],
  "rechten": [
    { value: "", label: "Geen sub-hoofdstuk" },
    { value: "routekaart-wmo-zvw-wlz", label: "Routekaart Wmo/Zvw/Wlz" },
    { value: "gemeente-wmo-aanvragen", label: "Gemeente (Wmo) aanvragen" },
    { value: "clientondersteuning", label: "Gratis clientondersteuning" },
  ],
  "financieel": [
    { value: "", label: "Geen sub-hoofdstuk" },
    { value: "eigen-bijdrage-kosten", label: "Eigen bijdrage en kosten" },
    { value: "mantelzorgwaardering", label: "Mantelzorgwaardering" },
    { value: "pgb-aanvragen-beheer", label: "Pgb: aanvragen en beheer" },
    { value: "vergoedingen-hulpmiddelen", label: "Vergoedingen hulpmiddelen" },
  ],
  "hulpmiddelen-producten": [
    { value: "", label: "Geen sub-hoofdstuk" },
    { value: "hulpmiddelen-overzicht", label: "Hulpmiddelen overzicht" },
    { value: "vergoedingsroutes", label: "Vergoedingsroutes" },
  ],
}

export const BRON_LABELS = [
  { value: "", label: "Geen bronlabel" },
  { value: "Landelijk", label: "Landelijk" },
  { value: "Gemeente (Wmo)", label: "Gemeente (Wmo)" },
  { value: "Zorgverzekeraar (Zvw)", label: "Zorgverzekeraar (Zvw)" },
  { value: "Wlz", label: "Wlz" },
  { value: "Overig", label: "Overig" },
] as const

// ============================================
// ALARM TYPES
// ============================================

export const ALARM_TYPES: Record<string, string> = {
  HOGE_BELASTING: "Hoge belasting",
  KRITIEKE_COMBINATIE: "Kritieke combinatie",
  VEEL_ZORGUREN: "Veel zorguren",
  EMOTIONELE_NOOD: "Emotionele nood",
  SOCIAAL_ISOLEMENT: "Sociaal isolement",
  FYSIEKE_KLACHTEN: "Fysieke klachten",
}

// ============================================
// MANTELBUDDY STATUSSEN
// ============================================

export const BUDDY_STATUSSEN = [
  { value: "AANGEMELD", label: "Aangemeld", kleur: "bg-blue-100 text-blue-700" },
  { value: "IN_BEHANDELING", label: "In behandeling", kleur: "bg-amber-100 text-amber-700" },
  { value: "VOG_AANGEVRAAGD", label: "VOG aangevraagd", kleur: "bg-purple-100 text-purple-700" },
  { value: "GOEDGEKEURD", label: "Goedgekeurd", kleur: "bg-green-100 text-green-700" },
  { value: "INACTIEF", label: "Inactief", kleur: "bg-gray-100 text-gray-700" },
  { value: "AFGEWEZEN", label: "Afgewezen", kleur: "bg-red-100 text-red-700" },
] as const

export const HULPVORM_LABELS: Record<string, string> = {
  gesprek: "Gesprek",
  boodschappen: "Boodschappen",
  vervoer: "Vervoer",
  klusjes: "Klusjes",
  oppas: "Oppas",
  administratie: "Administratie",
}

// ============================================
// FORMULIER OPTIES GROEPEN (beheer)
// ============================================

export const FORMULIER_OPTIES_TABS = [
  { label: "Relatie", value: "RELATIE" },
  { label: "Uren/week", value: "UREN_PER_WEEK" },
  { label: "Zorgduur", value: "ZORGDUUR" },
  { label: "Uren balanstest", value: "UREN_BALANSTEST" },
  { label: "Buddy hulpvorm", value: "BUDDY_HULPVORM" },
  { label: "Buddy beschikbaarheid", value: "BUDDY_BESCHIKBAARHEID" },
  { label: "Check-in hulp", value: "CHECKIN_HULP" },
] as const

// ============================================
// CHECK-IN FREQUENTIES
// ============================================

export const CHECKIN_FREQUENTIES: Record<BelastingNiveau, { label: string; dagen: number }> = {
  LAAG: { label: "maandelijks", dagen: 30 },
  GEMIDDELD: { label: "2x per maand", dagen: 14 },
  HOOG: { label: "wekelijks", dagen: 7 },
}

// ============================================
// AGENDA EVENT TYPES
// ============================================

export const AGENDA_EVENT_TYPES = [
  { id: "CARE_TASK", label: "Zorg", description: "Voor de zorg", emoji: "🏥" },
  { id: "APPOINTMENT", label: "Afspraak", description: "Arts of andere afspraak", emoji: "📅" },
  { id: "SELF_CARE", label: "Voor mij", description: "Tijd voor jezelf", emoji: "🧘" },
  { id: "SOCIAL", label: "Samen", description: "Met vrienden of familie", emoji: "👫" },
  { id: "WORK", label: "Werk", description: "Werk of studie", emoji: "💼" },
  { id: "OTHER", label: "Anders", description: "Iets anders", emoji: "📝" },
] as const

// ============================================
// HERINNERING OPTIES
// ============================================

export const HERINNERING_OPTIES = [
  { value: "none", label: "Geen" },
  { value: "15", label: "15 min van tevoren" },
  { value: "30", label: "30 min van tevoren" },
  { value: "60", label: "1 uur van tevoren" },
  { value: "1440", label: "1 dag van tevoren" },
] as const
