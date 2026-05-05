/**
 * AI-based aanvullende crisis-verificatie.
 *
 * De keyword-detector (`crisis-detector.ts`) is fast en deterministisch
 * maar mist subtiele formuleringen ("alles voelt grijs", "ik weet het
 * allemaal niet meer"). Deze module voegt een SNELLE Haiku-call toe die
 * een 1-woord oordeel geeft, gebruikt om "aandacht" te upgraden naar
 * "crisis" wanneer nodig.
 *
 * Ontwerp:
 *   - Wordt alleen aangeroepen als de keyword-check al een aandachtssignaal
 *     vond. Dat houdt kosten en latency beperkt — bij 99% van de berichten
 *     gebeurt deze call niet.
 *   - Faalt stil bij netwerk- of API-fouten en retourneert false. Een AI
 *     die uitvalt mag de chat niet stoppen.
 *   - Maximaal 50 output-tokens; Haiku-prijs maakt dit verwaarloosbaar.
 */

import { generateText } from "ai"
import { getModelForAgent } from "@/lib/ai/models"
import { createLogger } from "@/lib/logger"

const log = createLogger("crisis-ai-check")

const SYSTEM = `Je bent een safety-classifier voor een mantelzorg-chat.
Lees het bericht. Antwoord met ÉÉN woord:
- "ESCALEREN" als de mantelzorger een echt crisis-signaal afgeeft
  (suïcidale gedachten, totale uitputting met wanhoop, gevoel niemand
  te kunnen vertrouwen, fysieke onveiligheid, geweld, "ik weet het
  niet meer" met depressieve ondertoon)
- "ZORG" als er zorg is maar geen acute crisis (vermoeidheid, verdriet,
  frustratie zonder uitzichtloosheid)
- "OK" als het normaal mantelzorg-gespreksonderwerp is

Wees voorzichtig: liever te vaak ESCALEREN dan een echt signaal missen.
Antwoord alleen het ene woord, niets erbij.`

export type AiCrisisOordeel = "escaleren" | "zorg" | "ok" | "fout"

export async function aiCrisisVerificatie(bericht: string): Promise<AiCrisisOordeel> {
  if (!process.env.ANTHROPIC_API_KEY) return "fout"

  try {
    const result = await generateText({
      model: getModelForAgent("ger-chat"),
      system: SYSTEM,
      prompt: bericht.slice(0, 2000),
      maxOutputTokens: 10,
    })
    const woord = result.text.trim().toUpperCase()
    if (woord.includes("ESCALEREN")) return "escaleren"
    if (woord.includes("ZORG")) return "zorg"
    if (woord.includes("OK")) return "ok"
    log.warn({ raw: result.text }, "Onbekend antwoord van AI crisis-check")
    return "fout"
  } catch (err) {
    log.error({ err }, "AI crisis-check faalde")
    return "fout"
  }
}
