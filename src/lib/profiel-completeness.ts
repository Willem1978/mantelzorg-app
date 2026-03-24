/**
 * Profiel-completeness berekening.
 * Geeft percentage en ontbrekende secties terug.
 */

interface ProfielVelden {
  naam?: string | null
  straat?: string | null
  telefoon?: string | null
  naasteNaam?: string | null
  naasteRelatie?: string | null
  naasteStraat?: string | null
  woonsituatie?: string | null
  werkstatus?: string | null
  zorgthemas?: string[]
  situatieTags?: string[]
  interesseCategorieen?: string[]
}

interface CompletenessResult {
  percentage: number
  ontbreekt: string[]
  secties: {
    naam: string
    compleet: boolean
    label: string
  }[]
}

export function berekenProfielCompleteness(profiel: ProfielVelden): CompletenessResult {
  const secties = [
    {
      naam: "naam",
      compleet: !!(profiel.naam && profiel.naam.trim()),
      label: "Je naam",
    },
    {
      naam: "adres",
      compleet: !!(profiel.straat && profiel.straat.trim()),
      label: "Je adres",
    },
    {
      naam: "naaste",
      compleet: !!(profiel.naasteNaam && profiel.naasteNaam.trim()),
      label: "Naam van je naaste",
    },
    {
      naam: "relatie",
      compleet: !!(profiel.naasteRelatie && profiel.naasteRelatie.trim()),
      label: "Relatie met je naaste",
    },
    {
      naam: "woonsituatie",
      compleet: !!(profiel.woonsituatie && profiel.woonsituatie.trim()),
      label: "Woonsituatie",
    },
    {
      naam: "werkstatus",
      compleet: !!(profiel.werkstatus && profiel.werkstatus.trim()),
      label: "Werk en studie",
    },
    {
      naam: "zorgthema",
      compleet: !!(profiel.zorgthemas && profiel.zorgthemas.length > 0),
      label: "Zorgsituatie van je naaste",
    },
    {
      naam: "interesses",
      compleet: !!(profiel.interesseCategorieen && profiel.interesseCategorieen.length > 0),
      label: "Leesinteresses",
    },
  ]

  const compleet = secties.filter((s) => s.compleet).length
  const percentage = Math.round((compleet / secties.length) * 100)
  const ontbreekt = secties.filter((s) => !s.compleet).map((s) => s.label)

  return { percentage, ontbreekt, secties }
}
