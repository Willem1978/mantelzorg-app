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

const BUTTON_REGEX = /\{\{(knop|vraag):([^}]+)\}\}/g

interface ParsedButton {
  type: "knop" | "vraag"
  label: string
  target: string
}

function parseButtons(text: string): { cleanText: string; buttons: ParsedButton[] } {
  const buttons: ParsedButton[] = []
  const cleanText = text.replace(BUTTON_REGEX, (_, type: string, content: string) => {
    if (type === "knop") {
      const lastColon = content.lastIndexOf(":/")
      if (lastColon !== -1) {
        buttons.push({
          type: "knop",
          label: content.substring(0, lastColon).trim(),
          target: content.substring(lastColon + 1).trim(),
        })
      }
    } else if (type === "vraag") {
      buttons.push({
        type: "vraag",
        label: content.trim(),
        target: content.trim(),
      })
    }
    return ""
  })
  return { cleanText: cleanText.replace(/\n{3,}/g, "\n\n").trim(), buttons }
}

export interface GerChatContext {
  userName: string
  naasteNaam?: string | null
  hasTest: boolean
  hasProfile: boolean
  niveau?: "LAAG" | "GEMIDDELD" | "HOOG" | null
  score?: number | null
  zwareTaken?: number
  zwareTaakNaam?: string | null
  needsNewTest?: boolean
  checkInDone?: boolean
  isFirstVisit?: boolean
  trend?: "improved" | "same" | "worse" | null
  wellbeingTrend?: "up" | "down" | "stable" | null
  daysSinceTest?: number | null
  openTasks?: number
  overdueTasks?: number
}

/**
 * Bouwt drie chips met de drie vaste kompas-dimensies van Ger:
 *   A. VOOR JOU              — hulp voor de mantelzorger zelf
 *   B. VOOR JE NAASTE        — hulp bij een taak die je voor de naaste doet
 *   C. INFORMATIE / ARTIKEL  — iets opzoeken, niet direct hulp
 *
 * Deze drie blijven onder elke chat zichtbaar als kompas. De labels van A
 * variëren licht op de stemming/trend, B gebruikt de naam van de naaste,
 * C is altijd de informatie-ingang.
 */
function buildProactiveActions(ctx: GerChatContext): { label: string; emoji: string; action: string; color: string }[] {
  if (ctx.hasTest) {
    // A — voor jou (mantelzorger zelf)
    let voorJouLabel: string
    let voorJouEmoji: string
    let voorJouColor: string
    if (ctx.trend === "worse" || ctx.wellbeingTrend === "down") {
      voorJouLabel = "Het gaat niet zo goed met mij"
      voorJouEmoji = "💬"
      voorJouColor = "blue"
    } else {
      voorJouLabel = "Ik wil hulp voor mijzelf"
      voorJouEmoji = ctx.niveau === "HOOG" ? "❤️" : "🧑"
      voorJouColor = ctx.niveau === "HOOG" ? "rose" : "sky"
    }

    // B — voor je naaste (taak overdragen)
    const naasteLabel = ctx.naasteNaam?.trim() || "mijn naaste"
    const voorNaasteLabel = `Ik wil hulp bij een taak die ik voor ${naasteLabel} doe`

    // C — informatie zoeken (artikelen)
    const informatieLabel = "Ik ben op zoek naar informatie"

    return [
      { label: voorJouLabel, emoji: voorJouEmoji, action: "vraag", color: voorJouColor },
      { label: voorNaasteLabel, emoji: "🤝", action: "vraag", color: "amber" },
      { label: informatieLabel, emoji: "📚", action: "vraag", color: "purple" },
    ]
  }

  if (ctx.hasProfile) {
    return [
      { label: "Start de balanstest", emoji: "📊", action: "/belastbaarheidstest", color: "purple" },
      { label: "Wat is de balanstest?", emoji: "❓", action: "vraag", color: "sky" },
      { label: "Ik ben op zoek naar informatie", emoji: "📚", action: "vraag", color: "amber" },
    ]
  }

  return [
    { label: "Wat kan ik hier doen?", emoji: "💡", action: "vraag", color: "amber" },
    { label: "Maak mijn profiel aan", emoji: "👤", action: "/profiel", color: "sky" },
    { label: "Start de balanstest", emoji: "📊", action: "/belastbaarheidstest", color: "purple" },
  ]
}

function buildGreetingMessage(ctx: GerChatContext): string {
  const naam = ctx.userName || "daar"

  if (ctx.hasTest) {
    if (ctx.trend === "worse" || ctx.wellbeingTrend === "down") {
      return `Hey ${naam}, fijn dat je er bent. Ik ben er voor je. Wat houdt je bezig?`
    }
    if (ctx.trend === "improved" || ctx.wellbeingTrend === "up") {
      return `Hey ${naam}, goed je te zien! Het gaat de goede kant op. Wat kan ik voor je doen?`
    }
    if (ctx.overdueTasks && ctx.overdueTasks > 0) {
      return `Hey ${naam}, fijn dat je er weer bent! Er staan nog een paar dingen open. Waar wil je mee beginnen?`
    }
    if (ctx.needsNewTest && ctx.daysSinceTest && ctx.daysSinceTest > 30) {
      return `Hey ${naam}, leuk je weer te zien! Het is even geleden. Hoe gaat het met je?`
    }
    if (ctx.niveau === "HOOG") {
      return `Hey ${naam}, goed dat je er bent. Ik ben er voor je. Vertel, wat speelt er?`
    }
    if (ctx.zwareTaakNaam) {
      return `Hey ${naam}! Vorige keer hadden we het over ${ctx.zwareTaakNaam}. Hoe gaat het daarmee?`
    }
    return `Hey ${naam}, fijn dat je er weer bent! Waar kan ik je mee helpen?`
  }

  if (ctx.hasProfile) {
    return `Hey ${naam}, welkom terug! Wil je de balanstest doen? Dan kan ik je veel gerichter helpen.`
  }

  return `Hey ${naam}! Welkom bij MantelBuddy. Ik ben Ger, je persoonlijke coach. Vertel, wat wil je weten?`
}

export function DashboardGerChat({ context }: { context?: GerChatContext }) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState("")
  const [persistedKaarten, setPersistedKaarten] = useState<ParsedHulpkaart[]>([])
  const [persistedArtikelen, setPersistedArtikelen] = useState<ParsedArtikelkaart[]>([])

  const ctx: GerChatContext = context || {
    userName: "daar",
    hasTest: false,
    hasProfile: false,
  }

  const greetingMessage = buildGreetingMessage(ctx)
  const proactiveActions = buildProactiveActions(ctx)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/balanscoach",
      prepareSendMessagesRequest: async ({ messages: msgs, body, ...rest }) => {
        const converted = msgs.map((msg) => ({
          role: msg.role,
          content: msg.parts
            ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("") || "",
        }))
        return { ...rest, body: { ...body, messages: converted, pagina: "dashboard" } }
      },
    }),
  })

  const isLoading = status === "submitted" || status === "streaming"
  const hasMessages = messages.length > 0

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant")
  const lastAssistantHasText = lastAssistantMsg?.parts?.some(
    (p): p is { type: "text"; text: string } => p.type === "text" && !!p.text.trim()
  ) ?? false
  const showTypingIndicator = isLoading && !lastAssistantHasText

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Hulpkaarten/artikelkaarten bewaren tot er nieuwe komen
  useEffect(() => {
    const lastA = [...messages].reverse().find(m => m.role === "assistant")
    if (!lastA || isLoading) return
    const raw = getMessageText(lastA)
    if (!raw) return
    const { kaarten } = parseHulpkaarten(raw)
    const { artikelen } = parseArtikelkaarten(raw)
    if (kaarten.length > 0) setPersistedKaarten(kaarten.slice(0, 2))
    if (artikelen.length > 0) setPersistedArtikelen(artikelen.slice(0, 3))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isLoading])

  // Vat het gesprek samen wanneer de gebruiker de dashboardpagina verlaat,
  // zodat Ger bij een volgend gesprek kan refereren aan wat besproken is.
  // Werkt zowel bij navigatie weg van dashboard (component-unmount) als bij
  // het sluiten van het tabblad (beforeunload).
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  useEffect(() => {
    const samenvatten = () => {
      const echteBerichten = messagesRef.current
        .map((m) => ({
          role: m.role,
          content: (m.parts ?? [])
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join(""),
        }))
        .filter((m) => m.content.trim() !== "" && !m.content.startsWith("[pagina:"))
      if (echteBerichten.length < 4) return
      try {
        fetch("/api/ai/samenvat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: echteBerichten }),
          keepalive: true,
        }).catch(() => {})
      } catch {
        // negeer
      }
    }
    window.addEventListener("beforeunload", samenvatten)
    return () => {
      window.removeEventListener("beforeunload", samenvatten)
      samenvatten()
    }
  }, [])

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

  const getMessageText = (message: typeof messages[number]): string => {
    const parts = message.parts
    if (!parts || parts.length === 0) return ""
    return parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  return (
    <div className="ker-card flex flex-col relative" style={{ minHeight: "320px" }}>
      {/* Chat berichten container — scrollable area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-3 pb-3"
        style={{ maxHeight: hasMessages ? "50vh" : undefined }}
      >
        {/* Ger begroeting — links met avatar */}
        <div className="flex items-start gap-2.5">
          <GerAvatar size="sm" className="!w-9 !h-9 mt-0.5 flex-shrink-0" animate />
          <div className="max-w-[85%]">
            <div className="bg-primary/10 border border-primary/15 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground font-medium">
                {formatMessage(greetingMessage)}
              </div>
            </div>
          </div>
        </div>

        {/* Chat berichten */}
        {hasMessages && messages.map((message) => {
          const rawText = getMessageText(message)
          if (!rawText) return null

          const isUser = message.role === "user"
          const isAssistant = message.role === "assistant"
          // Parse alles uit tekst — kaarten en knoppen worden apart gerenderd
          const { cleanText: textWithoutCards } = isAssistant
            ? parseHulpkaarten(rawText)
            : { cleanText: rawText }
          const { cleanText: textWithoutArticles } = isAssistant
            ? parseArtikelkaarten(textWithoutCards)
            : { cleanText: textWithoutCards }
          const { cleanText: textWithoutButtons } = isAssistant
            ? parseButtons(textWithoutArticles)
            : { cleanText: textWithoutArticles }
          // Vangnet: strip eventueel overgebleven malformed markers
          const cleanText = isAssistant ? cleanRemainingMarkers(textWithoutButtons) : textWithoutButtons

          if (isUser) {
            return (
              <div key={message.id} className={cn("flex items-end gap-2.5 flex-row-reverse")}>
                <div className="max-w-[75%]">
                  {cleanText && (
                    <div className="rounded-2xl px-3.5 py-2.5 bg-primary text-primary-foreground rounded-br-sm">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground">
                        {formatMessage(cleanText)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          // Ger: bubble = alleen tekst
          return (
            <div key={message.id}>
              <div className="flex items-end gap-2.5">
                <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mb-0.5" />
                <div className="max-w-[80%]">
                  {cleanText && (
                    <div className="bg-primary/10 border border-primary/15 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {formatMessage(cleanText)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {showTypingIndicator && (
          <div className="flex items-end gap-2.5">
            <GerAvatar size="xs" className="!w-8 !h-8 flex-shrink-0 mb-0.5" />
            <div className="bg-primary/10 border border-primary/15 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-muted-foreground">Ger typt...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="pl-[2.625rem]">
            <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-xl p-3 space-y-2">
              <p className="text-sm text-foreground">
                Oeps, dat lukte niet. {error.message && error.message !== "fetch failed" ? error.message : "Probeer het later nog eens."}
              </p>
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")
                  if (lastUserMsg) {
                    const text = getMessageText(lastUserMsg)
                    if (text) sendMessage({ text })
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Opnieuw proberen
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Tekst-invoer — vast onderaan de chat-container */}
      <div className="border-t border-border/60 pt-3 mt-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type hier jouw vraag of kies een van onderstaande vragen"
            className="flex-1 bg-[var(--secondary)] rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                : "bg-muted text-muted-foreground"
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        {/* Proactieve acties — onder input als spraakbubbels (pre-conversatie) */}
        {!hasMessages && proactiveActions.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5 items-end">
            {proactiveActions.map((action, i) => (
              <button
                key={`pa-${i}`}
                onClick={() => {
                  if (action.action.startsWith("/")) {
                    router.push(action.action)
                  } else {
                    handleSend(action.label)
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl rounded-br-sm text-sm transition-all text-left bg-primary/8 border border-primary/15 text-foreground hover:bg-primary/15 hover:border-primary/25 active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 text-primary/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Vraagknoppen als spraakbubbels — onder input, rechts uitgelijnd als gebruikersvragen */}
        {hasMessages && !showTypingIndicator && (() => {
          const lastA = [...messages].reverse().find(m => m.role === "assistant")
          if (!lastA) return null
          const raw = getMessageText(lastA)
          if (!raw) return null
          const { cleanText: t1 } = parseHulpkaarten(raw)
          const { cleanText: t2 } = parseArtikelkaarten(t1)
          const { buttons: btns } = parseButtons(t2)
          const vraagChips = btns.filter(b => b.type === "vraag").slice(0, 3)
          if (vraagChips.length === 0) return null
          return (
            <div className="mt-2 flex flex-col gap-1.5 items-end">
              {vraagChips.map((btn, i) => (
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
          )
        })()}

        {/* Hulpkaarten & artikelkaarten — blijven staan tot er nieuwe komen */}
        {hasMessages && !showTypingIndicator && (persistedKaarten.length > 0 || persistedArtikelen.length > 0) && (
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
    const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-primary">&bull;</span>
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
