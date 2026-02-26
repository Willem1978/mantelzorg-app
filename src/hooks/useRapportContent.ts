"use client"

import { useSiteSettings } from "@/lib/site-settings"
import { rapportContent } from "@/config/content"

/**
 * Hook die rapport content retourneert met SiteSettings overrides.
 * Alle teksten zijn overschrijfbaar via de beheeromgeving (SiteSettings).
 * Als er geen override is, wordt de default uit config/content/rapport.ts gebruikt.
 *
 * SiteSettings keys: rapport.<pad> bijv. "rapport.niveaus.HOOG.title"
 */
export function useRapportContent() {
  const settings = useSiteSettings()

  // Helper: haal setting op met fallback
  const s = (key: string, fallback: string) =>
    settings[`rapport.${key}`] || fallback

  // Helper: template substitutie (vervangt {{var}} met waarde)
  const t = (key: string, fallback: string, vars: Record<string, string | number>) => {
    let text = s(key, fallback)
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(`{{${name}}}`, String(value))
    }
    return text
  }

  return {
    header: {
      greeting: (voornaam: string) =>
        t("header.greeting", "Hoi {{voornaam}}", { voornaam }),
      resultatenVan: (datum: string) =>
        t("header.resultatenVan", "Je resultaten van {{datum}}", { datum }),
    },

    laden: s("laden", rapportContent.laden),

    fouten: {
      geenResultaten: s("fouten.geenResultaten", rapportContent.fouten.geenResultaten),
      geenTest: s("fouten.geenTest", rapportContent.fouten.geenTest),
      nietIngelogd: s("fouten.nietIngelogd", rapportContent.fouten.nietIngelogd),
      algemeenFout: s("fouten.algemeenFout", rapportContent.fouten.algemeenFout),
      laadFout: s("fouten.laadFout", rapportContent.fouten.laadFout),
    },

    geenTest: {
      title: s("geenTest.title", rapportContent.geenTest.title),
      subtitle: s("geenTest.subtitle", rapportContent.geenTest.subtitle),
      button: s("geenTest.button", rapportContent.geenTest.button),
    },

    niveaus: {
      HOOG: {
        title: s("niveaus.HOOG.title", rapportContent.niveaus.HOOG.title),
        subtitle: s("niveaus.HOOG.subtitle", rapportContent.niveaus.HOOG.subtitle),
        acties: {
          title: s("niveaus.HOOG.acties.title", rapportContent.niveaus.HOOG.acties.title),
          huisarts: {
            title: s("niveaus.HOOG.acties.huisarts.title", rapportContent.niveaus.HOOG.acties.huisarts.title),
            beschrijving: s("niveaus.HOOG.acties.huisarts.beschrijving", rapportContent.niveaus.HOOG.acties.huisarts.beschrijving),
          },
          gemeente: {
            titleFn: (gemeente: string) =>
              t("niveaus.HOOG.acties.gemeente.title", "Mantelzorgondersteuner {{gemeente}}", { gemeente }),
            titleFallback: s("niveaus.HOOG.acties.gemeente.titleFallback", rapportContent.niveaus.HOOG.acties.gemeente.titleFallback),
            beschrijving: s("niveaus.HOOG.acties.gemeente.beschrijving", rapportContent.niveaus.HOOG.acties.gemeente.beschrijving),
          },
          mantelzorglijn: {
            title: s("niveaus.HOOG.acties.mantelzorglijn.title", rapportContent.niveaus.HOOG.acties.mantelzorglijn.title),
            beschrijving: s("niveaus.HOOG.acties.mantelzorglijn.beschrijving", rapportContent.niveaus.HOOG.acties.mantelzorglijn.beschrijving),
          },
        },
        takenTitle: s("niveaus.HOOG.takenTitle", rapportContent.niveaus.HOOG.takenTitle),
        takenSubtitleFn: (uren: number) =>
          t("niveaus.HOOG.takenSubtitle", "Je besteedt {{uren}} uur per week aan zorgtaken. Dat is te veel.", { uren }),
        takenHint: s("niveaus.HOOG.takenHint", rapportContent.niveaus.HOOG.takenHint),
      },

      GEMIDDELD: {
        title: s("niveaus.GEMIDDELD.title", rapportContent.niveaus.GEMIDDELD.title),
        subtitle: s("niveaus.GEMIDDELD.subtitle", rapportContent.niveaus.GEMIDDELD.subtitle),
        zorgtijdFn: (uren: number) => `${uren} uur per week`,
        zorgtijdSuffix: s("niveaus.GEMIDDELD.zorgtijdSuffix", rapportContent.niveaus.GEMIDDELD.zorgtijdSuffix),
        takenTitle: s("niveaus.GEMIDDELD.takenTitle", rapportContent.niveaus.GEMIDDELD.takenTitle),
        takenHint: s("niveaus.GEMIDDELD.takenHint", rapportContent.niveaus.GEMIDDELD.takenHint),
        vindHulp: s("niveaus.GEMIDDELD.vindHulp", rapportContent.niveaus.GEMIDDELD.vindHulp),
        steunpunt: {
          title: s("niveaus.GEMIDDELD.steunpunt.title", rapportContent.niveaus.GEMIDDELD.steunpunt.title),
          beschrijving: s("niveaus.GEMIDDELD.steunpunt.beschrijving", rapportContent.niveaus.GEMIDDELD.steunpunt.beschrijving),
        },
        wmoFn: (gemeente: string) =>
          t("niveaus.GEMIDDELD.wmoLabel", "WMO loket {{gemeente}}", { gemeente }),
        wmoBeschrijving: s("niveaus.GEMIDDELD.wmoBeschrijving", rapportContent.niveaus.GEMIDDELD.wmoBeschrijving),
      },

      LAAG: {
        title: s("niveaus.LAAG.title", rapportContent.niveaus.LAAG.title),
        subtitle: s("niveaus.LAAG.subtitle", rapportContent.niveaus.LAAG.subtitle),
        letOpTaakFn: (count: number) =>
          count === 1
            ? s("niveaus.LAAG.letOpTaakEnkelvoud", "Let op deze taak")
            : s("niveaus.LAAG.letOpTaakMeervoud", "Let op deze taken"),
        letOpSubtitleFn: (count: number) =>
          count === 1
            ? s("niveaus.LAAG.letOpSubtitleEnkelvoud", "Je ervaart deze taak als zwaar. Hier kun je hulp bij krijgen:")
            : s("niveaus.LAAG.letOpSubtitleMeervoud", "Je ervaart deze taken als zwaar. Hier kun je hulp bij krijgen:"),
        zorgtaken: s("niveaus.LAAG.zorgtaken", "Jouw zorgtaken"),
        balansTitle: s("niveaus.LAAG.balansTitle", "Houd je balans vast"),
        tips: [
          { emoji: "💚", tekst: s("niveaus.LAAG.tip1", rapportContent.niveaus.LAAG.tips[0].tekst) },
          { emoji: "🔄", tekst: s("niveaus.LAAG.tip2", rapportContent.niveaus.LAAG.tips[1].tekst) },
          { emoji: "🤝", tekst: s("niveaus.LAAG.tip3", rapportContent.niveaus.LAAG.tips[2].tekst) },
        ],
      },
    },

    opnieuw: s("opnieuw", rapportContent.opnieuw),

    // Hulp-tips per taak, overschrijfbaar via rapport.hulpTip.t1, rapport.hulpTip.t2, etc.
    hulpTips: Object.fromEntries(
      Object.entries(rapportContent.hulpTips).map(([key, defaultVal]) => [
        key,
        settings[`rapport.hulpTip.${key}`] || defaultVal,
      ])
    ) as Record<string, string>,
  }
}
