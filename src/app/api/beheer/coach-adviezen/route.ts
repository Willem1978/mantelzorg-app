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

  // Zorgtaken
  "taak.t1.advies": { label: "Persoonlijke verzorging", advies: "Thuiszorg kan helpen met wassen, aankleden en andere persoonlijke verzorging." },
  "taak.t2.advies": { label: "Huishoudelijke taken", advies: "Huishoudelijke hulp kun je aanvragen via de WMO van je gemeente." },
  "taak.t3.advies": { label: "Maaltijden", advies: "Een apotheek kan medicijnen in weekdozen klaarzetten. Thuiszorg kan toezien op inname." },
  "taak.t4.advies": { label: "Boodschappen", advies: "De gemeente kan aangepast vervoer regelen (Regiotaxi, WMO-vervoer)." },
  "taak.t5.advies": { label: "Administratie", advies: "Vraag bij je gemeente naar vrijwillige hulp bij administratie en formulieren." },
  "taak.t6.advies": { label: "Vervoer", advies: "Dagbesteding of vrijwilligers kunnen voor gezelschap zorgen." },
  "taak.t7.advies": { label: "Sociaal contact", advies: "Vervangende mantelzorg of dagopvang kan toezicht overnemen zodat jij even rust hebt." },
  "taak.t8.advies": { label: "Klusjes", advies: "Thuiszorg of wijkverpleging kan medische handelingen overnemen." },
  "taak.t9.advies": { label: "Plannen & organiseren", advies: "Vrijwilligers of een klussenbus kunnen helpen met klussen in huis." },
  "taak.t10.advies": { label: "Huisdieren", advies: "Vraag bij je gemeente naar hulpmogelijkheden voor huisdierenverzorging." },
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
