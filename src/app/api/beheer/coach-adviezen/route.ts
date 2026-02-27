import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

// Standaard adviezen als er nog niets in de database staat
const STANDAARD_ADVIEZEN: Record<string, { label: string; advies: string }> = {
  // Totaalscore
  "totaal.LAAG": { label: "Totaalscore – Groen", advies: "Goed bezig! Je hebt een goede balans. Blijf goed voor jezelf zorgen." },
  "totaal.GEMIDDELD": { label: "Totaalscore – Oranje", advies: "Je balans staat onder druk. Zo doorgaan is niet houdbaar. Kijk welke taken je kunt overdragen." },
  "totaal.HOOG": { label: "Totaalscore – Rood", advies: "Je bent overbelast. Dit is niet vol te houden. Je hebt nu hulp nodig. Neem contact op met je gemeente." },

  // Deelgebied: Energie
  "energie.LAAG": { label: "Energie – Groen", advies: "Je energie is goed. Blijf goed slapen en bewegen." },
  "energie.GEMIDDELD": { label: "Energie – Oranje", advies: "Let op je energie. Probeer vaste rusttijden in te bouwen." },
  "energie.HOOG": { label: "Energie – Rood", advies: "Je energie is laag. Prioriteer slaap en vraag hulp bij zware taken." },

  // Deelgebied: Gevoel
  "gevoel.LAAG": { label: "Gevoel – Groen", advies: "Emotioneel gaat het goed. Blijf praten over hoe je je voelt." },
  "gevoel.GEMIDDELD": { label: "Gevoel – Oranje", advies: "Je gevoel vraagt aandacht. Praat met iemand die je vertrouwt." },
  "gevoel.HOOG": { label: "Gevoel – Rood", advies: "Je hebt het emotioneel zwaar. Overweeg professionele steun of de Mantelzorglijn." },

  // Deelgebied: Tijd
  "tijd.LAAG": { label: "Tijd – Groen", advies: "Je hebt nog tijd voor jezelf. Dat is belangrijk, houd dat vast." },
  "tijd.GEMIDDELD": { label: "Tijd – Oranje", advies: "Je tijd staat onder druk. Kijk of je taken kunt delen of loslaten." },
  "tijd.HOOG": { label: "Tijd – Rood", advies: "De zorg kost veel van je tijd. Zoek vervangende zorg zodat je lucht krijgt." },

  // Zorgtaken — per niveau (LAAG/GEMIDDELD/HOOG), net als deelgebieden
  // Persoonlijke verzorging
  "taak.t1.LAAG": { label: "Persoonlijke verzorging – Groen", advies: "De verzorging gaat goed. Blijf alert op veranderingen in de zorgbehoefte." },
  "taak.t1.GEMIDDELD": { label: "Persoonlijke verzorging – Oranje", advies: "Thuiszorg kan helpen met wassen en aankleden. Vraag via de Wmo van je gemeente." },
  "taak.t1.HOOG": { label: "Persoonlijke verzorging – Rood", advies: "De persoonlijke verzorging is zwaar. Schakel thuiszorg in via de Wmo. Je hoeft dit niet alleen te doen." },

  // Huishoudelijke taken
  "taak.t2.LAAG": { label: "Huishoudelijke taken – Groen", advies: "Het huishouden loopt goed. Probeer het zo te houden." },
  "taak.t2.GEMIDDELD": { label: "Huishoudelijke taken – Oranje", advies: "Huishoudelijke hulp kun je aanvragen via de Wmo van je gemeente." },
  "taak.t2.HOOG": { label: "Huishoudelijke taken – Rood", advies: "Het huishouden kost te veel energie. Vraag huishoudelijke hulp aan via de Wmo. Dit is er juist voor." },

  // Maaltijden
  "taak.t3.LAAG": { label: "Maaltijden – Groen", advies: "Maaltijden gaan goed. Blijf letten op goede voeding voor jullie beiden." },
  "taak.t3.GEMIDDELD": { label: "Maaltijden – Oranje", advies: "Maaltijdservice kan kant-en-klare maaltijden bezorgen. Dat scheelt tijd en energie." },
  "taak.t3.HOOG": { label: "Maaltijden – Rood", advies: "Maaltijden verzorgen is zwaar. Schakel maaltijdservice in of vraag thuiszorg om hulp bij eten en drinken." },

  // Boodschappen
  "taak.t4.LAAG": { label: "Boodschappen – Groen", advies: "Boodschappen doen lukt goed. Denk aan online bestellen als het drukker wordt." },
  "taak.t4.GEMIDDELD": { label: "Boodschappen – Oranje", advies: "Laat boodschappen bezorgen of vraag hulp van vrijwilligers via de gemeente." },
  "taak.t4.HOOG": { label: "Boodschappen – Rood", advies: "Boodschappen kosten te veel tijd. Schakel boodschappenhulp in via vrijwilligers of de Wmo." },

  // Administratie
  "taak.t5.LAAG": { label: "Administratie – Groen", advies: "De administratie is onder controle. Denk aan een ordner-systeem voor overzicht." },
  "taak.t5.GEMIDDELD": { label: "Administratie – Oranje", advies: "Vraag bij je gemeente naar vrijwillige hulp bij administratie en formulieren." },
  "taak.t5.HOOG": { label: "Administratie – Rood", advies: "De administratie loopt over. Schakel een vrijwilliger of bewindvoerder in. De gemeente kan helpen." },

  // Vervoer
  "taak.t6.LAAG": { label: "Vervoer – Groen", advies: "Vervoer gaat goed. Houd rekening met toekomstige veranderingen in mobiliteit." },
  "taak.t6.GEMIDDELD": { label: "Vervoer – Oranje", advies: "De gemeente kan aangepast vervoer regelen (Regiotaxi, Wmo-vervoer)." },
  "taak.t6.HOOG": { label: "Vervoer – Rood", advies: "Vervoer kost veel tijd. Vraag Wmo-vervoer aan of schakel vrijwilligers in voor ritten." },

  // Sociaal contact
  "taak.t7.LAAG": { label: "Sociaal contact – Groen", advies: "Sociaal contact is goed geregeld. Blijf activiteiten ondernemen samen." },
  "taak.t7.GEMIDDELD": { label: "Sociaal contact – Oranje", advies: "Dagbesteding of vrijwilligers kunnen voor gezelschap en activiteiten zorgen." },
  "taak.t7.HOOG": { label: "Sociaal contact – Rood", advies: "Sociaal contact is zwaar om te organiseren. Dagopvang of dagbesteding kan overnemen zodat jij lucht krijgt." },

  // Klusjes
  "taak.t8.LAAG": { label: "Klusjes – Groen", advies: "Klusjes in huis lukken goed. Vraag hulp als het zwaarder wordt." },
  "taak.t8.GEMIDDELD": { label: "Klusjes – Oranje", advies: "Vrijwilligers of een klussenbus kunnen helpen met klussen in en om het huis." },
  "taak.t8.HOOG": { label: "Klusjes – Rood", advies: "Klusjes kosten te veel energie. Schakel de klussenbus of woningaanpassingen in via de Wmo." },

  // Plannen & organiseren
  "taak.t9.LAAG": { label: "Plannen & organiseren – Groen", advies: "Planning gaat goed. Een vast weekritme helpt om overzicht te houden." },
  "taak.t9.GEMIDDELD": { label: "Plannen & organiseren – Oranje", advies: "Een casemanager of mantelzorgconsulent kan helpen met het organiseren van de zorg." },
  "taak.t9.HOOG": { label: "Plannen & organiseren – Rood", advies: "De organisatie van de zorg is overweldigend. Vraag een casemanager aan die de regie kan overnemen." },

  // Huisdieren
  "taak.t10.LAAG": { label: "Huisdieren – Groen", advies: "Huisdierenverzorging gaat goed. Denk aan een noodplan voor als je er even niet bent." },
  "taak.t10.GEMIDDELD": { label: "Huisdieren – Oranje", advies: "Vraag bij je gemeente of buren naar hulp bij het uitlaten of verzorgen van huisdieren." },
  "taak.t10.HOOG": { label: "Huisdieren – Rood", advies: "Huisdierenverzorging is te veel. Schakel een dierenoppas of vrijwilligers in." },
}

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const adviezen = await prisma.coachAdvies.findMany({
      orderBy: { sleutel: "asc" },
    })

    // Merge met standaard: als een sleutel niet in DB staat, toon standaard
    const result: Record<string, { id: string | null; sleutel: string; label: string; advies: string; isActief: boolean }> = {}

    for (const [sleutel, standaard] of Object.entries(STANDAARD_ADVIEZEN)) {
      result[sleutel] = {
        id: null,
        sleutel,
        label: standaard.label,
        advies: standaard.advies,
        isActief: true,
      }
    }

    for (const item of adviezen) {
      result[item.sleutel] = {
        id: item.id,
        sleutel: item.sleutel,
        label: item.label || STANDAARD_ADVIEZEN[item.sleutel]?.label || item.sleutel,
        advies: item.advies,
        isActief: item.isActief,
      }
    }

    return NextResponse.json({ adviezen: Object.values(result) })
  } catch (error) {
    console.error("Coach adviezen ophalen mislukt:", error)
    return NextResponse.json({ error: "Coach adviezen ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sleutel, advies, label } = body

    if (!sleutel || !advies) {
      return NextResponse.json({ error: "Sleutel en advies zijn verplicht" }, { status: 400 })
    }

    const result = await prisma.coachAdvies.upsert({
      where: { sleutel },
      update: { advies, label },
      create: { sleutel, advies, label, isActief: true },
    })

    await logAudit({
      userId: session.user.id,
      actie: "UPDATE",
      entiteit: "CoachAdvies",
      entiteitId: result.id,
      details: { sleutel, label },
    })

    return NextResponse.json({ item: result })
  } catch (error) {
    console.error("Coach advies opslaan mislukt:", error)
    return NextResponse.json({ error: "Coach advies opslaan mislukt" }, { status: 500 })
  }
}
