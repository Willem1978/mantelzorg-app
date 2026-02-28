/**
 * Gedeelde types voor alle AI agents.
 */

export interface GemeenteContact {
  naam: string
  telefoon: string | null
  email: string | null
  website: string | null
  beschrijving: string | null
  gemeente: string
  adviesTekst: string | null
}

export interface HulpbronResult {
  naam: string
  telefoon: string | null
  website: string | null
  soortHulp: string | null
}

export interface UserContext {
  userId: string
  gemeente: string | null
}

/** Mapping van deelgebied-namen naar sleutels voor CoachAdvies lookup */
export const DEELGEBIED_SLEUTEL_MAP: Record<string, string> = {
  "Jouw energie": "energie",
  "Jouw gevoel": "gevoel",
  "Jouw tijd": "tijd",
}

/** Mapping van taaknamen naar taak-IDs — gesynchroniseerd met database seed */
export const TAAK_ID_MAP: Record<string, string> = {
  "Administratie en aanvragen": "t1",
  "Plannen en organiseren": "t2",
  "Boodschappen": "t3",
  "Sociaal contact en activiteiten": "t4",
  "Vervoer": "t5",
  "Persoonlijke verzorging": "t6",
  "Bereiden en/of nuttigen van maaltijden": "t7",
  "Huishoudelijke taken": "t8",
  "Klusjes in en om het huis": "t9",
  "Huisdieren": "t10",
}
