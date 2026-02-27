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

/** Mapping van taaknamen naar taak-IDs voor CoachAdvies lookup */
export const TAAK_ID_MAP: Record<string, string> = {
  "Persoonlijke verzorging": "t1",
  "Huishoudelijke taken": "t2",
  "Bereiden en/of nuttigen van maaltijden": "t3",
  "Boodschappen": "t4",
  "Administratie en aanvragen": "t5",
  "Vervoer": "t6",
  "Sociaal contact en activiteiten": "t7",
  "Klusjes in en om het huis": "t8",
  "Plannen en organiseren": "t9",
  "Huisdieren": "t10",
}
