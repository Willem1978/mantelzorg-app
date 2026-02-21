import jsPDF from "jspdf"
import autoTable, { type CellHookData } from "jspdf-autotable"

// ==========================================
// KLEUREN
// ==========================================
const C = {
  primary:    [101, 52, 178] as const,  // #6534B2 warm paars
  primaryBg:  [243, 237, 252] as const, // licht paars
  groen:      [16, 137, 87]  as const,  // #108957
  groenBg:    [232, 248, 240] as const,
  oranje:     [194, 120, 3]  as const,  // #C27803
  oranjeBg:   [255, 247, 230] as const,
  rood:       [190, 30, 45]  as const,  // #BE1E2D
  roodBg:     [254, 237, 239] as const,
  donker:     [38, 38, 38]   as const,  // #262626
  tekst:      [64, 64, 64]   as const,  // #404040
  grijs:      [128, 128, 128] as const,
  lichtgrijs: [245, 245, 245] as const,
  wit:        [255, 255, 255] as const,
  rand:       [220, 220, 220] as const,
}

// ==========================================
// INTERFACES
// ==========================================
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

// ==========================================
// HELPERS
// ==========================================
function niveauKleur(n: string) {
  if (n === "HOOG") return C.rood
  if (n === "GEMIDDELD") return C.oranje
  return C.groen
}

function niveauBg(n: string) {
  if (n === "HOOG") return C.roodBg
  if (n === "GEMIDDELD") return C.oranjeBg
  return C.groenBg
}

function niveauLabel(n: string) {
  if (n === "HOOG") return "Hoge belasting"
  if (n === "GEMIDDELD") return "Gemiddelde belasting"
  return "Lage belasting"
}

function niveauEmoji(n: string) {
  if (n === "HOOG") return "Hoog"
  if (n === "GEMIDDELD") return "Gemiddeld"
  return "Laag"
}

function zwaarteTekst(m: string | null) {
  if (!m) return "Licht"
  if (m === "ZEER_MOEILIJK" || m === "JA" || m === "ja") return "Zwaar"
  if (m === "MOEILIJK" || m === "SOMS" || m === "soms") return "Matig"
  if (m === "GEMIDDELD") return "Gemiddeld"
  return "Licht"
}

function zwaarteKleur(m: string | null) {
  const t = zwaarteTekst(m)
  if (t === "Zwaar") return C.rood
  if (t === "Matig" || t === "Gemiddeld") return C.oranje
  return C.groen
}

function antwoordLabel(a: string) {
  if (a === "ja") return "Ja"
  if (a === "soms") return "Soms"
  if (a === "nee") return "Nee"
  return a
}

function hulpTip(taakId: string): string {
  const tips: Record<string, string> = {
    t1: "Thuiszorg kan helpen met wassen, aankleden en andere persoonlijke verzorging.",
    t2: "Huishoudelijke hulp kun je aanvragen via de WMO van je gemeente.",
    t3: "Een apotheek kan medicijnen klaarzetten. Thuiszorg kan toezien op inname.",
    t4: "De gemeente kan aangepast vervoer regelen (Regiotaxi, WMO-vervoer).",
    t5: "Vraag bij je gemeente naar vrijwillige hulp bij administratie.",
    t6: "Dagbesteding of vrijwilligers kunnen voor gezelschap zorgen.",
    t7: "Vervangende mantelzorg of dagopvang kan toezicht overnemen zodat jij rust hebt.",
    t8: "Thuiszorg of wijkverpleging kan medische handelingen overnemen.",
    t9: "Vrijwilligers of een klussenbus kunnen helpen met klussen.",
  }
  return tips[taakId] || "Vraag bij je gemeente naar hulpmogelijkheden."
}

// ==========================================
// PDF BOUW-BLOKKEN
// ==========================================
function pageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 272) { doc.addPage(); return 25 }
  return y
}

function drawLine(doc: jsPDF, y: number) {
  doc.setDrawColor(C.rand[0], C.rand[1], C.rand[2])
  doc.setLineWidth(0.3)
  doc.line(20, y, 190, y)
}

function sectionTitle(doc: jsPDF, y: number, icon: string, title: string): number {
  y = pageBreak(doc, y, 20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(C.primary[0], C.primary[1], C.primary[2])
  doc.text(`${icon}  ${title}`, 20, y)
  y += 3
  drawLine(doc, y)
  return y + 7
}

function bullet(doc: jsPDF, y: number, text: string, kleur: readonly [number, number, number] = C.primary): number {
  y = pageBreak(doc, y, 7)
  doc.setFillColor(kleur[0], kleur[1], kleur[2])
  doc.circle(23, y - 1, 1.5, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(C.tekst[0], C.tekst[1], C.tekst[2])
  const lines = doc.splitTextToSize(text, 160)
  doc.text(lines, 28, y)
  return y + lines.length * 4.5 + 2
}

function infoCard(doc: jsPDF, y: number, bgKleur: readonly [number, number, number], randKleur: readonly [number, number, number], titel: string, tekst: string): number {
  y = pageBreak(doc, y, 28)
  const lines = doc.splitTextToSize(tekst, 155)
  const cardHeight = 14 + lines.length * 4
  // Achtergrond
  doc.setFillColor(bgKleur[0], bgKleur[1], bgKleur[2])
  doc.roundedRect(20, y, 170, cardHeight, 3, 3, "F")
  // Linker accent rand
  doc.setFillColor(randKleur[0], randKleur[1], randKleur[2])
  doc.roundedRect(20, y, 4, cardHeight, 2, 0, "F")
  // Titel
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(randKleur[0], randKleur[1], randKleur[2])
  doc.text(titel, 30, y + 9)
  // Tekst
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(C.tekst[0], C.tekst[1], C.tekst[2])
  doc.text(lines, 30, y + 16)
  return y + cardHeight + 6
}

function orgCard(doc: jsPDF, y: number, org: Hulpbron): number {
  y = pageBreak(doc, y, 14)
  // Achtergrond
  doc.setFillColor(C.lichtgrijs[0], C.lichtgrijs[1], C.lichtgrijs[2])
  doc.roundedRect(24, y, 166, 11, 2, 2, "F")
  // Naam
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(C.donker[0], C.donker[1], C.donker[2])
  doc.text(org.naam, 28, y + 5)
  // Contact
  const contact = [org.telefoon, org.website].filter(Boolean).join("  |  ")
  if (contact) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(C.grijs[0], C.grijs[1], C.grijs[2])
    doc.text(contact, 28, y + 9.5)
  }
  return y + 13
}

// ==========================================
// HOOFD GENERATIE FUNCTIE
// ==========================================
export function generatePdfRapport(data: PdfRapportData): void {
  const { test, hulpbronnen } = data
  const doc = new jsPDF("p", "mm", "a4")
  const kleur = niveauKleur(test.belastingNiveau)
  const bg = niveauBg(test.belastingNiveau)
  const datum = new Date(test.completedAt).toLocaleDateString("nl-NL", {
    day: "numeric", month: "long", year: "numeric",
  })

  // ==========================================
  // PAGINA 1: HEADER
  // ==========================================
  // Paarse header balk
  doc.setFillColor(C.primary[0], C.primary[1], C.primary[2])
  doc.rect(0, 0, 210, 42, "F")

  // App naam
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text("MantelBuddy", 20, 16)

  // Subtitel
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255, 200)
  doc.text("Persoonlijk Adviesrapport", 20, 25)

  // Naam en datum
  doc.setFontSize(9)
  const meta = [test.voornaam, datum, test.gemeente].filter(Boolean).join("   |   ")
  doc.text(meta, 20, 35)

  let y = 52

  // ==========================================
  // SCORE OVERZICHT
  // ==========================================
  // Score kaart
  doc.setFillColor(bg[0], bg[1], bg[2])
  doc.roundedRect(20, y, 170, 38, 4, 4, "F")

  // Linker accent
  doc.setFillColor(kleur[0], kleur[1], kleur[2])
  doc.roundedRect(20, y, 5, 38, 3, 0, "F")

  // Score getal groot
  doc.setFont("helvetica", "bold")
  doc.setFontSize(32)
  doc.setTextColor(kleur[0], kleur[1], kleur[2])
  doc.text(`${test.totaleBelastingScore}`, 38, y + 18)

  // Score max
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(C.grijs[0], C.grijs[1], C.grijs[2])
  doc.text("/24", 38 + doc.getTextWidth(`${test.totaleBelastingScore}`) * 2.6, y + 18)

  // Niveau label
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(kleur[0], kleur[1], kleur[2])
  doc.text(niveauLabel(test.belastingNiveau), 80, y + 14)

  // Zorguren
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(C.tekst[0], C.tekst[1], C.tekst[2])
  doc.text(`${test.totaleZorguren} uur zorg per week`, 80, y + 22)

  // Thermometer balk
  const balkX = 80
  const balkW = 100
  const balkY = y + 27
  doc.setFillColor(C.rand[0], C.rand[1], C.rand[2])
  doc.roundedRect(balkX, balkY, balkW, 5, 2.5, 2.5, "F")
  const scoreW = Math.max((test.totaleBelastingScore / 24) * balkW, 5)
  doc.setFillColor(kleur[0], kleur[1], kleur[2])
  doc.roundedRect(balkX, balkY, scoreW, 5, 2.5, 2.5, "F")

  // Zone labels onder balk
  doc.setFontSize(6)
  doc.setTextColor(C.groen[0], C.groen[1], C.groen[2])
  doc.text("Laag", balkX, balkY + 8)
  doc.setTextColor(C.oranje[0], C.oranje[1], C.oranje[2])
  doc.text("Gemiddeld", balkX + balkW / 2 - 5, balkY + 8)
  doc.setTextColor(C.rood[0], C.rood[1], C.rood[2])
  doc.text("Hoog", balkX + balkW - 8, balkY + 8)

  y += 48

  // ==========================================
  // SIGNALEN (als er alarmen zijn)
  // ==========================================
  if (test.alarmLogs.length > 0) {
    y = sectionTitle(doc, y, "!", "Belangrijke signalen")
    for (const alarm of test.alarmLogs) {
      const tekst: Record<string, string> = {
        HOGE_BELASTING: "Je belastingscore is hoog. Dit wijst op overbelasting.",
        KRITIEKE_COMBINATIE: "Zorgwekkende combinatie: slaapproblemen, lichamelijke klachten en veranderde relatie.",
        EMOTIONELE_NOOD: "De zorg slokt al je energie op en kost evenveel tijd als een baan.",
        SOCIAAL_ISOLEMENT: "Je mist activiteiten die je leuk vindt en ervaart verdriet.",
      }
      y = infoCard(doc, y, C.roodBg, C.rood, "Let op", tekst[alarm.type] || alarm.beschrijving)
    }
  }

  // ==========================================
  // ADVIES VOOR JOU
  // ==========================================
  y = sectionTitle(doc, y, ">>", "Advies voor jou als mantelzorger")

  if (test.belastingNiveau === "HOOG") {
    y = infoCard(doc, y, C.roodBg, C.rood,
      "Je bent overbelast",
      "Het is belangrijk dat je snel hulp zoekt. Je doet te veel en dat is niet vol te houden. Neem vandaag nog stappen."
    )
    const acties = [
      "Neem contact op met je huisarts en bespreek hoe het gaat",
      "Bel je gemeente voor WMO-ondersteuning of mantelzorgsteunpunt",
      "Vraag vervangende mantelzorg aan zodat jij even rust kunt nemen",
      "Praat erover met iemand die je vertrouwt",
    ]
    for (const a of acties) { y = bullet(doc, y, a, C.rood) }

  } else if (test.belastingNiveau === "GEMIDDELD") {
    y = infoCard(doc, y, C.oranjeBg, C.oranje,
      "Je balans staat onder druk",
      "Met de juiste hulp kun je het beter volhouden. Zoek hulp bij de taken die het zwaarst zijn."
    )
    const acties = [
      "Zoek hulp bij de taken die het zwaarst zijn",
      "Plan vaste rustmomenten in je week",
      "Praat met je huisarts als je merkt dat het te veel wordt",
      "Bekijk welke hulp er in je gemeente beschikbaar is",
    ]
    for (const a of acties) { y = bullet(doc, y, a, C.oranje) }

  } else {
    y = infoCard(doc, y, C.groenBg, C.groen,
      "Goed bezig!",
      "Je hebt een goede balans. Blijf goed voor jezelf zorgen."
    )
    const tips = [
      "Plan elke dag iets leuks voor jezelf",
      "Doe deze test regelmatig om je balans te checken",
      "Vraag hulp voordat je het echt nodig hebt",
    ]
    for (const t of tips) { y = bullet(doc, y, t, C.groen) }
  }

  // Hulpbronnen voor mantelzorger
  if (hulpbronnen.voorMantelzorger.length > 0) {
    y += 3
    y = pageBreak(doc, y, 16)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(C.primary[0], C.primary[1], C.primary[2])
    doc.text(
      hulpbronnen.mantelzorgerGemeente
        ? `Hulp voor jou in ${hulpbronnen.mantelzorgerGemeente}`
        : "Hulp voor jou",
      24, y
    )
    y += 6
    for (const org of hulpbronnen.voorMantelzorger.slice(0, 6)) {
      y = orgCard(doc, y, org)
    }
  }

  y += 6

  // ==========================================
  // HULP VOOR JE NAASTE
  // ==========================================
  const geselecteerdeTaken = test.taakSelecties.filter(t => t.isGeselecteerd)
  const zwareTakenLijst = geselecteerdeTaken.filter(t => {
    const z = zwaarteTekst(t.moeilijkheid)
    return z === "Zwaar" || z === "Matig" || z === "Gemiddeld"
  })

  if (zwareTakenLijst.length > 0) {
    y = sectionTitle(doc, y, ">>", "Hulp voor je naaste")

    for (const taak of zwareTakenLijst) {
      y = pageBreak(doc, y, 22)
      const tk = zwaarteKleur(taak.moeilijkheid)

      // Taak naam + zwaarte badge
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(C.donker[0], C.donker[1], C.donker[2])
      doc.text(taak.taakNaam, 24, y)

      // Badge
      const badgeTekst = zwaarteTekst(taak.moeilijkheid)
      const badgeX = 24 + doc.getTextWidth(taak.taakNaam) + 4
      doc.setFillColor(tk[0], tk[1], tk[2])
      doc.roundedRect(badgeX, y - 3.5, doc.getTextWidth(badgeTekst) * 0.55 + 6, 5, 2.5, 2.5, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(6)
      doc.setTextColor(255, 255, 255)
      doc.text(badgeTekst, badgeX + 3, y - 0.5)
      y += 5

      // Hulptip
      doc.setFont("helvetica", "italic")
      doc.setFontSize(8)
      doc.setTextColor(C.tekst[0], C.tekst[1], C.tekst[2])
      const tip = hulpTip(taak.taakId)
      const tipLines = doc.splitTextToSize(tip, 155)
      doc.text(tipLines, 24, y)
      y += tipLines.length * 4 + 3

      // Organisaties
      const orgs = hulpbronnen.perTaak[taak.taakNaam] || []
      for (const org of orgs.slice(0, 3)) {
        y = orgCard(doc, y, org)
      }
      y += 4
    }
  }

  // ==========================================
  // ZORGTAKEN OVERZICHT (tabel)
  // ==========================================
  if (geselecteerdeTaken.length > 0) {
    y = pageBreak(doc, y, 30)
    y = sectionTitle(doc, y, "#", "Jouw zorgtaken")

    autoTable(doc, {
      startY: y,
      head: [["Taak", "Uren/week", "Zwaarte"]],
      body: geselecteerdeTaken.map(t => [
        t.taakNaam,
        t.urenPerWeek ? `${t.urenPerWeek} uur` : "-",
        zwaarteTekst(t.moeilijkheid),
      ]),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        textColor: [C.tekst[0], C.tekst[1], C.tekst[2]],
        lineColor: [C.rand[0], C.rand[1], C.rand[2]],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [C.primary[0], C.primary[1], C.primary[2]],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 35, halign: "center" },
        2: { cellWidth: 40, halign: "center", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [C.lichtgrijs[0], C.lichtgrijs[1], C.lichtgrijs[2]],
      },
      didParseCell: (data: CellHookData) => {
        if (data.section === "body" && data.column.index === 2) {
          const val = data.cell.raw as string
          if (val === "Zwaar") data.cell.styles.textColor = [C.rood[0], C.rood[1], C.rood[2]]
          else if (val === "Matig" || val === "Gemiddeld") data.cell.styles.textColor = [C.oranje[0], C.oranje[1], C.oranje[2]]
          else data.cell.styles.textColor = [C.groen[0], C.groen[1], C.groen[2]]
        }
      },
      margin: { left: 20, right: 20 },
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ==========================================
  // ANTWOORDEN (tabel)
  // ==========================================
  y = pageBreak(doc, y, 30)
  y = sectionTitle(doc, y, "?", "Jouw antwoorden")

  autoTable(doc, {
    startY: y,
    head: [["#", "Vraag", "Antwoord"]],
    body: test.antwoorden.map((a, i) => [
      `${i + 1}`,
      a.vraagTekst,
      antwoordLabel(a.antwoord),
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
      textColor: [C.tekst[0], C.tekst[1], C.tekst[2]],
      lineColor: [C.rand[0], C.rand[1], C.rand[2]],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [C.primary[0], C.primary[1], C.primary[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 125 },
      2: { cellWidth: 25, halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [C.lichtgrijs[0], C.lichtgrijs[1], C.lichtgrijs[2]],
    },
    didParseCell: (data: CellHookData) => {
      if (data.section === "body" && data.column.index === 2) {
        const val = data.cell.raw as string
        if (val === "Ja") data.cell.styles.textColor = [C.rood[0], C.rood[1], C.rood[2]]
        else if (val === "Soms") data.cell.styles.textColor = [C.oranje[0], C.oranje[1], C.oranje[2]]
        else data.cell.styles.textColor = [C.groen[0], C.groen[1], C.groen[2]]
      }
    },
    margin: { left: 20, right: 20 },
  })

  y = (doc as any).lastAutoTable.finalY + 10

  // ==========================================
  // BELANGRIJKE CONTACTEN
  // ==========================================
  y = pageBreak(doc, y, 45)
  y = sectionTitle(doc, y, "T", "Belangrijke contacten")

  const contacten = [
    { naam: "Je huisarts", info: "Bespreek hoe het met je gaat" },
    { naam: "WMO loket gemeente", info: hulpbronnen.mantelzorgerGemeente ? `Gemeente ${hulpbronnen.mantelzorgerGemeente}` : "Vraag hulp aan bij je gemeente" },
    { naam: "Mantelzorglijn", info: "0900-2020 496 (lokaal tarief)" },
  ]

  for (const c of contacten) {
    y = pageBreak(doc, y, 12)
    doc.setFillColor(C.primaryBg[0], C.primaryBg[1], C.primaryBg[2])
    doc.roundedRect(20, y, 170, 10, 2, 2, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(C.primary[0], C.primary[1], C.primary[2])
    doc.text(c.naam, 26, y + 6.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(C.tekst[0], C.tekst[1], C.tekst[2])
    doc.text(c.info, 85, y + 6.5)
    y += 13
  }

  // ==========================================
  // FOOTER op elke pagina
  // ==========================================
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    // Dunne lijn
    doc.setDrawColor(C.rand[0], C.rand[1], C.rand[2])
    doc.setLineWidth(0.3)
    doc.line(20, 286, 190, 286)
    // Tekst
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(C.grijs[0], C.grijs[1], C.grijs[2])
    doc.text("MantelBuddy  |  Persoonlijk Adviesrapport", 20, 291)
    doc.text(`${datum}  |  Pagina ${p}/${pages}`, 190, 291, { align: "right" })
  }

  // Download
  const bestand = `MantelBuddy-Rapport-${test.voornaam}-${new Date(test.completedAt).toISOString().slice(0, 10)}.pdf`
  doc.save(bestand)
}
