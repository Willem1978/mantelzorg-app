import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Kleuren
const PAARS = [124, 58, 237] as const    // #7C3AED - primary
const GROEN = [5, 150, 105] as const     // #059669
const ORANJE = [217, 119, 6] as const    // #D97706
const ROOD = [220, 38, 38] as const      // #DC2626
const GRIJS = [107, 114, 128] as const   // #6B7280
const DONKER = [31, 41, 55] as const     // #1F2937
const WIT = [255, 255, 255] as const
const LICHTGRIJS = [243, 244, 246] as const // #F3F4F6

interface Antwoord {
  vraagId: string
  vraagTekst: string
  antwoord: string
  score: number
}

interface TaakSelectie {
  taakId: string
  taakNaam: string
  isGeselecteerd: boolean
  urenPerWeek: number | null
  moeilijkheid: string | null
}

interface AlarmLog {
  type: string
  beschrijving: string
  urgentie: string
}

interface Hulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  gemeente: string | null
  isLandelijk: boolean
  soortHulp?: string | null
}

export interface PdfRapportData {
  test: {
    id: string
    voornaam: string
    totaleBelastingScore: number
    belastingNiveau: "LAAG" | "GEMIDDELD" | "HOOG"
    totaleZorguren: number
    gemeente: string | null
    completedAt: string
    antwoorden: Antwoord[]
    taakSelecties: TaakSelectie[]
    alarmLogs: AlarmLog[]
  }
  hulpbronnen: {
    perTaak: Record<string, Hulpbron[]>
    voorMantelzorger: Hulpbron[]
    mantelzorgerGemeente: string | null
    zorgvragerGemeente: string | null
  }
}

function getNiveauKleur(niveau: string): readonly [number, number, number] {
  if (niveau === "HOOG") return ROOD
  if (niveau === "GEMIDDELD") return ORANJE
  return GROEN
}

function getNiveauTekst(niveau: string): string {
  if (niveau === "HOOG") return "Hoge belasting"
  if (niveau === "GEMIDDELD") return "Gemiddelde belasting"
  return "Lage belasting"
}

function getMoeilijkheidTekst(m: string | null): string {
  if (!m) return "-"
  if (m === "ZEER_MOEILIJK" || m === "JA" || m === "ja") return "Zwaar"
  if (m === "MOEILIJK" || m === "SOMS" || m === "soms") return "Matig"
  if (m === "GEMIDDELD") return "Gemiddeld"
  return "Licht"
}

function getMoeilijkheidKleur(m: string | null): readonly [number, number, number] {
  if (!m) return GRIJS
  if (m === "ZEER_MOEILIJK" || m === "JA" || m === "ja" || m === "MOEILIJK") return ROOD
  if (m === "SOMS" || m === "soms" || m === "GEMIDDELD") return ORANJE
  return GROEN
}

function getAntwoordTekst(antwoord: string): string {
  if (antwoord === "ja") return "Ja"
  if (antwoord === "soms") return "Soms"
  if (antwoord === "nee") return "Nee"
  return antwoord
}

function getHulpTip(taakId: string): string {
  const tips: Record<string, string> = {
    t1: "Thuiszorg kan helpen met wassen, aankleden en andere persoonlijke verzorging.",
    t2: "Huishoudelijke hulp kun je aanvragen via de WMO van je gemeente.",
    t3: "Een apotheek kan medicijnen in weekdozen klaarzetten. Thuiszorg kan toezien op inname.",
    t4: "De gemeente kan aangepast vervoer regelen (Regiotaxi, WMO-vervoer).",
    t5: "Vraag bij je gemeente naar vrijwillige hulp bij administratie en formulieren.",
    t6: "Dagbesteding of vrijwilligers kunnen voor gezelschap zorgen.",
    t7: "Respijtzorg of dagopvang kan toezicht overnemen zodat jij even rust hebt.",
    t8: "Thuiszorg of wijkverpleging kan medische handelingen overnemen.",
    t9: "Vrijwilligers of een klussenbus kunnen helpen met klussen in huis.",
  }
  return tips[taakId] || "Vraag bij je gemeente naar hulpmogelijkheden."
}

function getAlarmTekst(type: string): string {
  const teksten: Record<string, string> = {
    HOGE_BELASTING: "Je belastingscore is hoog. Dit wijst op overbelasting.",
    KRITIEKE_COMBINATIE: "Er is een zorgwekkende combinatie van slaapproblemen, lichamelijke klachten en veranderde relatie.",
    EMOTIONELE_NOOD: "De zorg slokt al je energie op en kost net zoveel tijd als een baan.",
    SOCIAAL_ISOLEMENT: "Je mist activiteiten die je leuk vindt en ervaart verdriet over de verandering.",
    VEEL_ZORGUREN: "Je besteedt veel uren per week aan de zorg.",
    FYSIEKE_KLACHTEN: "Je ervaart lichamelijke klachten door het zorgen.",
  }
  return teksten[type] || type
}

// Hulpfunctie: voeg sectie-header toe
function addSectionHeader(doc: jsPDF, y: number, title: string, kleur: readonly [number, number, number] = PAARS): number {
  if (y > 260) {
    doc.addPage()
    y = 20
  }
  doc.setFillColor(kleur[0], kleur[1], kleur[2])
  doc.roundedRect(14, y, 182, 10, 2, 2, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(title, 20, y + 7)
  doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
  return y + 16
}

// Hulpfunctie: check pagina-einde
function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage()
    return 20
  }
  return y
}

export function generatePdfRapport(data: PdfRapportData): void {
  const { test, hulpbronnen } = data
  const doc = new jsPDF("p", "mm", "a4")
  const niveauKleur = getNiveauKleur(test.belastingNiveau)
  const datum = new Date(test.completedAt).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  // ==========================================
  // HEADER
  // ==========================================
  doc.setFillColor(PAARS[0], PAARS[1], PAARS[2])
  doc.rect(0, 0, 210, 45, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text("MantelBuddy", 20, 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(14)
  doc.text("Persoonlijk Adviesrapport", 20, 28)

  doc.setFontSize(10)
  doc.text(`${test.voornaam}  |  ${datum}${test.gemeente ? `  |  ${test.gemeente}` : ""}`, 20, 38)

  let y = 55

  // ==========================================
  // JOUW SCORE
  // ==========================================
  y = addSectionHeader(doc, y, "Jouw score")

  // Score cirkel
  doc.setFillColor(niveauKleur[0], niveauKleur[1], niveauKleur[2])
  doc.circle(35, y + 12, 12, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text(`${test.totaleBelastingScore}`, 35, y + 14, { align: "center" })
  doc.setFontSize(8)
  doc.text("/24", 35, y + 20, { align: "center" })

  // Niveau tekst
  doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text(getNiveauTekst(test.belastingNiveau), 55, y + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(GRIJS[0], GRIJS[1], GRIJS[2])
  doc.text(`${test.totaleZorguren} uur zorg per week`, 55, y + 16)

  // Thermometer balk
  y += 30
  const balkBreedte = 160
  const scorePercentage = (test.totaleBelastingScore / 24) * balkBreedte

  // Achtergrond balk
  doc.setFillColor(LICHTGRIJS[0], LICHTGRIJS[1], LICHTGRIJS[2])
  doc.roundedRect(20, y, balkBreedte, 6, 3, 3, "F")

  // Score balk
  if (scorePercentage > 0) {
    doc.setFillColor(niveauKleur[0], niveauKleur[1], niveauKleur[2])
    doc.roundedRect(20, y, Math.max(scorePercentage, 6), 6, 3, 3, "F")
  }

  // Zone labels
  y += 12
  doc.setFontSize(7)
  doc.setTextColor(GROEN[0], GROEN[1], GROEN[2])
  doc.text("Laag (0-6)", 20, y)
  doc.setTextColor(ORANJE[0], ORANJE[1], ORANJE[2])
  doc.text("Gemiddeld (7-12)", 80, y)
  doc.setTextColor(ROOD[0], ROOD[1], ROOD[2])
  doc.text("Hoog (13-24)", 145, y)

  y += 10

  // ==========================================
  // BELANGRIJKE SIGNALEN (als er alarmen zijn)
  // ==========================================
  if (test.alarmLogs.length > 0) {
    y = addSectionHeader(doc, y, "Belangrijke signalen", ROOD)

    for (const alarm of test.alarmLogs) {
      y = checkPageBreak(doc, y, 14)
      doc.setFillColor(254, 242, 242) // licht rood
      doc.roundedRect(16, y - 2, 178, 12, 2, 2, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(ROOD[0], ROOD[1], ROOD[2])
      doc.text("!", 22, y + 5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
      doc.text(getAlarmTekst(alarm.type), 30, y + 5)
      y += 14
    }
    y += 4
  }

  // ==========================================
  // JOUW ANTWOORDEN
  // ==========================================
  y = checkPageBreak(doc, y, 30)
  y = addSectionHeader(doc, y, "Jouw antwoorden")

  const antwoordData = test.antwoorden.map((a, i) => [
    `${i + 1}`,
    a.vraagTekst,
    getAntwoordTekst(a.antwoord),
  ])

  autoTable(doc, {
    startY: y,
    head: [["#", "Vraag", "Antwoord"]],
    body: antwoordData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [DONKER[0], DONKER[1], DONKER[2]],
      lineColor: [229, 231, 235],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [PAARS[0], PAARS[1], PAARS[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 130 },
      2: { cellWidth: 30, halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 2) {
        const val = hookData.cell.raw as string
        if (val === "Ja") {
          hookData.cell.styles.textColor = [ROOD[0], ROOD[1], ROOD[2]]
        } else if (val === "Soms") {
          hookData.cell.styles.textColor = [ORANJE[0], ORANJE[1], ORANJE[2]]
        } else {
          hookData.cell.styles.textColor = [GROEN[0], GROEN[1], GROEN[2]]
        }
      }
    },
    margin: { left: 16, right: 16 },
  })

  y = (doc as any).lastAutoTable.finalY + 10

  // ==========================================
  // JOUW ZORGTAKEN
  // ==========================================
  const geselecteerdeTaken = test.taakSelecties.filter(t => t.isGeselecteerd)
  if (geselecteerdeTaken.length > 0) {
    y = checkPageBreak(doc, y, 30)
    y = addSectionHeader(doc, y, "Jouw zorgtaken")

    const taakData = geselecteerdeTaken.map(t => [
      t.taakNaam,
      t.urenPerWeek ? `${t.urenPerWeek} uur` : "-",
      getMoeilijkheidTekst(t.moeilijkheid),
    ])

    autoTable(doc, {
      startY: y,
      head: [["Taak", "Uren/week", "Zwaarte"]],
      body: taakData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [DONKER[0], DONKER[1], DONKER[2]],
        lineColor: [229, 231, 235],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [PAARS[0], PAARS[1], PAARS[2]],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 35, halign: "center" },
        2: { cellWidth: 45, halign: "center", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 2) {
          const val = hookData.cell.raw as string
          if (val === "Zwaar") {
            hookData.cell.styles.textColor = [ROOD[0], ROOD[1], ROOD[2]]
          } else if (val === "Matig" || val === "Gemiddeld") {
            hookData.cell.styles.textColor = [ORANJE[0], ORANJE[1], ORANJE[2]]
          } else {
            hookData.cell.styles.textColor = [GROEN[0], GROEN[1], GROEN[2]]
          }
        }
      },
      margin: { left: 16, right: 16 },
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ==========================================
  // ADVIES VOOR JOU (MANTELZORGER)
  // ==========================================
  y = checkPageBreak(doc, y, 40)
  y = addSectionHeader(doc, y, "Advies voor jou als mantelzorger", PAARS)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])

  // Persoonlijk advies per niveau
  if (test.belastingNiveau === "HOOG") {
    y = checkPageBreak(doc, y, 30)
    doc.setFillColor(254, 242, 242)
    doc.roundedRect(16, y - 2, 178, 24, 3, 3, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(ROOD[0], ROOD[1], ROOD[2])
    doc.text("Je bent overbelast", 22, y + 5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
    doc.text("Het is belangrijk dat je snel hulp zoekt. Je doet te veel en dat is niet vol", 22, y + 12)
    doc.text("te houden. Neem vandaag nog stappen.", 22, y + 18)
    y += 30

    // Concrete acties HOOG
    const acties = [
      "Neem contact op met je huisarts en bespreek hoe het gaat",
      "Bel je gemeente voor WMO-ondersteuning of mantelzorgsteunpunt",
      "Vraag respijtzorg aan zodat jij even rust kunt nemen",
      "Praat erover met iemand die je vertrouwt",
    ]
    for (const actie of acties) {
      y = checkPageBreak(doc, y, 8)
      doc.setFillColor(PAARS[0], PAARS[1], PAARS[2])
      doc.circle(21, y + 1.5, 1.5, "F")
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
      doc.text(actie, 26, y + 3)
      y += 8
    }
  } else if (test.belastingNiveau === "GEMIDDELD") {
    y = checkPageBreak(doc, y, 24)
    doc.setFillColor(255, 251, 235)
    doc.roundedRect(16, y - 2, 178, 20, 3, 3, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(ORANJE[0], ORANJE[1], ORANJE[2])
    doc.text("Je balans staat onder druk", 22, y + 5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
    doc.text("Met de juiste hulp kun je het beter volhouden. Zoek hulp bij de taken die zwaar zijn.", 22, y + 13)
    y += 26

    const acties = [
      "Zoek hulp bij de taken die het zwaarst zijn",
      "Plan vaste rustmomenten in je week",
      "Praat met je huisarts als je merkt dat het te veel wordt",
      "Bekijk welke hulp er in je gemeente beschikbaar is",
    ]
    for (const actie of acties) {
      y = checkPageBreak(doc, y, 8)
      doc.setFillColor(PAARS[0], PAARS[1], PAARS[2])
      doc.circle(21, y + 1.5, 1.5, "F")
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
      doc.text(actie, 26, y + 3)
      y += 8
    }
  } else {
    y = checkPageBreak(doc, y, 24)
    doc.setFillColor(236, 253, 245)
    doc.roundedRect(16, y - 2, 178, 20, 3, 3, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(GROEN[0], GROEN[1], GROEN[2])
    doc.text("Goed bezig!", 22, y + 5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
    doc.text("Je hebt een goede balans. Blijf goed voor jezelf zorgen.", 22, y + 13)
    y += 26

    const tips = [
      "Plan elke dag iets leuks voor jezelf",
      "Doe deze test regelmatig om je balans te checken",
      "Vraag hulp voordat je het echt nodig hebt",
    ]
    for (const tip of tips) {
      y = checkPageBreak(doc, y, 8)
      doc.setFillColor(GROEN[0], GROEN[1], GROEN[2])
      doc.circle(21, y + 1.5, 1.5, "F")
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
      doc.text(tip, 26, y + 3)
      y += 8
    }
  }

  // Hulpbronnen voor mantelzorger
  if (hulpbronnen.voorMantelzorger.length > 0) {
    y += 4
    y = checkPageBreak(doc, y, 20)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(PAARS[0], PAARS[1], PAARS[2])
    const hulpTitel = hulpbronnen.mantelzorgerGemeente
      ? `Hulp voor jou in ${hulpbronnen.mantelzorgerGemeente}`
      : "Hulp voor jou"
    doc.text(hulpTitel, 20, y)
    y += 6

    for (const org of hulpbronnen.voorMantelzorger.slice(0, 8)) {
      y = checkPageBreak(doc, y, 14)
      doc.setFillColor(LICHTGRIJS[0], LICHTGRIJS[1], LICHTGRIJS[2])
      doc.roundedRect(16, y - 2, 178, 12, 2, 2, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
      doc.text(org.naam, 20, y + 4)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(GRIJS[0], GRIJS[1], GRIJS[2])
      const contactInfo = [org.telefoon, org.website].filter(Boolean).join(" | ")
      if (contactInfo) {
        doc.text(contactInfo, 20, y + 9)
      }
      y += 14
    }
  }

  y += 6

  // ==========================================
  // HULP VOOR JE NAASTE
  // ==========================================
  const taakEntries = Object.entries(hulpbronnen.perTaak)
  if (taakEntries.length > 0 || geselecteerdeTaken.some(t =>
    t.moeilijkheid === "ZEER_MOEILIJK" || t.moeilijkheid === "MOEILIJK" ||
    t.moeilijkheid === "JA" || t.moeilijkheid === "ja" ||
    t.moeilijkheid === "SOMS" || t.moeilijkheid === "soms"
  )) {
    y = checkPageBreak(doc, y, 30)
    y = addSectionHeader(doc, y, "Hulp voor je naaste", [139, 92, 246]) // lighter purple

    const zwareTakenLijst = geselecteerdeTaken.filter(t =>
      t.moeilijkheid === "ZEER_MOEILIJK" || t.moeilijkheid === "MOEILIJK" ||
      t.moeilijkheid === "JA" || t.moeilijkheid === "ja" ||
      t.moeilijkheid === "SOMS" || t.moeilijkheid === "soms" ||
      t.moeilijkheid === "GEMIDDELD"
    )

    for (const taak of zwareTakenLijst) {
      y = checkPageBreak(doc, y, 20)

      // Taak header
      const taakKleur = getMoeilijkheidKleur(taak.moeilijkheid)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(taakKleur[0], taakKleur[1], taakKleur[2])
      doc.text(taak.taakNaam, 20, y)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(GRIJS[0], GRIJS[1], GRIJS[2])
      doc.text(`(${getMoeilijkheidTekst(taak.moeilijkheid)})`, 20 + doc.getTextWidth(taak.taakNaam) + 3, y)
      y += 5

      // Hulptip
      doc.setFont("helvetica", "italic")
      doc.setFontSize(8)
      doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
      const tip = getHulpTip(taak.taakId)
      const splitTip = doc.splitTextToSize(tip, 170)
      doc.text(splitTip, 20, y)
      y += splitTip.length * 4 + 2

      // Organisaties voor deze taak
      const orgs = hulpbronnen.perTaak[taak.taakNaam] || []
      if (orgs.length > 0) {
        for (const org of orgs.slice(0, 4)) {
          y = checkPageBreak(doc, y, 10)
          doc.setFillColor(LICHTGRIJS[0], LICHTGRIJS[1], LICHTGRIJS[2])
          doc.roundedRect(22, y - 1, 170, 9, 1, 1, "F")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(7)
          doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
          doc.text(org.naam, 25, y + 3.5)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(GRIJS[0], GRIJS[1], GRIJS[2])
          const info = [org.telefoon, org.website].filter(Boolean).join(" | ")
          if (info) {
            doc.text(info, 25, y + 7)
          }
          y += 11
        }
      }
      y += 4
    }
  }

  // ==========================================
  // BELANGRIJKE NUMMERS
  // ==========================================
  y = checkPageBreak(doc, y, 40)
  y = addSectionHeader(doc, y, "Belangrijke nummers")

  const nummers = [
    { naam: "Je huisarts", beschrijving: "Bespreek hoe het met je gaat" },
    { naam: "WMO loket gemeente", beschrijving: hulpbronnen.mantelzorgerGemeente ? `Gemeente ${hulpbronnen.mantelzorgerGemeente}` : "Vraag hulp aan bij je gemeente" },
    { naam: "Mantelzorglijn", beschrijving: "0900-2020 496 (lokaal tarief)" },
  ]

  for (const nr of nummers) {
    y = checkPageBreak(doc, y, 12)
    doc.setFillColor(LICHTGRIJS[0], LICHTGRIJS[1], LICHTGRIJS[2])
    doc.roundedRect(16, y - 2, 178, 11, 2, 2, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(DONKER[0], DONKER[1], DONKER[2])
    doc.text(nr.naam, 20, y + 4)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(GRIJS[0], GRIJS[1], GRIJS[2])
    doc.text(nr.beschrijving, 80, y + 4)
    y += 13
  }

  // ==========================================
  // FOOTER
  // ==========================================
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(LICHTGRIJS[0], LICHTGRIJS[1], LICHTGRIJS[2])
    doc.rect(0, 287, 210, 10, "F")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(GRIJS[0], GRIJS[1], GRIJS[2])
    doc.text(`MantelBuddy Adviesrapport  |  ${datum}  |  Pagina ${i} van ${pageCount}`, 105, 293, { align: "center" })
  }

  // Download PDF
  const bestandsnaam = `MantelBuddy-Adviesrapport-${test.voornaam}-${new Date(test.completedAt).toISOString().slice(0, 10)}.pdf`
  doc.save(bestandsnaam)
}
