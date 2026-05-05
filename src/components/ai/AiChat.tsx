"use client"

import DOMPurify from "isomorphic-dompurify"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { parseHulpkaarten, HulpKaart, cleanRemainingMarkers } from "@/components/ai/HulpKaart"
import type { ParsedHulpkaart } from "@/components/ai/HulpKaart"
import { parseArtikelkaarten, ArtikelKaart } from "@/components/ai/ArtikelKaart"
import type { ParsedArtikelkaart } from "@/components/ai/ArtikelKaart"

/**
 * Tegel voor de drie hoofdrichtingen die Ger aanbiedt bij het start van een gesprek:
 * 1. Hulp voor de mantelzorger zelf
 * 2. Hulp bij een taak voor de zorgvrager
 * 3. Even praten over hoe het gaat
 */
interface KeuzeTegel {
  emoji: string
  titel: string
  omschrijving: string
  actie: string
}

/**
 * Button syntax for Ger:
 *   {{knop:Label:/pad}}        → navigation button (goes to /pad)
 *   {{vraag:Vraagtekst}}       → chat action button (sends text to Ger)
 */
const BUTTON_REGEX = /\{\{(knop|vraag):([^}]+)\}\}/g

interface ParsedButton {
  type: "knop" | "vraag"
  label: string
  target: string // path for knop, question text for vraag
}

function parseButtons(text: string): { cleanText: string; buttons: ParsedButton[] } {
  const buttons: ParsedButton[] = []
  const cleanText = text.replace(BUTTON_REGEX, (_, type: string, content: string) => {
    if (type === "knop") {
      // Format: knop:Label:/pad
      const lastColon = content.lastIndexOf(":/")
      if (lastColon !== -1) {
        buttons.push({
          type: "knop",
          label: content.substring(0, lastColon).trim(),
          target: content.substring(lastColon + 1).trim(),
        })
      }
    } else if (type === "vraag") {
      // Format: vraag:Tekst
      buttons.push({
        type: "vraag",
        label: content.trim(),
        target: content.trim(),
      })
    }
    return "" // Remove button markers from text
  })
  return { cleanText: cleanText.trimEnd(), buttons }
}

export function AiChat() {
  const router = useRouter()
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      // Convert UI messages (parts format) to model messages (content format)
      // before sending to server, so streamText receives valid ModelMessage[]
      prepareSendMessagesRequest: async ({ messages: msgs, body, ...rest }) => {
        const converted = msgs
          .map((msg) => ({
            role: msg.role,
            content: msg.parts
              ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join("") || "",
          }))
          // Filter lege berichten (tool-call stappen zonder tekst) — die laten de API crashen
          .filter((msg) => msg.content.trim() !== "")

        // Verzamel hulpbron-namen en artikel-titels die Ger eerder in dit gesprek
        // heeft getoond, zodat de server kan variëren in nieuwe suggesties.
        const shownHulpbronnen = new Set<string>()
        const shownArtikelen = new Set<string>()
        for (const msg of msgs) {
          if (msg.role !== "assistant") continue
          const text = msg.parts
            ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("") || ""
          for (const m of text.matchAll(/\{\{hulpkaart:([\s\S]*?)\}\}/g)) {
            const naam = m[1].split("|")[0]?.trim()
            if (naam) shownHulpbronnen.add(naam)
          }
          for (const m of text.matchAll(/\{\{artikelkaart:([\s\S]*?)\}\}/g)) {
            const titel = m[1].split("|")[0]?.trim()
            if (titel) shownArtikelen.add(titel)
          }
        }

        return {
          ...rest,
          body: {
            ...body,
            messages: converted,
            shownHulpbronnen: [...shownHulpbronnen],
            shownArtikelen: [...shownArtikelen],
          },
        }
      },
    }),
  })
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [persistedKaarten, setPersistedKaarten] = useState<ParsedHulpkaart[]>([])
  const [persistedArtikelen, setPersistedArtikelen] = useState<ParsedArtikelkaart[]>([])

  const isLoading = status === "submitted" || status === "streaming"

  // Gepersonaliseerde welkomst + drie keuze-tegels (ophalen uit /api/ai/opener)
  const FALLBACK_OPENER =
    "Hoi! Fijn dat je er bent. Waar kan ik je vandaag mee helpen?"
  const FALLBACK_TEGELS: KeuzeTegel[] = [
    {
      emoji: "🧑",
      titel: "Hulp voor mij zelf",
      omschrijving: "Steunpunt, lotgenoten, even op adem komen",
      actie: "Ik wil hulp voor mij zelf",
    },
    {
      emoji: "🤝",
      titel: "Hulp bij een taak voor mijn naaste",
      omschrijving: "Boodschappen, verzorging, vervoer, huishouden",
      actie: "Ik zoek hulp bij een taak voor mijn naaste",
    },
    {
      emoji: "💬",
      titel: "Even praten over hoe het gaat",
      omschrijving: "Vertel hoe je je voelt, ik luister mee",
      actie: "Ik wil even vertellen hoe het met me gaat",
    },
  ]
  const [opener, setOpener] = useState<string>(FALLBACK_OPENER)
  const [keuzeTegels, setKeuzeTegels] = useState<KeuzeTegel[]>(FALLBACK_TEGELS)

  useEffect(() => {
    let cancelled = false
    fetch("/api/ai/opener")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        if (typeof data.opener === "string" && data.opener.trim()) {
          setOpener(data.opener.trim())
        }
        if (Array.isArray(data.keuzeTegels) && data.keuzeTegels.length > 0) {
          setKeuzeTegels(data.keuzeTegels as KeuzeTegel[])
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false)
    }
  }, [messages.length])

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isLoading) return
    sendMessage({ text: text.trim() })
    setInput("")
  }, [isLoading, sendMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
  }

  const handleButtonClick = useCallback((button: ParsedButton) => {
    if (button.type === "knop") {
      router.push(button.target)
    } else {
      handleSend(button.target)
    }
  }, [router, handleSend])

  // Haal tekst uit message parts (AI SDK v6)
  const getMessageText = (message: typeof messages[number]): string => {
    const parts = message.parts
    if (!parts || parts.length === 0) return ""
    return parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  // Cumulatieve verzameling: hulp- en artikelkaarten uit ALLE assistant-berichten,
  // gededupliceerd op naam/titel. Nieuwste eerst zodat de meest recente bovenaan staat.
  // Caps voorkomen dat de lijst onbeperkt groeit.
  const MAX_HULP = 6
  const MAX_ARTIKEL = 6
  useEffect(() => {
    if (isLoading) return
    const hulpMap = new Map<string, ParsedHulpkaart>()
    const artMap = new Map<string, ParsedArtikelkaart>()
    // Loop van nieuw naar oud zodat de eerste hit (= recentste) bewaard wordt
    for (const msg of [...messages].reverse()) {
      if (msg.role !== "assistant") continue
      const raw = getMessageText(msg)
      if (!raw) continue
      const { kaarten } = parseHulpkaarten(raw)
      const { artikelen } = parseArtikelkaarten(raw)
      for (const k of kaarten) {
        const key = (k.naam || "").toLowerCase().trim()
        if (key && !hulpMap.has(key)) hulpMap.set(key, k)
      }
      for (const a of artikelen) {
        const key = (a.titel || "").toLowerCase().trim()
        if (key && !artMap.has(key)) artMap.set(key, a)
      }
    }
    setPersistedKaarten(Array.from(hulpMap.values()).slice(0, MAX_HULP))
    setPersistedArtikelen(Array.from(artMap.values()).slice(0, MAX_ARTIKEL))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isLoading])

  // Detecteer welke tool Ger op dit moment uitvoert (voor de loading-status).
  // AI SDK v6: tool-parts hebben type "tool-<naam>"; oudere varianten zetten
  // toolName op de part. Defensief gecheckt zodat het bij beide werkt.
  const TOOL_STATUS: Record<string, string> = {
    zoekHulpbronnen: "Ger zoekt lokale hulp voor je",
    zoekArtikelen: "Ger zoekt artikelen die kunnen helpen",
    semantischZoeken: "Ger zoekt informatie over dit onderwerp",
    gemeenteInfo: "Ger bekijkt info van jouw gemeente",
    bekijkTestTrend: "Ger bekijkt jouw balans-trend",
    bekijkBalanstest: "Ger bekijkt jouw balanstest",
    bekijkCheckInTrend: "Ger bekijkt je check-in trend",
    bekijkGemeenteAdvies: "Ger zoekt advies in jouw gemeente",
    slaActiepuntOp: "Ger noteert dit voor je",
    registreerAlarm: "Ger zet dit veilig in je dossier",
    genereerRapportSamenvatting: "Ger maakt een samenvatting",
  }

  const activeToolStatus: string | null = (() => {
    if (!isLoading) return null
    const lastA = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastA?.parts) return null
    for (const part of lastA.parts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = part as any
      if (typeof p.type === "string" && p.type.startsWith("tool-")) {
        const naam = p.type.slice(5)
        if (TOOL_STATUS[naam]) return TOOL_STATUS[naam]
      }
      if (typeof p.toolName === "string" && TOOL_STATUS[p.toolName]) {
        return TOOL_STATUS[p.toolName]
      }
    }
    return null
  })()

  // Vraagknoppen uit het laatste assistant-bericht
  const lastVraagknoppen = (() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant")
    if (!lastAssistant) return []
    const raw = getMessageText(lastAssistant)
    if (!raw) return []
    const { cleanText: t1 } = parseHulpkaarten(raw)
    const { cleanText: t2 } = parseArtikelkaarten(t1)
    const { buttons } = parseButtons(t2)
    return buttons.filter(b => b.type === "vraag").slice(0, 3)
  })()

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
      {/* Chat berichten */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welkomstbericht */}
        {messages.length === 0 && (
          <div className="flex gap-3 items-start">
            <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="bg-[var(--accent-amber-bg)]/40 border border-[var(--accent-amber)]/10 rounded-2xl rounded-tl-sm p-3.5 shadow-sm">
                <p className="font-semibold text-foreground mb-1">Hoi! Ik ben Ger</p>
                <p className="text-sm text-muted-foreground">{opener}</p>
                <p className="text-xs text-muted-foreground/60 mt-2 italic">
                  Ger is een digitale assistent, geen hulpverlener. Bij acute nood, bel 113 of je huisarts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Drie keuze-tegels: hulp voor mantelzorger, hulp bij taak voor zorgvrager, of even praten */}
        {showSuggestions && messages.length === 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-1">
              Waarmee kan ik je vandaag helpen?
            </p>
            {keuzeTegels.map((tegel, i) => (
              <button
                key={i}
                onClick={() => handleSend(tegel.actie)}
                className="w-full flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-[var(--accent-amber-bg)]/30 hover:border-[var(--accent-amber)]/30 transition-all text-left active:scale-[0.99]"
              >
                <span className="text-2xl flex-shrink-0 leading-none mt-0.5" aria-hidden>
                  {tegel.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{tegel.titel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {tegel.omschrijving}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Berichten */}
        {messages.map((message) => {
          const rawText = getMessageText(message)
          if (!rawText) return null

          const isAssistant = message.role === "assistant"
          // Parse hulpkaarten, artikelkaarten, dan knoppen
          const { cleanText: textWithoutCards, kaarten } = isAssistant
            ? parseHulpkaarten(rawText)
            : { cleanText: rawText, kaarten: [] }
          const { cleanText: textWithoutArticles, artikelen } = isAssistant
            ? parseArtikelkaarten(textWithoutCards)
            : { cleanText: textWithoutCards, artikelen: [] }
          const { cleanText: textWithoutButtons, buttons } = isAssistant
            ? parseButtons(textWithoutArticles)
            : { cleanText: textWithoutArticles, buttons: [] }
          const cleanText = isAssistant ? cleanRemainingMarkers(textWithoutButtons) : textWithoutButtons
          // kaarten, artikelen en knoppen worden apart buiten de bubble gerenderd

          // Gebruikersbericht
          if (message.role === "user") {
            return (
              <div key={message.id} className="flex justify-end pl-12">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[85%]">
                  <p className="text-sm leading-relaxed">{cleanText}</p>
                </div>
              </div>
            )
          }

          // Ger-bericht: bubble = alleen tekst
          return (
            <div key={message.id} className="flex gap-3 items-start pr-8">
              <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {cleanText && (
                  <div className="bg-[var(--accent-amber-bg)]/40 border border-[var(--accent-amber)]/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {formatMessage(cleanText)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Laden */}
        {isLoading && (
          <div className="flex gap-3 items-start pr-8">
            <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mt-0.5" />
            <div className="bg-[var(--accent-amber-bg)]/40 border border-[var(--accent-amber)]/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-muted-foreground">{activeToolStatus ?? "Ger typt"}…</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex gap-3 items-start pr-8">
            <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mt-0.5 opacity-50" />
            <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-2xl rounded-tl-sm p-3.5">
              <p className="text-sm text-foreground">
                {error.message?.includes("503") || error.message?.includes("niet beschikbaar")
                  ? "De AI-assistent is tijdelijk niet beschikbaar. Neem contact op met de beheerder."
                  : "Oeps, dat lukte niet. Probeer het opnieuw."
                }
              </p>
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")
                  if (lastUserMsg) {
                    const text = lastUserMsg.parts
                      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                      .map(p => p.text)
                      .join("") || ""
                    if (text) handleSend(text)
                  }
                }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Opnieuw proberen
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type hier jouw vraag of kies een van onderstaande vragen"
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "p-3 rounded-xl transition-all flex-shrink-0",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground"
            )}
            aria-label="Verstuur bericht"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        {/* Vraagknoppen als spraakbubbels — onder input, rechts uitgelijnd */}
        {lastVraagknoppen.length > 0 && !isLoading && (
          <div className="mt-2 flex flex-col gap-1.5 items-end">
            {lastVraagknoppen.map((btn, i) => (
              <button
                key={`s-${i}`}
                onClick={() => handleButtonClick(btn)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl rounded-br-sm text-sm transition-all text-left bg-primary/8 border border-primary/15 text-foreground hover:bg-primary/15 hover:border-primary/25 active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 text-primary/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hulpkaarten & artikelkaarten — blijven staan tot er nieuwe komen */}
        {(persistedKaarten.length > 0 || persistedArtikelen.length > 0) && !isLoading && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {persistedKaarten.length > 0 && persistedArtikelen.length > 0
                ? "Hulp en informatie voor jou"
                : persistedKaarten.length > 0
                  ? "Hulp voor jou en jouw naaste"
                  : "Informatie voor jou"
              }
            </p>
            <div className="flex flex-col gap-1.5">
              {persistedKaarten.map((kaart, i) => (
                <HulpKaart key={`h-${i}`} kaart={kaart} />
              ))}
              {persistedArtikelen.map((artikel, i) => (
                <ArtikelKaart key={`art-${i}`} artikel={artikel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatMessage(content: string): React.ReactNode {
  const lines = content.split("\n")
  return lines.map((line, i) => {
    // Bold
    const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-primary">•</span>
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted.slice(2)) }} />
        </div>
      )
    }

    if (formatted !== line) {
      return <p key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }} />
    }

    return line ? <p key={i}>{line}</p> : <br key={i} />
  })
}
