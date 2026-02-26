import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

/**
 * POST: Seed rapport- en advies-content defaults naar SiteSettings.
 * Dit maakt alle teksten bewerkbaar via de beheeromgeving.
 * Bestaande waarden worden NIET overschreven (alleen ontbrekende keys aangevuld).
 */
export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const contentDefaults: Array<{
      categorie: string
      sleutel: string
      waarde: string
      label: string
      type: string
      groep: string
    }> = [
      // ============================================
      // RAPPORT TEKSTEN
      // ============================================
      // Header
      { categorie: "rapport", sleutel: "rapport.header.greeting", waarde: "Hoi {{voornaam}}", label: "Begroeting", type: "text", groep: "Header" },
      { categorie: "rapport", sleutel: "rapport.header.resultatenVan", waarde: "Je resultaten van {{datum}}", label: "Resultaten datum", type: "text", groep: "Header" },
      // Fouten
      { categorie: "rapport", sleutel: "rapport.fouten.geenResultaten", waarde: "Geen resultaten", label: "Fout: geen resultaten", type: "text", groep: "Foutmeldingen" },
      { categorie: "rapport", sleutel: "rapport.fouten.geenTest", waarde: "Je hebt nog geen test gedaan.", label: "Fout: geen test", type: "text", groep: "Foutmeldingen" },
      { categorie: "rapport", sleutel: "rapport.fouten.nietIngelogd", waarde: "Log eerst in om je resultaten te bekijken.", label: "Fout: niet ingelogd", type: "text", groep: "Foutmeldingen" },
      // Geen test
      { categorie: "rapport", sleutel: "rapport.geenTest.title", waarde: "Doe eerst de balanstest.", label: "Geen test: titel", type: "text", groep: "Geen test" },
      { categorie: "rapport", sleutel: "rapport.geenTest.subtitle", waarde: "Dan zie je hier je resultaten en tips die bij je passen.", label: "Geen test: subtitel", type: "text", groep: "Geen test" },
      { categorie: "rapport", sleutel: "rapport.geenTest.button", waarde: "Start de Balanstest", label: "Geen test: knop", type: "text", groep: "Geen test" },
      // Niveau HOOG
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.title", waarde: "Je bent overbelast", label: "Hoog: titel", type: "text", groep: "Niveau HOOG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.subtitle", waarde: "Dit is niet vol te houden. Je hebt nu hulp nodig.", label: "Hoog: subtitel", type: "textarea", groep: "Niveau HOOG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.acties.title", waarde: "Dit moet je nu doen", label: "Hoog: acties titel", type: "text", groep: "Niveau HOOG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.acties.huisarts.title", waarde: "Bel je huisarts", label: "Hoog: huisarts titel", type: "text", groep: "Niveau HOOG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.acties.huisarts.beschrijving", waarde: "Maak een afspraak om je situatie te bespreken", label: "Hoog: huisarts beschrijving", type: "text", groep: "Niveau HOOG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.acties.mantelzorglijn.title", waarde: "Mantelzorglijn", label: "Hoog: mantelzorglijn titel", type: "text", groep: "Niveau HOOG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.acties.mantelzorglijn.beschrijving", waarde: "030 - 205 90 59 (ma-vr, gratis)", label: "Hoog: mantelzorglijn beschrijving", type: "text", groep: "Niveau HOOG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.takenTitle", waarde: "Deze taken moet je loslaten", label: "Hoog: taken titel", type: "text", groep: "Niveau HOOG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.takenSubtitle", waarde: "Je besteedt {{uren}} uur per week aan zorgtaken. Dat is te veel.", label: "Hoog: taken subtitel ({{uren}} = uren)", type: "textarea", groep: "Niveau HOOG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.HOOG.takenHint", waarde: "Klik op een taak om hulpbronnen te bekijken", label: "Hoog: taken hint", type: "text", groep: "Niveau HOOG" },
      // Niveau GEMIDDELD
      { categorie: "rapport", sleutel: "rapport.niveaus.GEMIDDELD.title", waarde: "Je balans staat onder druk", label: "Gemiddeld: titel", type: "text", groep: "Niveau GEMIDDELD" },
      { categorie: "rapport", sleutel: "rapport.niveaus.GEMIDDELD.subtitle", waarde: "Zo doorgaan is niet houdbaar. Kijk welke taken je kunt overdragen.", label: "Gemiddeld: subtitel", type: "textarea", groep: "Niveau GEMIDDELD" },
      { categorie: "rapport", sleutel: "rapport.niveaus.GEMIDDELD.takenTitle", waarde: "Hier kun je hulp bij krijgen", label: "Gemiddeld: taken titel", type: "text", groep: "Niveau GEMIDDELD" },
      { categorie: "rapport", sleutel: "rapport.niveaus.GEMIDDELD.takenHint", waarde: "Klik op een taak om hulpbronnen te bekijken →", label: "Gemiddeld: taken hint", type: "text", groep: "Niveau GEMIDDELD" },
      { categorie: "rapport", sleutel: "rapport.niveaus.GEMIDDELD.vindHulp", waarde: "Vind hulp", label: "Gemiddeld: vind hulp", type: "text", groep: "Niveau GEMIDDELD" },
      { categorie: "rapport", sleutel: "rapport.niveaus.GEMIDDELD.steunpunt.title", waarde: "Steunpunt Mantelzorg", label: "Gemiddeld: steunpunt titel", type: "text", groep: "Niveau GEMIDDELD" },
      { categorie: "rapport", sleutel: "rapport.niveaus.GEMIDDELD.steunpunt.beschrijving", waarde: "Gratis advies en ondersteuning", label: "Gemiddeld: steunpunt beschrijving", type: "text", groep: "Niveau GEMIDDELD" },
      { categorie: "rapport", sleutel: "rapport.niveaus.GEMIDDELD.wmoBeschrijving", waarde: "Vraag hulp aan bij de gemeente", label: "Gemiddeld: WMO beschrijving", type: "text", groep: "Niveau GEMIDDELD" },
      // Niveau LAAG
      { categorie: "rapport", sleutel: "rapport.niveaus.LAAG.title", waarde: "Goed bezig!", label: "Laag: titel", type: "text", groep: "Niveau LAAG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.LAAG.subtitle", waarde: "Je hebt een goede balans. Blijf goed voor jezelf zorgen.", label: "Laag: subtitel", type: "textarea", groep: "Niveau LAAG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.LAAG.balansTitle", waarde: "Houd je balans vast", label: "Laag: balans titel", type: "text", groep: "Niveau LAAG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.LAAG.tip1", waarde: "Plan elke dag iets leuks voor jezelf", label: "Laag: tip 1", type: "text", groep: "Niveau LAAG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.LAAG.tip2", waarde: "Doe deze test elke 3 maanden om je balans te checken", label: "Laag: tip 2", type: "text", groep: "Niveau LAAG" },
      { categorie: "rapport", sleutel: "rapport.niveaus.LAAG.tip3", waarde: "Vraag hulp voordat je het nodig hebt", label: "Laag: tip 3", type: "text", groep: "Niveau LAAG" },
      // Hulp-tips per taak
      { categorie: "rapport", sleutel: "rapport.hulpTip.t1", waarde: "Thuiszorg kan helpen met wassen, aankleden en andere persoonlijke verzorging.", label: "Hulptip: Persoonlijke verzorging", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.hulpTip.t2", waarde: "Huishoudelijke hulp kun je aanvragen via de WMO van je gemeente.", label: "Hulptip: Huishoudelijke taken", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.hulpTip.t3", waarde: "Een apotheek kan medicijnen in weekdozen klaarzetten. Thuiszorg kan toezien op inname.", label: "Hulptip: Maaltijden/Medicijnen", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.hulpTip.t4", waarde: "De gemeente kan aangepast vervoer regelen (Regiotaxi, WMO-vervoer).", label: "Hulptip: Boodschappen", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.hulpTip.t5", waarde: "Vraag bij je gemeente naar vrijwillige hulp bij administratie en formulieren.", label: "Hulptip: Administratie", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.hulpTip.t6", waarde: "Dagbesteding of vrijwilligers kunnen voor gezelschap zorgen.", label: "Hulptip: Vervoer", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.hulpTip.t7", waarde: "Vervangende mantelzorg of dagopvang kan toezicht overnemen zodat jij even rust hebt.", label: "Hulptip: Sociaal contact", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.hulpTip.t8", waarde: "Thuiszorg of wijkverpleging kan medische handelingen overnemen.", label: "Hulptip: Klusjes", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.hulpTip.t9", waarde: "Vrijwilligers of een klussenbus kunnen helpen met klussen in huis.", label: "Hulptip: Plannen", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.hulpTip.default", waarde: "Vraag bij je gemeente naar hulpmogelijkheden.", label: "Hulptip: standaard", type: "textarea", groep: "Hulp-tips" },
      { categorie: "rapport", sleutel: "rapport.opnieuw", waarde: "Doe de test opnieuw", label: "Knop: opnieuw", type: "text", groep: "Knoppen" },

      // ============================================
      // ADVIES TEMPLATES
      // ============================================
      { categorie: "advies", sleutel: "advies.hoog-hulp.titel", waarde: "Vraag hulp", label: "Advies HOOG: hulp titel", type: "text", groep: "Advies HOOG" },
      { categorie: "advies", sleutel: "advies.hoog-hulp.tekst", waarde: "Je hebt veel op je bordje. Je hoeft het niet alleen te doen. Bel de Mantelzorglijn (030 - 205 90 59) of vraag hulp bij je gemeente.", label: "Advies HOOG: hulp tekst", type: "textarea", groep: "Advies HOOG" },
      { categorie: "advies", sleutel: "advies.hoog-hulp.linkTekst", waarde: "Bel de Mantelzorglijn", label: "Advies HOOG: hulp link", type: "text", groep: "Advies HOOG" },
      { categorie: "advies", sleutel: "advies.hoog-respijt.titel", waarde: "Neem pauze", label: "Advies HOOG: respijt titel", type: "text", groep: "Advies HOOG" },
      { categorie: "advies", sleutel: "advies.hoog-respijt.tekst", waarde: "Respijtzorg kan je even ontlasten. Een dagopvang of tijdelijke vervanging geeft je rust. Vraag ernaar bij je gemeente.", label: "Advies HOOG: respijt tekst", type: "textarea", groep: "Advies HOOG" },
      { categorie: "advies", sleutel: "advies.gemiddeld-balans.titel", waarde: "Houd je balans in de gaten", label: "Advies GEMIDDELD: balans titel", type: "text", groep: "Advies GEMIDDELD" },
      { categorie: "advies", sleutel: "advies.gemiddeld-balans.tekst", waarde: "Je doet al veel. Probeer elke week iets voor jezelf te doen. Een wandeling, een kopje koffie met een vriend, of gewoon even rust.", label: "Advies GEMIDDELD: balans tekst", type: "textarea", groep: "Advies GEMIDDELD" },
      { categorie: "advies", sleutel: "advies.gemiddeld-taken.titel", waarde: "Verdeel zware taken", label: "Advies GEMIDDELD: taken titel", type: "text", groep: "Advies GEMIDDELD" },
      { categorie: "advies", sleutel: "advies.laag-goed.titel", waarde: "Goed bezig!", label: "Advies LAAG: titel", type: "text", groep: "Advies LAAG" },
      { categorie: "advies", sleutel: "advies.laag-goed.tekst", waarde: "Je balans is goed. Blijf goed voor jezelf zorgen. Houd bij hoe het gaat met de maandelijkse check-in.", label: "Advies LAAG: tekst", type: "textarea", groep: "Advies LAAG" },
      { categorie: "advies", sleutel: "advies.trend-slechter.titel", waarde: "Je score is gestegen", label: "Advies trend: slechter titel", type: "text", groep: "Advies Trend" },
      { categorie: "advies", sleutel: "advies.trend-slechter.tekst", waarde: "Je belasting is hoger dan vorige keer. Neem dit serieus. Kijk of je ergens hulp bij kunt krijgen.", label: "Advies trend: slechter tekst", type: "textarea", groep: "Advies Trend" },
      { categorie: "advies", sleutel: "advies.trend-beter.titel", waarde: "Het gaat de goede kant op", label: "Advies trend: beter titel", type: "text", groep: "Advies Trend" },
      { categorie: "advies", sleutel: "advies.trend-beter.tekst", waarde: "Je score is verbeterd. Wat je doet werkt. Ga zo door!", label: "Advies trend: beter tekst", type: "textarea", groep: "Advies Trend" },
      { categorie: "advies", sleutel: "advies.test-verouderd.titel", waarde: "Doe een nieuwe balanstest", label: "Advies: verouderde test titel", type: "text", groep: "Advies Overig" },
      { categorie: "advies", sleutel: "advies.test-verouderd.tekst", waarde: "Je laatste test is meer dan 3 maanden geleden. Doe een nieuwe test om te kijken hoe het nu met je gaat.", label: "Advies: verouderde test tekst", type: "textarea", groep: "Advies Overig" },
      { categorie: "advies", sleutel: "advies.checkin-reminder.titel", waarde: "Doe een check-in", label: "Advies: check-in titel", type: "text", groep: "Advies Overig" },
      { categorie: "advies", sleutel: "advies.checkin-reminder.tekst", waarde: "Hoe gaat het deze week? Een korte check-in helpt je om bij te houden hoe het gaat.", label: "Advies: check-in tekst", type: "textarea", groep: "Advies Overig" },
    ]

    let created = 0
    let skipped = 0

    for (const item of contentDefaults) {
      // Alleen aanmaken als de key nog niet bestaat
      const existing = await prisma.siteSettings.findUnique({
        where: { sleutel: item.sleutel },
      })

      if (!existing) {
        await prisma.siteSettings.create({
          data: {
            categorie: item.categorie,
            sleutel: item.sleutel,
            waarde: item.waarde,
            label: item.label,
            type: item.type,
            groep: item.groep,
            updatedBy: session.user.id,
          },
        })
        created++
      } else {
        skipped++
      }
    }

    await logAudit({
      userId: session.user.id!,
      actie: "SEED_CONTENT",
      entiteit: "SiteSettings",
      details: { created, skipped, total: contentDefaults.length },
    })

    return NextResponse.json({
      ok: true,
      created,
      skipped,
      total: contentDefaults.length,
      message: `${created} nieuwe content keys aangemaakt, ${skipped} al bestaand.`,
    })
  } catch (error) {
    console.error("Seed content mislukt:", error)
    return NextResponse.json({ error: "Seed content mislukt" }, { status: 500 })
  }
}
